// src/pages/api/receipts/[id].ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '@/server/db';

export const config = { runtime: 'nodejs' };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const id = String(req.query.id || '').trim();
  if (!id) return res.status(400).json({ error: 'missing_id' });

  const receipt = await db.receipt.findUnique({
    where: { id },
    include: {
      store: true,
      items: {
        orderBy: { createdAt: 'asc' },
        include: {
          product: {
            include: { images: { orderBy: { priority: 'asc' } } },
          },
        },
      },
    },
  });

  if (!receipt) return res.status(404).json({ error: 'not_found' });
  return res.status(200).json(receipt);
}
