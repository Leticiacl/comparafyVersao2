// src/server/sources/mercadolivre.ts
// Usa a busca pública do Mercado Livre (sem chave) para pegar thumbnails.
// Importante: apenas como fallback, respeitando ToS (não armazenamos conteúdo, só URL).
export type MLImage = { url: string; width?: number; height?: number };

export async function searchMercadoLivreImages(query: string): Promise<MLImage[]> {
  const u = new URL('https://api.mercadolibre.com/sites/MLB/search');
  u.searchParams.set('q', query);
  u.searchParams.set('limit', '4');

  const r = await fetch(u.toString(), { headers: { 'Accept': 'application/json' } });
  if (!r.ok) return [];
  const j = await r.json().catch(() => null);
  if (!j?.results?.length) return [];

  return j.results
    .map((it: any) => {
      const thumb: string | undefined = it?.thumbnail || it?.thumbnail_id;
      if (!thumb) return null;
      return { url: String(thumb) };
    })
    .filter(Boolean) as MLImage[];
}
