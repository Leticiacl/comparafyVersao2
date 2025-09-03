// src/server/sources/mercadolivre.ts
export type ImageHit = { url: string; width?: number; height?: number; source: 'ml' };

export async function searchMLImages(q: string): Promise<ImageHit[]> {
  try {
    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=5`;
    const r = await fetch(url, { method: 'GET' });
    if (!r.ok) return [];
    const j = await r.json();
    const results: any[] = Array.isArray(j?.results) ? j.results : [];
    const imgs: ImageHit[] = [];
    for (const it of results) {
      const thumb: string | undefined = it?.thumbnail || it?.thumbnail_id;
      if (thumb && typeof thumb === 'string') imgs.push({ url: thumb, source: 'ml' });
    }
    return imgs;
  } catch {
    return [];
  }
}
