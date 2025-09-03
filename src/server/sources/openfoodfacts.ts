// src/server/sources/openfoodfacts.ts
// Fonte gratuita; sem chave. Usamos como best-effort (pode não achar).
export type OFFImage = { url: string; width?: number; height?: number };

export async function searchOpenFoodFactsImages(query: string): Promise<OFFImage[]> {
  const u = new URL('https://world.openfoodfacts.org/cgi/search.pl');
  u.searchParams.set('search_terms', query);
  u.searchParams.set('action', 'process');
  u.searchParams.set('json', '1');
  u.searchParams.set('page_size', '4');

  const r = await fetch(u.toString(), { headers: { 'Accept': 'application/json' } });
  if (!r.ok) return [];
  const j = await r.json().catch(() => null);
  if (!j?.products?.length) return [];

  const imgs: OFFImage[] = [];
  for (const p of j.products) {
    const url = p?.image_front_url || p?.image_url;
    if (typeof url === 'string' && url.startsWith('http')) {
      imgs.push({ url, width: p?.image_front_small_url ? undefined : undefined, height: undefined });
    }
  }
  return imgs;
}
