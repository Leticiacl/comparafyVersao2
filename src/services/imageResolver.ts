
// src/services/imageResolver.ts
// Resolver de imagens com:
// - Match por marca + nome via OpenFoodFacts (CORS OK)
// - Ícones genéricos (SVG) para frutas/verduras/carnes/padaria/laticínios
// - Cache local (30 dias)
// - Proxy de imagem por images.weserv.nl (evita CORS)
// OBS: removi fallback Bing/AllOrigins por CORS no StackBlitz.

/* ========================= Placeholder base ========================= */
export const PLACEHOLDER_DATA_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'>
      <rect width='96' height='96' rx='12' fill='#f3f4f6'/>
      <g fill='#cbd5e1'>
        <circle cx='34' cy='34' r='10'/>
        <path d='M14 76c6-12 14-20 22-20s16 8 22 20h-44z'/>
        <rect x='60' y='28' width='20' height='16' rx='3'/>
      </g>
    </svg>`
  );

/* ========================= Ícones genéricos ========================= */
const GENERIC_ICONS: Record<string, string> = {
  fruta:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96' width='96' height='96'>
        <rect width='96' height='96' rx='12' fill='#fff7ed'/>
        <path d='M48 20c6 0 12 4 12 10s-6 10-12 10-12-4-12-10 6-10 12-10z' fill='#f97316'/>
        <path d='M48 38c-16 0-28 10-28 24 0 8 8 16 28 16s28-8 28-16c0-14-12-24-28-24z' fill='#fdba74'/>
      </svg>`
    ),
  verdura:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96' width='96' height='96'>
        <rect width='96' height='96' rx='12' fill='#ecfdf5'/>
        <path d='M24 60c0-12 12-28 24-28s24 16 24 28-12 16-24 16-24-4-24-16z' fill='#34d399'/>
        <path d='M48 32v44' stroke='#059669' stroke-width='4' stroke-linecap='round' fill='none'/>
      </svg>`
    ),
  carne:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96' width='96' height='96'>
        <rect width='96' height='96' rx='12' fill='#fef2f2'/>
        <path d='M24 60c0-12 12-24 24-24s24 12 24 24-12 16-24 16-24-4-24-16z' fill='#fca5a5'/>
        <circle cx='56' cy='56' r='6' fill='#ef4444'/>
      </svg>`
    ),
  pao:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96' width='96' height='96'>
        <rect width='96' height='96' rx='12' fill='#fffbeb'/>
        <path d='M24 60c0-10 12-20 24-20s24 10 24 20-12 12-24 12-24-2-24-12z' fill='#fbbf24'/>
        <path d='M32 54c0-4 4-8 8-8m8 0c0-4 4-8 8-8' stroke='#f59e0b' stroke-width='4' stroke-linecap='round' fill='none'/>
      </svg>`
    ),
  queijo:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96' width='96' height='96'>
        <rect width='96' height='96' rx='12' fill='#fffbeb'/>
        <path d='M20 64l28-16 28 16-28 12-28-12z' fill='#fde68a'/>
        <circle cx='40' cy='58' r='3' fill='#f59e0b'/>
        <circle cx='54' cy='62' r='3' fill='#f59e0b'/>
        <circle cx='48' cy='68' r='3' fill='#f59e0b'/>
      </svg>`
    ),
};

/* ========================= Cache ========================= */
type CacheRecord = { url: string; at: number; raw?: string };
const CACHE_KEY = "img_cache_v1";
const CACHE_TTL = 1000 * 60 * 60 * 24 * 30; // 30 dias

function loadCache(): Record<string, CacheRecord> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveCache(c: Record<string, CacheRecord>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {}
}

/* ========================= Normalização ========================= */
const UNITS = /(kg|g|gr|l|ml|un|und|unid|dz|pct|pct\.|cx|fd|kg\.|l\.)/gi;
const NUMS = /\b\d+([.,]\d+)?\b/g;
const DIACRITICS = /[\u0300-\u036f]/g;

function normalizeKey(name: string) {
  let s = (name || "").toLowerCase().normalize("NFD").replace(DIACRITICS, "");
  s = s.replace(/[^\p{L}\p{N}\s]/gu, " ").replace(UNITS, " ").replace(NUMS, " ");
  s = s.replace(/\s{2,}/g, " ").trim();
  return s;
}

const BRAND_FIX: Record<string, string> = {
  aymore: "aymore",
  itamarate: "itamaraty",
  itamaraty: "itamaraty",
  richeste: "richester",
  richester: "richester",
  kerus: "keros",
  keros: "keros",
  clight: "clight",
  pepsi: "pepsi",
  top: "top",
  line: "line",
  esperanca: "esperanca",
  mussa: "mussarela",
  mussarela: "mussarela",
};

function extractBrandTokens(s: string): string[] {
  const tokens = normalizeKey(s).split(" ");
  return tokens
    .map((t) => BRAND_FIX[t] || t)
    .filter((t) => t.length >= 3);
}

/* ========================= Heurística de genéricos ========================= */
const GENERIC_TRIGGERS: Array<[RegExp, keyof typeof GENERIC_ICONS]> = [
  [/(banana|maca|manga|melao|melancia|uva|limao|laranja|tangerina|mexerica|abacaxi|abacate|mamao|pera|pessego|kiwi|morango)/, "fruta"],
  [/(alface|acelga|couve|espinafre|salsa|cebolinha|coentro|verdura)/, "verdura"],
  [/(batata|cebola|alho|cenoura|beterraba|abobora|inhame|mandioca|tomate|legume)/, "verdura"],
  [/(carne|fraldinha|picanha|alcatra|lombo|pernil|frango|peito|cox[aã]o?)/, "carne"],
  [/(p[aã]o|pao)/, "pao"],
  [/(queijo|mussarela|mussarela|mussare)/, "queijo"],
];

function genericIconFor(name: string): string | null {
  const key = normalizeKey(name);
  for (const [rx, kind] of GENERIC_TRIGGERS) {
    if (rx.test(key)) return GENERIC_ICONS[kind];
  }
  return null;
}

/* ========================= Util ========================= */
function proxify(url: string): string {
  // Regex correto (sem escapes duplos):
  // remove o protocolo para o weserv aceitar
  try {
    const clean = url.replace(/^https?:\/\//i, "");
    return `https://images.weserv.nl/?url=${encodeURIComponent(clean)}&w=96&h=96&fit=cover&we`;
  } catch {
    return url;
  }
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const inter = new Set([...a].filter((x) => b.has(x))).size;
  const uni = new Set([...a, ...b]).size || 1;
  return inter / uni;
}

/* ========================= OpenFoodFacts ========================= */
async function offByCode(ean: string): Promise<string | null> {
  try {
    const r = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(ean)}.json`
    );
    if (!r.ok) return null;
    const j = await r.json();
    const img: string | undefined =
      j?.product?.image_front_small_url ||
      j?.product?.image_url ||
      j?.product?.selected_images?.front?.small?.[0] ||
      j?.product?.selected_images?.front?.display?.[0];
    return img || null;
  } catch {
    return null;
  }
}

async function offSearchByName(name: string, brand?: string | null): Promise<string | null> {
  try {
    const q = [name, brand || ""].filter(Boolean).join(" ");
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      q
    )}&json=1&page_size=30&fields=product_name,brands,image_front_small_url,image_url`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    const products: any[] = j?.products || [];

    const keyTokens = new Set(extractBrandTokens(name));
    const brandNorm = brand ? (BRAND_FIX[normalizeKey(brand)] || normalizeKey(brand)) : null;

    let best: { score: number; url: string } | null = null;
    for (const p of products) {
      const pname: string = p?.product_name || "";
      const pimg: string | undefined = p?.image_front_small_url || p?.image_url;
      if (!pname || !pimg) continue;

      const pTokens = new Set(extractBrandTokens(pname));
      let score = jaccard(keyTokens, pTokens);

      // bônus: prefix match próximo (nome começa igual)
      const pNorm = normalizeKey(pname);
      const keyNorm = normalizeKey(name);
      if (pNorm.startsWith(keyNorm.slice(0, Math.max(6, Math.floor(keyNorm.length * 0.6))))) {
        score += 0.25;
      }

      // bônus: marca coincide
      if (brandNorm && (p?.brands || "").toLowerCase().includes(brandNorm)) score += 0.3;

      // penalidade: poucas interseções
      if (score < 0.2) continue;

      if (!best || score > best.score) best = { score, url: pimg };
    }

    if (best && best.score >= 0.45) return best.url;
    return null;
  } catch {
    return null;
  }
}

/* ========================= API pública ========================= */
export async function resolveProductImage(
  rawName: string,
  brand?: string | null,
  ean?: string | null
): Promise<string | null> {
  const name = (rawName || "").trim();
  if (!name) return null;

  const key = normalizeKey(name);
  const cache = loadCache();

  // cache
  const hit = cache[key];
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.url;

  // genéricos (frutas/verduras/carne/pão/queijo)
  const generic = genericIconFor(name);
  if (generic) {
    cache[key] = { url: generic, at: Date.now(), raw: "generic" };
    saveCache(cache);
    return generic;
  }

  // EAN tem prioridade
  if (ean) {
    const byCode = await offByCode(ean);
    if (byCode) {
      const finalUrl = proxify(byCode);
      cache[key] = { url: finalUrl, at: Date.now(), raw: byCode };
      saveCache(cache);
      return finalUrl;
    }
  }

  // Busca por nome + (marca)
  const byName = await offSearchByName(name, brand);
  if (byName) {
    const finalUrl = proxify(byName);
    cache[key] = { url: finalUrl, at: Date.now(), raw: byName };
    saveCache(cache);
    return finalUrl;
  }

  // Fallback definitivo
  cache[key] = { url: PLACEHOLDER_DATA_URI, at: Date.now(), raw: "" };
  saveCache(cache);
  return PLACEHOLDER_DATA_URI;
}

export function rememberProductImage(name: string, url: string) {
  const key = normalizeKey(name);
  const cache = loadCache();
  cache[key] = { url: proxify(url), at: Date.now(), raw: url };
  saveCache(cache);
}
