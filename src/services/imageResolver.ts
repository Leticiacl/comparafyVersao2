// Serviço robusto para resolver imagens de produtos online, com cache local.
// Fontes: Open Food Facts (CORS OK). Proxy de imagem: images.weserv.nl para evitar bloqueios.

export const PLACEHOLDER_DATA_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'>
      <rect width='96' height='96' rx='12' fill='#eef2f7'/>
      <g fill='#c3cbd9'>
        <circle cx='34' cy='34' r='10'/>
        <path d='M14 76c6-12 14-20 22-20s16 8 22 20h-44z'/>
        <rect x='60' y='28' width='20' height='16' rx='3'/>
      </g>
    </svg>`
  );

type CacheRecord = {
  url: string;       // URL já proxificada
  at: number;        // epoch ms
  raw?: string;      // URL original (debug)
};

const CACHE_KEY = "img_cache_v1";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 dias

function loadCache(): Record<string, CacheRecord> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveCache(c: Record<string, CacheRecord>) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch {}
}

function normalizeKey(name: string) {
  let s = (name || "").toLowerCase();
  s = s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  s = s.replace(/[^a-z0-9\s]/g, " ");
  // remove tamanhos e quantificadores comuns
  s = s.replace(/\b(\d+([.,]\d+)?)\s*(kg|g|gr|l|ml|un|und|unid|dz|pct|pct\.|sache|cx|fd)\b/g, " ");
  s = s.replace(/\s{2,}/g, " ").trim();
  return s;
}

function proxify(url: string): string {
  // imgs com http/https → proxy para evitar CORS e padronizar tamanho/recorte (quadrado)
  try {
    const clean = url.replace(/^https?:\/\//i, "");
    // w=96 h=96 fit=cover (pode aumentar se quiser)
    return `https://images.weserv.nl/?url=${encodeURIComponent(clean)}&w=96&h=96&fit=cover&we`;
  } catch {
    return url;
  }
}

/* ------------------ Open Food Facts ------------------ */

// Busca por EAN direto (melhor precisão)
async function offByCode(ean: string) {
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(ean)}.json`);
    if (!r.ok) return null;
    const j = await r.json();
    const img: string | undefined =
      j?.product?.image_front_small_url ||
      j?.product?.image_url ||
      j?.product?.selected_images?.front?.small?.[0] ||
      j?.product?.selected_images?.front?.display?.[0];
    if (img) return img as string;
  } catch {}
  return null;
}

// Busca por nome; escolhe melhor por "score" de palavras contidas
async function offSearchByName(name: string, brand?: string) {
  try {
    const q = [name, brand].filter(Boolean).join(" ");
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      q
    )}&json=1&page_size=20&fields=product_name,brands,image_front_small_url,image_url,code`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    const prods: any[] = j?.products || [];

    const key = normalizeKey(name);
    const tokens = new Set(key.split(" ").filter((t) => t.length >= 2));

    let best: { score: number; img: string } | null = null;
    for (const p of prods) {
      const pname: string = p?.product_name || "";
      const pimg: string | undefined = p?.image_front_small_url || p?.image_url;
      if (!pname || !pimg) continue;

      const norm = normalizeKey(pname);
      const words = new Set(norm.split(" ").filter((t) => t.length >= 2));

      // score = palavras do nome consultado presentes no produto
      let score = 0;
      tokens.forEach((t) => {
        if (words.has(t)) score += 2;
      });
      // bônus forte se prefixo bater
      if (norm.startsWith(key)) score += 3;
      // leve bônus se marca bater
      if (brand && (p?.brands || "").toLowerCase().includes(brand.toLowerCase())) score += 1;

      if (!best || score > best.score) best = { score, img: pimg };
    }

    return best?.img || null;
  } catch {
    return null;
  }
}

/* ------------------ API Pública do módulo ------------------ */

export async function resolveProductImage(
  rawName: string,
  brand?: string | null,
  ean?: string | null
): Promise<string | null> {
  const name = (rawName || "").trim();
  if (!name) return null;

  const key = normalizeKey(name);
  const cache = loadCache();

  // cache hit válido
  const hit = cache[key];
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return hit.url;
  }

  // 1) tenta por código (se informaram EAN)
  if (ean) {
    const byCode = await offByCode(ean);
    if (byCode) {
      const finalUrl = proxify(byCode);
      cache[key] = { url: finalUrl, at: Date.now(), raw: byCode };
      saveCache(cache);
      return finalUrl;
    }
  }

  // 2) por nome (e marca se existir)
  const byName = await offSearchByName(name, brand ?? undefined);
  if (byName) {
    const finalUrl = proxify(byName);
    cache[key] = { url: finalUrl, at: Date.now(), raw: byName };
    saveCache(cache);
    return finalUrl;
  }

  // 3) falha → salva placeholder no cache (evita ficar rebatendo rede)
  cache[key] = { url: PLACEHOLDER_DATA_URI, at: Date.now(), raw: "" };
  saveCache(cache);
  return PLACEHOLDER_DATA_URI;
}

// opcional: set manual (útil se algum produto ficou ruim e você quer corrigir no futuro)
export function rememberProductImage(name: string, url: string) {
  const key = normalizeKey(name);
  const cache = loadCache();
  cache[key] = { url: proxify(url), at: Date.now(), raw: url };
  saveCache(cache);
}
