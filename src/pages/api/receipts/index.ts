// src/pages/api/receipts/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '@/server/db';
import { ensureProductWithImages } from '@/server/enrich';

export const config = { runtime: 'nodejs' };

type ItemInput = {
  rawDesc: string;
  quantity: number;
  unit?: string | null;
  unitPrice: number;   // preço unitário (se pesável, preço por kg/l)
  total: number;       // total da linha
};

type Body = {
  accessKey: string;
  issuedAt: string;    // ISO
  uf: string;
  store: {
    name: string;
    cnpj?: string | null;
    city?: { name: string; uf: string } | null;
  };
  total?: number | null;
  items: ItemInput[];
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const body = req.body as Body;
  if (!body?.accessKey || !Array.isArray(body?.items)) {
    return res.status(400).json({ error: 'invalid_payload' });
  }

  // dedup
  const exists = await db.receipt.findUnique({ where: { accessKey: body.accessKey } });
  if (exists) return res.status(409).json({ error: 'already_exists', id: exists.id });

  // upsert da store
  const store = await db.store.upsert({
    where: { name_cnpj: { name: body.store.name, cnpj: body.store.cnpj ?? null } },
    update: { cityName: body.store.city?.name ?? null, uf: body.store.city?.uf ?? body.uf },
    create: {
      name: body.store.name,
      cnpj: body.store.cnpj ?? null,
      cityName: body.store.city?.name ?? null,
      uf: body.store.city?.uf ?? body.uf,
    },
  });

  // cria receipt
  const receipt = await db.receipt.create({
    data: {
      accessKey: body.accessKey,
      issuedAt: new Date(body.issuedAt),
      uf: body.uf,
      total: body.total ?? null,
      storeId: store.id,
    },
  });

  // cria itens + enriquece produto
  for (const it of body.items) {
    const product = await ensureProductWithImages(it.rawDesc);
    await db.receiptItem.create({
      data: {
        receiptId: receipt.id,
        rawDesc: it.rawDesc,
        productId: product?.id ?? null,
        quantity: it.quantity,
        unit: it.unit ?? null,
        unitPrice: it.unitPrice,
        total: it.total,
      },
    });
  }

  return res.status(201).json({ id: receipt.id });
}
