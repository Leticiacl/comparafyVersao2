import { prisma } from './_lib/prisma';

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = Number(searchParams.get('productId'));
  const storeId = searchParams.get('storeId') ? Number(searchParams.get('storeId')) : undefined;

  if (!productId) return new Response('productId required', { status: 400 });

  const rows = await prisma.priceHistory.findMany({
    where: { productId, ...(storeId ? { storeId } : {}) },
    orderBy: { measuredAt: 'desc' },
    take: 50,
  });

  return new Response(JSON.stringify(rows), { status: 200 });
}
