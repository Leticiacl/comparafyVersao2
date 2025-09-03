// src/pages/api/receipts.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '@/server/db';
import { findOrCreateProductFromRaw } from '@/server/enrich';

export const config = { runtime: 'nodejs' };

type IncomingItem = {
  rawDesc: string;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  total: number;
};

type IncomingPayload = {
  accessKey: string;
  issuedAt: string; // ISO
  uf: string;
  store: {
    name: string;
    cnpj?: string | null;
    city?: { name: string; uf: string } | null;
  };
  total?: number | null;
  items: IncomingItem[];
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    const payload = req.body as IncomingPayload;

    if (!payload?.accessKey || !payload?.issuedAt || !payload?.uf || !payload?.store?.name) {
      return res.status(400).json({ error: 'invalid_payload' });
    }

    // dedupe por accessKey
    const already = await prisma.receipt.findUnique({ where: { accessKey: payload.accessKey } });
    if (already) {
      return res.status(409).json({ error: 'already_exists', id: already.id });
    }

    // Store: usa CNPJ quando houver, senão nome + cidade/uf
    let store = null as any;

    if (payload.store.cnpj) {
      store = await prisma.store.upsert({
        where: { cnpj: payload.store.cnpj },
        create: {
          name: payload.store.name,
          cnpj: payload.store.cnpj ?? undefined,
          city: payload.store.city?.name || undefined,
          uf: payload.store.city?.uf || payload.uf,
        },
        update: {
          name: payload.store.name,
          city: payload.store.city?.name || undefined,
          uf: payload.store.city?.uf || payload.uf,
        },
      });
    } else {
      // fallback: tenta achar por (name+city+uf)
      store = await prisma.store.findFirst({
        where: {
          name: payload.store.name,
          city: payload.store.city?.name || undefined,
          uf: payload.store.city?.uf || payload.uf,
        },
      });
      if (!store) {
        store = await prisma.store.create({
          data: {
            name: payload.store.name,
            city: payload.store.city?.name || undefined,
            uf: payload.store.city?.uf || payload.uf,
          },
        });
      }
    }

    const receipt = await prisma.receipt.create({
      data: {
        accessKey: payload.accessKey,
        issuedAt: new Date(payload.issuedAt),
        uf: payload.uf,
        total: payload.total ?? null,
        storeId: store.id,
      },
    });

    // cria itens e tenta vincular a produtos (com imagens)
    for (const it of payload.items) {
      const product = await findOrCreateProductFromRaw(it.rawDesc).catch(() => null);

      await prisma.receiptItem.create({
        data: {
          receiptId: receipt.id,
          rawDesc: it.rawDesc,
          quantity: it.quantity,
          unit: it.unit || null,
          unitPrice: it.unitPrice,
          total: it.total,
          productId: product?.id || null,
        },
      });
    }

    return res.status(201).json({ id: receipt.id });
  } catch (e: any) {
    console.error('[receipts_api] error', e);
    return res.status(500).json({ error: 'server_error', detail: e?.message });
  }
}
