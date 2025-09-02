import { prisma } from './_lib/prisma';

export default async function handler(req: Request) {
  const q = new URL(req.url).searchParams.get('q') || '';
  const rows = await prisma.store.findMany({
    where: { name: { contains: q, mode: 'insensitive' } },
    take: 20,
  });
  return new Response(JSON.stringify(rows), { status: 200 });
}
