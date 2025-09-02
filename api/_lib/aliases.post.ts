import { prisma } from './_lib/prisma';

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const { alias, productId } = await req.json();
  if (!alias || !productId) return new Response('alias and productId required', { status: 400 });

  const res = await prisma.productAlias.upsert({
    where: { alias },
    update: { productId },
    create: { alias, productId },
  });

  return new Response(JSON.stringify(res), { status: 201 });
}
