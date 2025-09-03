// src/server/sources/openfoodfacts.ts
export type ImageHit = { url: string; width?: number; height?: number; source: 'off' };

export async function searchOFFImages(q: string): Promise<ImageHit[]> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?action=process&json=true&search_terms=${encodeURIComponent(
      q,
    )}&page_size=5`;
    const r = await fetch(url, { method: 'GET' });
    if (!r.ok) return [];
    const j = await r.json();
    const products: any[] = Array.isArray(j?.products) ? j.products : [];
    const imgs: ImageHit[] = [];
    for (const p of products) {
      const img =
        p?.image_front_small_url ||
        p?.image_front_thumb_url ||
        p?.image_front_url ||
        p?.image_url;
      if (img) imgs.push({ url: img, source: 'off' });
    }
    return imgs;
  } catch {
    return [];
  }
}
