// src/server/enrich.ts
import { db } from './db';
import { normalizeName } from './normalize';
import { searchOFFImages } from './sources/openfoodfacts';
import { searchMLImages } from './sources/mercadolivre';

export async function ensureProductWithImages(rawDesc: string) {
  const raw = String(rawDesc || '').trim();
  if (!raw) return null;

  const { displayName, slug } = normalizeName(raw);

  // tenta achar produto já existente
  let product = await db.product.findUnique({ where: { slug } });

  if (!product) {
    product = await db.product.create({
      data: {
        slug,
        displayName,
        normalizedFrom: raw,
      },
    });
  }

  // já tem imagens?
  const existing = await db.productImage.count({ where: { productId: product.id } });
  if (existing > 0) return product;

  // busca imagens (OFF -> ML)
  const off = await searchOFFImages(displayName);
  const ml = await searchMLImages(displayName);
  const all = [...off, ...ml].slice(0, 6);

  if (all.length) {
    await db.productImage.createMany({
      data: all.map((img, i) => ({
        productId: product!.id,
        url: img.url,
        source: img.source,
        width: img.width ?? null,
        height: img.height ?? null,
        priority: i,
      })),
      skipDuplicates: true,
    });
  }

  return product;
}
