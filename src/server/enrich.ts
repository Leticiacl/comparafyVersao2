// src/server/enrich.ts
import { prisma } from './db';
import { productSlugFromRaw } from './normalize';
import { searchOpenFoodFactsImages } from './sources/openfoodfacts';
import { searchMercadoLivreImages } from './sources/mercadolivre';

export async function findOrCreateProductFromRaw(rawDesc: string) {
  const slug = productSlugFromRaw(rawDesc);
  if (!slug) return null;

  // tenta achar produto existente
  let p = await prisma.product.findUnique({ where: { slug } });
  if (p) return p;

  // cria novo (displayName básico; refinamos depois)
  p = await prisma.product.create({
    data: {
      slug,
      displayName: rawDesc,
    },
  });

  // busca imagens em paralelo (best-effort)
  try {
    const [off, ml] = await Promise.allSettled([
      searchOpenFoodFactsImages(rawDesc),
      searchMercadoLivreImages(rawDesc),
    ]);

    const imgs: { url: string; source: string }[] = [];

    if (off.status === 'fulfilled') {
      for (const im of off.value.slice(0, 3)) {
        imgs.push({ url: im.url, source: 'openfoodfacts' });
      }
    }
    if (ml.status === 'fulfilled' && imgs.length < 3) {
      for (const im of ml.value.slice(0, 3 - imgs.length)) {
        imgs.push({ url: im.url, source: 'mercadolivre' });
      }
    }

    if (imgs.length) {
      await prisma.productImage.createMany({
        data: imgs.map((i) => ({
          productId: p!.id,
          url: i.url,
          source: i.source,
        })),
        skipDuplicates: true,
      });
    }
  } catch {
    // silencioso — enriquecimento não bloqueia o fluxo
  }

  return p;
}
