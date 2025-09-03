// src/pages/api/receipts/[id].ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '@/server/db';

export const config = { runtime: 'nodejs' };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  try {
    const id = String(req.query.id || '');
    if (!id) return res.status(400).json({ error: 'missing_id' });

    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        store: true,
        items: {
          include: {
            product: {
              include: { images: true },
            },
          },
        },
      },
    });
    if (!receipt) return res.status(404).json({ error: 'not_found' });

    return res.status(200).json(receipt);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'server_error' });
  }
}
