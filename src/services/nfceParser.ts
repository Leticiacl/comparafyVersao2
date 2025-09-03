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
  totalItems?: number;
  grandTotal?: number;
};
export type ReceiptMeta = {
  accessKey: string;
  issuedAtISO: string;
  uf: string;
  storeName: string;
  cnpj?: string;
  cityName?: string;
  grandTotal?: number;
};

/* ---------------- helpers ---------------- */
const STOPWORDS = new Set(["de","do","da","dos","das","e","ou","para","com","em","no","na","nos","nas","un","kg","g","l","ml"]);
const title = (s: string) =>
  s.toLowerCase().split(/\s+/).map((w,i)=> i>0 && STOPWORDS.has(w)? w : w.replace(/^([a-zà-ú])/, m=>m.toUpperCase())).join(" ");
function cleanName(raw: string) {
  let s = String(raw || "");
  s = s.replace(/\(c[oó]digo:\s*\d+\)/gi, "");
  s = s.replace(/\b(qtde|qtd|quant(?:idade)?|qtde total de itens|itens)\s*[:\-]?\s*[\d.,]+/gi, "");
  s = s.replace(/[|]/g, " ").replace(/\s{2,}/g, " ").trim();
  return title(stripCodigo(s));
}

/* ---------------- fetch ---------------- */
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
async function fetchHtml(url: string): Promise<{ html: string; mode: "proxy"|"readable" }> {
  const p = await fetchViaProxy(url);
  if (p) { console.debug("[nfce] via proxy"); return { html: p, mode: "proxy" }; }
  const r = await fetchReadable(url);
  if (r) { console.debug("[nfce] via readable"); return { html: r, mode: "readable" }; }
  throw new Error("nfce_fetch_failed");
}

/* ---------------- metadados ---------------- */
function extractUF(url: string, doc: Document): string | undefined {
  if (/\.mg\.gov\.br/i.test(url)) return "MG";
  if (/\.sp\.gov\.br/i.test(url)) return "SP";
  if (/\.es\.gov\.br/i.test(url)) return "ES";
  const txt = doc.body?.textContent || "";
  return txt.match(/\bUF[:\s-]*([A-Z]{2})\b/)?.[1];
}
function extractAccessKey(url: string, doc: Document): string | undefined {
  return url.match(/\b(\d{44})\b/)?.[1] || (doc.body?.textContent||"").match(/\b(\d{44})\b/)?.[1];
}
function extractStoreInfo(doc: Document) {
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

/* ---------------- parser MG (tabela) ---------------- */
function parsePortalMG(doc: Document): ReceiptParseResult | null {
  const itens: ReceiptItem[] = [];
  let totalItems: number | undefined;
  let grandTotal: number | undefined;

  const market =
    T(doc.querySelector("#spnNomeEmitente")) ||
    T(doc.querySelector(".txtTopo, .txtTit, header")) || undefined;

  let date: Date | undefined;
  const mDate = T(doc.body).match(/\b(\d{2}\/\d{2}\/\d{4})(?:\s+(\d{2}:\d{2}:\d{2}))?/);
  if (mDate) {
    const [dd, mm, yyyy] = mDate[1].split("/").map(Number);
    const iso = `${yyyy}-${String(mm).padStart(2,"0")}-${String(dd).padStart(2,"0")}${mDate[2] ? "T"+mDate[2] : ""}`;
    const dt = new Date(iso);
    if (!isNaN(dt.getTime())) date = dt;
  }

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
    if (/valor aproximado dos tributos|cliente:|seq\.?\s*cnc|forma de pagamento|valor pago r\$/i.test(joined)) continue;
    if (tds.length <= 2 && /^\s*R\$\s*[\d.,]+\s*$/i.test(joined)) continue;
    if (!/\(c[oó]digo:\s*\d+\)/i.test(joined)) continue;

    const firstCell = cells[0] || joined.split("|")[0] || "";
    let nome = cleanName(firstCell);

    const qtdCell = cells.find((c) => /qtde\s+total\s+de\s+i?tens/i.test(c) || /\b(qtde|qtd|quant)\b/i.test(c));
    const qtdStr = qtdCell ? qtdCell.replace(/.*?[:]\s*/i, "") : "";
    let quantidade = parseQtyMG(qtdStr);

    let unidade: string | undefined;
    const idxUn = cells.findIndex((c) => /^UN:?$/i.test(c) || /UN:\s*$/i.test(c) || /\b(kg|g|l|ml)\b/i.test(c));
    if (idxUn >= 0 && cells[idxUn + 1]) unidade = unitMap(cells[idxUn + 1]);

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

    if (!nome || (!preco && !total)) continue;
    itens.push({ nome, quantidade: Math.max(1, quantidade), unidade, peso, preco, total });
  }

  if (!itens.length) return null;
  return { name: "Compra (NFC-e)", market, date, itens, totalItems, grandTotal };
}

/* ---------------- genérico tabela ---------------- */
function parseGenericTable(doc: Document): ReceiptParseResult | null {
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

    let nome = cleanName((cells[0] || line.split(/\(c[oó]digo:\s*\d+\)/i)[0] || ""));
    const mQtd = line.match(/(qtde|qtd|quant|itens:\s*)([\d.,]+)/i);
    const mUn  = line.match(/\b(un|und|unid|kg|g|l|ml|bd|dz|fr)\b/i);
    const mVal = line.match(/R\$\s*([\d.,]+)/i);

    let quantidade = mQtd ? parseQtyMG(mQtd[2]) : 1;
    let unidade = unitMap(mUn?.[1]);
    const total = mVal ? numBR(mVal[1]) : 0;
    if (!total) continue;

    if (unidade && /^(un|bd|dz)$/i.test(unidade)) {
      quantidade = Math.round(quantidade);
      while (quantidade >= 1000 && quantidade % 1000 === 0) quantidade /= 1000;
    }

    let peso: number | undefined;
    let preco = 0;
    if (unidade && /^(kg|g|l|ml)$/i.test(unidade)) {
      peso = quantidade; quantidade = 1; preco = total;
    } else {
      preco = quantidade > 0 ? +(total / quantidade).toFixed(2) : total;
    }

    itens.push({ nome, quantidade, unidade, peso, preco, total });
  }
  if (!itens.length) return null;
  return { name: "Compra (NFC-e)", itens };
}

/* ---------------- parser TEXTO ---------------- */
function parseFromPlainText(doc: Document): ReceiptParseResult | null {
  const txt = (doc.body?.textContent || "").replace(/\u00a0/g, " ");
  if (!txt || txt.length < 200) return null;

  const itens: ReceiptItem[] = [];
  const re = /([^\n]+?)\s*(?:qtde|qtd|quant(?:idade)?|itens?)?[:\s-]*([\d.,]+)?\s*(un|und|unid|kg|g|l|ml|bd|dz)?[^\n]*?\bvalor\s+total\s*r?\$?\s*([\d.,]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(txt))) {
    const nome = cleanName(m[1] || "");
    if (!nome) continue;
    let quantidade = m[2] ? parseQtyMG(m[2]) : 1;
    const unidade = unitMap(m[3] || "");
    const total = numBR(m[4] || "0");
    if (!total) continue;

    if (unidade && /^(un|bd|dz)$/i.test(unidade)) quantidade = Math.max(1, Math.round(quantidade));

    let peso: number | undefined;
    let preco = 0;
    if (unidade && /^(kg|g|l|ml)$/i.test(unidade)) { peso = quantidade; quantidade = 1; preco = total; }
    else { preco = quantidade > 0 ? +(total / quantidade).toFixed(2) : total; }

    itens.push({ nome, quantidade, unidade, peso, preco, total });
  }

  let totalItems: number | undefined;
  let grandTotal: number | undefined;
  const mTotI = txt.match(/Qtde\s*total\s*de\s*itens\s*[:\-]?\s*(\d+)/i);
  const mTotV = txt.match(/Valor\s*total\s*R\$\s*[:\-]?\s*(?:R\$\s*)?([\d.,]+)/i);
  if (mTotI) totalItems = Number(mTotI[1]);
  if (mTotV) grandTotal = numBR(mTotV[1]);

  if (!itens.length) return null;
  return { name: "Compra (NFC-e)", itens, totalItems, grandTotal };
}

/* ------------- FUNÇÃO USADA PELA TELA ------------- */
export async function parseNFCeFromUrl(url: string): Promise<ReceiptParseResult> {
  const { html } = await fetchHtml(url);
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (
    parsePortalMG(doc) ??
    parseGenericTable(doc) ??
    parseFromPlainText(doc) ??
    { name: "Compra (NFC-e)", itens: [] }
  );
}

/* ------------- with meta / envio (opcional) ------------- */
export async function parseNFCeWithMeta(url: string) {
  const { html } = await fetchHtml(url);
  const doc = new DOMParser().parseFromString(html, "text/html");
  const parsed = parsePortalMG(doc) ?? parseGenericTable(doc) ?? parseFromPlainText(doc) ?? { itens: [] };

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

export async function sendParsedReceiptToApi(meta: ReceiptMeta, parsed: ReceiptParseResult) {
  const items = (parsed.itens || []).map((i) => {
    const isPeso = !!i.unidade && /^(kg|g|l|ml)$/i.test(i.unidade);
    const totalLinha = i.total ?? (isPeso ? i.preco : +(i.preco * i.quantidade).toFixed(2));
    const unidade = i.unidade;

    let unitPrice: number;
    if (isPeso) {
      const peso = i.peso && i.peso > 0 ? i.peso : 1;
      unitPrice = +(totalLinha / peso).toFixed(2);
    } else { unitPrice = i.preco; }
    const quantity = isPeso ? 1 : i.quantidade;

    return { rawDesc: i.nome, quantity, unit: unidade, unitPrice, total: totalLinha };
  });

  const payload = {
    accessKey: meta.accessKey,
    issuedAt: meta.issuedAtISO,
    uf: meta.uf,
    store: { name: meta.storeName, cnpj: meta.cnpj, city: meta.cityName ? { name: meta.cityName, uf: meta.uf } : undefined },
    total: meta.grandTotal ?? items.reduce((s, it) => s + (it.total ?? 0), 0),
    items,
  };

  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Faça login para enviar a nota.");
  await postReceipt(token, payload);
}
