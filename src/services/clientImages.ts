// src/services/clientImages.ts
export async function findPreviewImage(query: string): Promise<string | null> {
    try {
      // tenta OFF
      const u = new URL('https://world.openfoodfacts.org/cgi/search.pl');
      u.searchParams.set('search_terms', query);
      u.searchParams.set('action', 'process');
      u.searchParams.set('json', '1');
      u.searchParams.set('page_size', '1');
  
      let r = await fetch(u.toString());
      if (r.ok) {
        const j = await r.json().catch(() => null);
        const url = j?.products?.[0]?.image_front_url || j?.products?.[0]?.image_url;
        if (url) return url;
      }
  
      // fallback ML
      const u2 = new URL('https://api.mercadolibre.com/sites/MLB/search');
      u2.searchParams.set('q', query);
      u2.searchParams.set('limit', '1');
      r = await fetch(u2.toString());
      if (r.ok) {
        const j = await r.json().catch(() => null);
        const url = j?.results?.[0]?.thumbnail;
        if (url) return url;
      }
    } catch {}
    return null;
  }
  