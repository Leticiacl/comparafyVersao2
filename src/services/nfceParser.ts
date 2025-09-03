// src/services/nfceParser.ts
import { T, numBR, parseQtyMG, unitMap, capFirst, stripCodigo } from "@/utils/nfce";
import { postReceipt } from "@/services/api";
import { auth } from "@/services/firebase";
import { ENV } from "@/env";

/* ---------------- tipos ---------------- */
export type ReceiptItem = {
  nome: string;
  quantidade: number;
  unidade?: string;  // un | kg | g | l | ml | bd | dz
  peso?: number;     // quando for kg/g/l/ml
  preco: number;     // preço unitário mostrado no app ou total (para peso)
  total?: number;    // total da linha (opcional)
};

export type ReceiptParseResult = {
  name?: string;
  market?: string;
  date?: Date;
  itens: ReceiptItem[];
  totalItems?: number;   // “Qtde total de itens” (rodapé)
  grandTotal?: number;   // “Valor total R$” (rodapé)
};

export type ReceiptMeta = {
  accessKey: string;       // 44 dígitos
  issuedAtISO: string;     // ISO
  uf: string;              // "MG", "SP", ...
  storeName: string;
  cnpj?: string;
  cityName?: string;
  grandTotal?: number;
};

export type ParseWithMetaResult = {
  parsed: ReceiptParseResult;
  meta: ReceiptMeta;
};

/* ---------------- fetch helpers ---------------- */
const PROXY = ENV.NFCE_PROXY;

async function fetchViaProxy(url: string): Promise<string | null> {
  try {
    const endpoint = PROXY.startsWith("http") ? PROXY : `${location.origin}${PROXY}`;
    const r = await fetch(`${endpoint}?url=${encodeURIComponent(url)}`);
    if (!r.ok) return null;
    const j = await r.json();
    return typeof j?.html === "string" ? j.html : null;
  } catch { return null; }
}

async function fetchReadable(url: string): Promise<string | null> {
  try {
    const clean = url.replace(/^https?:\/\//, "");
    const r = await fetch(`https://r.jina.ai/https://${clean}`);
    return r.ok ? await r.text() : null;
  } catch { return null; }
}

async function fetchHtml(url: string): Promise<{ html: string; mode: string }> {
  const p = await fetchViaProxy(url);
  if (p) return { html: p, mode: "proxy" };
  const r = await fetchReadable(url);
  if (r) return { html: r, mode: "readable" };
  throw new Error("nfce_fetch_failed");
}

/* ---------------- helpers de metadados ---------------- */
function extractUF(url: string, doc: Document): string | undefined {
  if (/\.mg\.gov\.br/i.test(url)) return "MG";
  if (/\.sp\.gov\.br/i.test(url)) return "SP";
  if (/\.es\.gov\.br/i.test(url)) return "ES";
  const txt = doc.body?.textContent || "";
  const m = txt.match(/\bUF[:\s-]*([A-Z]{2})\b/);
  return m?.[1];
}

function extractAccessKey(url: string, doc: Document): string | undefined {
  const mUrl = url.match(/\b(\d{44})\b/);
  if (mUrl) return mUrl[1];
  const txt = doc.body?.textContent || "";
  const mTxt = txt.match(/\b(\d{44})\b/);
  return mTxt?.[1];
}

function extractStoreInfo(doc: Document): {
  storeName?: string; cnpj?: string; cityName?: string;
} {
  const text = doc.body?.textContent || "";
  const findAfter = (re: RegExp) =>
    text.match(new RegExp(re.source + "\\s*[:\\-]?\\s*(.+)", re.flags))?.[1]?.split("\n")[0]?.trim();

  const storeName =
    (doc.querySelector("#spnNomeEmitente") as HTMLElement)?.innerText?.trim() ||
    findAfter(/Emitente|Raz[aã]o Social|Nome do Estabelecimento/i);

  const cnpj = (text.match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/) || [])[0];

  const cityName =
    (doc.querySelector("#spnMunicipio") as HTMLElement)?.innerText?.trim() ||
    findAfter(/Munic[ií]pio|Cidade/i);

  return { storeName, cnpj, cityName };
}

/* ---------------- limpeza básica do nome (ajuste fino ficará para depois) ---------------- */
function cleanName(raw: string): string {
  let s = raw.replace(/[\r\t]/g, " ").replace(/\s{2,}/g, " ").trim();
  s = s.split(/qtde\s*total\s*de\s*i?tens/i)[0];
  s = s.split(/valor\s+total/i)[0];
  s = s.split(/\bun\s*:/i)[0];
  s = s.replace(/\b(un|u|und|unid|kg|g|l|ml)\s*:?\s*[\d.,]+$/i, "");
  s = s.replace(/[\s:|-]*[\d.,]+$/i, ""); // números soltos no fim
  s = s.replace(/[:|,\-–—]+$/g, "").trim();
  return capFirst(stripCodigo(s));
}
const unitMapLoose = (s?: string | null) => (s?.toLowerCase() === "u" ? "un" : unitMap(s || ""));

/* ------------- parser MG por colunas ------------- */
function parsePortalMG(doc: Document): ReceiptParseResult | null {
  const itens: ReceiptItem[] = [];
  let totalItems: number | undefined;
  let grandTotal: number | undefined;

  const market =
    T(doc.querySelector("#spnNomeEmitente")) ||
    T(doc.querySelector(".txtTopo, .txtTit, header")) || undefined;

  // data (dd/mm/aaaa)
  let date: Date | undefined;
  const mDate = T(doc.body).match(/\b(\d{2}\/\d{2}\/\d{4})(?:\s+(\d{2}:\d{2}:\d{2}))?/);
  if (mDate) {
    const [dd, mm, yyyy] = mDate[1].split("/").map(Number);
    const iso = `${yyyy}-${String(mm).padStart(2,"0")}-${String(dd).padStart(2,"0")}${mDate[2] ? "T"+mDate[2] : ""}`;
    const dt = new Date(iso);
    if (!isNaN(dt.getTime())) date = dt;
  }

  // Totais (rodapé)
  const allText = T(doc.body);
  const mTotI = allText.match(/Qtde total de itens\s*[:\-]?\s*(\d+)/i);
  const mTotV = allText.match(/Valor total R\$\s*[:\-]?\s*(?:R\$\s*)?([\d.,]+)/i);
  if (mTotI) totalItems = Number(mTotI[1]);
  if (mTotV) grandTotal = numBR(mTotV[1]);

  const rows = Array.from(doc.querySelectorAll("tr"));
  for (const tr of rows) {
    const tds = Array.from(tr.querySelectorAll("td"));
    if (!tds.length) continue;

    const cells = tds.map(T);
    const joined = cells.join(" | ");

    if (/Qtde\s+total\s+de\s+itens/i.test(joined)) break;
    if (/valor aproximado dos tributos|cliente:|seq\.?\s*cnc|forma de pagamento|valor pago r\$/i.test(joined))
      continue;
    if (tds.length <= 2 && /^\s*R\$\s*[\d.,]+\s*$/i.test(joined)) continue;
    if (!/\(c[oó]digo:\s*\d+\)/i.test(joined)) continue;

    const firstCell = cells[0] || joined.split("|")[0] || "";
    const nome = cleanName(firstCell.replace(/\(c[oó]digo:\s*\d+\)/i, ""));
    if (!nome) continue;

    const qtdCell = cells.find((c) => /qtde\s*total\s*de\s*i?tens/i.test(c) || /\b(qtde|qtd|quant)\b/i.test(c));
    const qtdStr = qtdCell ? qtdCell.replace(/.*?[:]\s*/i, "") : "";
    let quantidade = parseQtyMG(qtdStr);

    let unidade: string | undefined;
    const idxUn = cells.findIndex((c) => /^UN:?$/i.test(c) || /UN:\s*$/i.test(c) || /\b(kg|g|l|ml)\b/i.test(c));
    if (idxUn >= 0 && cells[idxUn + 1]) unidade = unitMapLoose(cells[idxUn + 1]);

    let total = 0;
    const idxVal = cells.findIndex((c) => /valor\s+total\s+r\$/i.test(c) || /\bR\$\b/i.test(c));
    if (idxVal >= 0 && cells[idxVal + 1]) total = numBR(cells[idxVal + 1].replace(/^R\$\s*/i, ""));
    if (!total) continue;

    if (unidade && /^(un|bd|dz)$/i.test(unidade)) {
      quantidade = Math.round(quantidade);
      while (quantidade >= 1000 && quantidade % 1000 === 0) quantidade /= 1000;
    }

    let peso: number | undefined;
    let preco = 0;

    if (unidade && /^(kg|g|l|ml)$/i.test(unidade)) {
      peso = quantidade;
      if (peso > 10 && /\b0\.\d{1,3}\b/.test(qtdStr)) peso = +(peso / 1000).toFixed(3);
      quantidade = 1;
      preco = total;
    } else {
      preco = quantidade > 0 ? +(total / quantidade).toFixed(2) : total;
    }

    itens.push({ nome, quantidade: Math.max(1, quantidade), unidade, peso, preco, total });
  }

  if (!itens.length) return null;
  return { name: "Compra (NFC-e)", market, date, itens, totalItems, grandTotal };
}

/* -------- fallback genérico por DOM -------- */
function parseGenericDOM(doc: Document): ReceiptParseResult | null {
  const itens: ReceiptItem[] = [];
  const rows = Array.from(doc.querySelectorAll("tr"));

  for (const tr of rows) {
    const cells = Array.from(tr.querySelectorAll("td")).map(T);
    const line = cells.join(" | ");

    if (/Qtde\s+total\s+de\s+itens/i.test(line)) break;
    if (/valor aproximado dos tributos|cliente:|seq\.?\s*cnc|forma de pagamento|valor pago r\$/i.test(line)) continue;
    if (cells.length <= 2 && /^\s*R\$\s*[\d.,]+\s*$/i.test(line)) continue;
    if (!/\(c[oó]digo:\s*\d+\)/i.test(line)) continue;
    if (!/R\$\s*[\d.,]+/i.test(line)) continue;

    const nome = cleanName(cells[0] || line.split(/\(c[oó]digo:\s*\d+\)/i)[0] || "");
    if (!nome) continue;

    const qtd1 = line.match(/(?:qtde|qtd|quant|itens:?)\s*[: ]\s*([\d.,]+)/i);
    const qtd2 = line.match(/([\d.,]+)\s*(kg|g|l|ml|un|u|und|unid|bd|dz)\b/i);
    const mQtd = qtd1 || qtd2;
    let quantidade = mQtd ? parseQtyMG(mQtd[1]) : 1;

    const unidade = (qtd2?.[2] && unitMapLoose(qtd2[2])) ||
      unitMapLoose(line.match(/\b(un|u|und|unid|kg|g|l|ml|bd|dz|fr)\b/i)?.[1]);

    const mVal = line.match(/R\$\s*([\d.,]+)/i);
    const total = mVal ? numBR(mVal[1]) : 0;
    if (!total) continue;

    if (unidade && /^(un|bd|dz)$/i.test(unidade)) {
      quantidade = Math.round(quantidade);
      while (quantidade >= 1000 && quantidade % 1000 === 0) quantidade /= 1000;
    }

    let peso: number | undefined;
    let preco = 0;
    if (unidade && /^(kg|g|l|ml)$/i.test(unidade)) {
      peso = quantidade;
      quantidade = 1;
      preco = total;
    } else {
      preco = quantidade > 0 ? +(total / quantidade).toFixed(2) : total;
    }

    itens.push({ nome, quantidade, unidade, peso, preco, total });
  }

  if (!itens.length) return null;
  return { name: "Compra (NFC-e)", itens };
}

/* -------- fallback genérico por texto -------- */
function parseGenericTEXT(doc: Document): ReceiptParseResult | null {
  const txt = (doc.body?.innerText || "").replace(/\t/g, " ").replace(/\r/g, "");
  const linhas = txt.split(/\n+/).map(s => s.trim()).filter(Boolean);

  const itens: ReceiptItem[] = [];

  for (let i = 0; i < linhas.length; i++) {
    const line = linhas[i];
    if (!/\(c[oó]digo:\s*\d+\)/i.test(line)) continue;

    const nome = cleanName(line.replace(/\(c[oó]digo:\s*\d+\)/i, ""));
    if (!nome) continue;

    const windowLines = [linhas[i], linhas[i+1], linhas[i+2], linhas[i+3]]
      .filter(Boolean).join(" | ");

    const mVal = windowLines.match(/R\$\s*([\d.,]+)/i);
    const total = mVal ? numBR(mVal[1]) : 0;
    if (!total) continue;

    const qtd1 = windowLines.match(/(?:qtde|qtd|quant|itens:?)\s*[: ]\s*([\d.,]+)/i);
    const qtd2 = windowLines.match(/([\d.,]+)\s*(kg|g|l|ml|un|u|und|unid|bd|dz)\b/i);
    const mQtd = qtd1 || qtd2;
    let quantidade = mQtd ? parseQtyMG(mQtd[1]) : 1;

    const unidade = unitMapLoose(qtd2?.[2]) ||
      unitMapLoose(windowLines.match(/\b(un|u|und|unid|kg|g|l|ml|bd|dz|fr)\b/i)?.[1]);

    if (unidade && /^(un|bd|dz)$/i.test(unidade)) {
      quantidade = Math.round(quantidade);
      while (quantidade >= 1000 && quantidade % 1000 === 0) quantidade /= 1000;
    }

    let peso: number | undefined;
    let preco = 0;
    if (unidade && /^(kg|g|l|ml)$/i.test(unidade)) {
      peso = quantidade;
      quantidade = 1;
      preco = total;
    } else {
      preco = quantidade > 0 ? +(total / quantidade).toFixed(2) : total;
    }

    itens.push({ nome, quantidade, unidade, peso, preco, total });
  }

  if (!itens.length) return null;
  return { name: "Compra (NFC-e)", itens };
}

/* ------------- FUNÇÕES PÚBLICAS ------------- */
export async function parseNFCeFromUrl(url: string): Promise<ReceiptParseResult> {
  const { html } = await fetchHtml(url);
  const doc = new DOMParser().parseFromString(html, "text/html");

  const mg = parsePortalMG(doc);
  if (mg) return mg;

  const genDom = parseGenericDOM(doc);
  if (genDom) return genDom;

  const genText = parseGenericTEXT(doc);
  if (genText) return genText;

  return { name: "Compra (NFC-e)", itens: [] };
}

export async function parseNFCeWithMeta(url: string): Promise<ParseWithMetaResult> {
  const { html } = await fetchHtml(url);
  const doc = new DOMParser().parseFromString(html, "text/html");
  const parsed =
    parsePortalMG(doc) ??
    parseGenericDOM(doc) ??
    parseGenericTEXT(doc) ??
    { itens: [] };

  const uf = extractUF(url, doc) ?? "MG";
  const accessKey = extractAccessKey(url, doc) ?? "0".repeat(44);
  const store = extractStoreInfo(doc);

  const meta: ReceiptMeta = {
    accessKey,
    issuedAtISO: (parsed.date ?? new Date()).toISOString(),
    uf,
    storeName: parsed.market ?? store.storeName ?? "Loja",
    cnpj: store.cnpj,
    cityName: store.cityName,
    grandTotal: parsed.grandTotal,
  };

  return { parsed, meta };
}

/* ------------- ENVIO PARA A API ------------- */
export async function sendParsedReceiptToApi(meta: ReceiptMeta, parsed: ReceiptParseResult) {
  const items = (parsed.itens || []).map((i) => {
    const isPeso = !!i.unidade && /^(kg|g|l|ml)$/i.test(i.unidade);
    const totalLinha = i.total ?? (isPeso ? i.preco : +(i.preco * i.quantidade).toFixed(2));
    const unidade = i.unidade;

    let unitPrice: number;
    if (isPeso) {
      const peso = i.peso && i.peso > 0 ? i.peso : 1;
      unitPrice = +(totalLinha / peso).toFixed(2);
    } else {
      unitPrice = i.preco;
    }

    const quantity = isPeso ? 1 : i.quantidade;

    return {
      rawDesc: i.nome,
      quantity,
      unit: unidade,
      unitPrice,
      total: totalLinha,
    };
  });

  const payload = {
    accessKey: meta.accessKey,
    issuedAt: meta.issuedAtISO,
    uf: meta.uf,
    store: {
      name: meta.storeName,
      cnpj: meta.cnpj,
      city: meta.cityName ? { name: meta.cityName, uf: meta.uf } : undefined,
    },
    total: meta.grandTotal ?? items.reduce((s, it) => s + (it.total ?? 0), 0),
    items,
  };

  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Faça login para enviar a nota.");

  await postReceipt(token, payload);
}
