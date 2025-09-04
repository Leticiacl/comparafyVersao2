// Resolve imagens de produtos ONLINE sem catálogo local.
// Ordem: OpenFoodFacts (EAN) -> OpenFoodFacts (nome) -> Wikipedia/Wikimedia (nome/marca) -> placeholder.

export const PLACEHOLDER_DATA_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'>
      <rect width='96' height='96' rx='14' fill='#EEF2F6'/>
      <path d='M28 66h40L56 44l-8 10-6-7-14 19Z' fill='#D1D5DB'/>
      <circle cx='38' cy='34' r='7' fill='#D1D5DB'/>
    </svg>`
  );

const memCache = new Map<string, string>();
const triedBadUrl = new Set<string>();

function slug(s: string) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function preload(url: string, timeoutMs = 7000): Promise<boolean> {
  return new Promise((res) => {
    try {
      const img = new Image();
      const t = setTimeout(() => {
        img.src = "";
        res(false);
      }, timeoutMs);
      img.onload = () => {
        clearTimeout(t);
        res(true);
      };
      img.onerror = () => {
        clearTimeout(t);
        res(false);
      };
      img.src = url;
    } catch {
      res(false);
    }
  });
}

async function fetchJSON<T = any>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

/* ---------- 1) Open Food Facts por EAN ---------- */
async function offByEAN(ean?: string | null): Promise<string | null> {
  const code = String(ean || "").replace(/\D/g, "");
  if (!code || code.length < 8) return null;
  const url = `https://world.openfoodfacts.org/api/v0/product/${code}.json`;
  const j = await fetchJSON<any>(url);
  const p = j?.product;
  const candidate =
    p?.image_front_small_url ||
    p?.image_small_url ||
    p?.image_front_url ||
    p?.image_url ||
    p?.selected_images?.front?.display?.[0]?.['en']; // raríssimo, mas fica
  if (candidate && (await preload(candidate))) return candidate;
  return null;
}

/* ---------- 2) Open Food Facts por nome ---------- */
async function offByName(q: string): Promise<string | null> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    q
  )}&search_simple=1&json=1&page_size=6`;
  const j = await fetchJSON<any>(url);
  const products: any[] = j?.products || [];
  for (const p of products) {
    const candidate =
      p?.image_front_small_url ||
      p?.image_small_url ||
      p?.image_front_url ||
      p?.image_url;
    if (candidate && (await preload(candidate))) return candidate;
  }
  return null;
}

/* ---------- 3) Wikipedia/Wikimedia por nome ---------- */
// prioriza pt, depois en para aumentar chance
async function wikiThumbByTitle(title: string, lang: "pt" | "en"): Promise<string | null> {
  // REST summary (tem CORS e costuma trazer thumbnail)
  const summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title
  )}`;
  const s = await fetchJSON<any>(summaryUrl);
  const cand = s?.thumbnail?.source || s?.originalimage?.source;
  if (cand && (await preload(cand))) return cand;
  return null;
}

async function wikiBySearch(q: string): Promise<string | null> {
  // Nova busca REST (caminho moderno)
  const url = `https://pt.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(
    q
  )}&limit=1`;
  const r = await fetchJSON<any>(url);
  const tPt: string | undefined = r?.pages?.[0]?.title;
  if (tPt) {
    const byPt = await wikiThumbByTitle(tPt, "pt");
    if (byPt) return byPt;
  }
  // Tenta também em inglês
  const urlEn = `https://en.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(
    q
  )}&limit=1`;
  const rEn = await fetchJSON<any>(urlEn);
  const tEn: string | undefined = rEn?.pages?.[0]?.title;
  if (tEn) {
    const byEn = await wikiThumbByTitle(tEn, "en");
    if (byEn) return byEn;
  }
  return null;
}

/* ---------- Função pública ---------- */
export async function resolveProductImage(
  name: string,
  brand?: string | null,
  ean?: string | null
): Promise<string> {
  const key = `${slug(name)}|${slug(brand || "")}|${String(ean || "")}`;
  if (memCache.has(key)) return memCache.get(key)!;

  // Evita requisições para nomes vazios
  const cleanName = slug(name);
  const cleanBrand = slug(brand || "");
  const composed =
    cleanBrand && cleanName ? `${cleanBrand} ${cleanName}` : cleanName || cleanBrand;

  // 1) OpenFoodFacts por EAN
  if (ean) {
    const byEan = await offByEAN(ean);
    if (byEan) {
      memCache.set(key, byEan);
      return byEan;
    }
  }

  // 2) OpenFoodFacts por nome (marca + nome ajuda bastante)
  if (composed) {
    const offName = await offByName(composed);
    if (offName) {
      memCache.set(key, offName);
      return offName;
    }
  }

  // 3) Wikipedia/Wikimedia por nome
  if (composed) {
    const wiki = await wikiBySearch(composed);
    if (wiki) {
      memCache.set(key, wiki);
      return wiki;
    }
  }

  // Fallback
  memCache.set(key, PLACEHOLDER_DATA_URI);
  return PLACEHOLDER_DATA_URI;
}
