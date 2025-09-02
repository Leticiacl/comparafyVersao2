import { prisma } from './_lib/prisma';
import { getUserFromAuthHeader } from './_lib/auth';

type ReceiptPayload = {
  accessKey: string;              // 44 dígitos
  issuedAt: string;               // ISO
  uf: string;                     // "MG", "ES", ...
  store: { cnpj?: string; name: string; city?: { name?: string; uf?: string } };
  total: number;
  items: Array<{
    rawDesc: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    total: number;
    aliasProductId?: number;      // opcional
  }>;
};

export default async function handler(req: Request) {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const { uid, email } = getUserFromAuthHeader(req.headers.get('authorization') || '');
    const body = (await req.json()) as ReceiptPayload;

    // garante usuário
    await prisma.user.upsert({
      where: { id: uid },
      update: { email: email || undefined },
      create: { id: uid, email: email || undefined },
    });

    // cidade/estado (se vierem)
    let cityId: number | undefined;
    if (body.store?.city?.name && body.store.city.uf) {
      const state = await prisma.state.upsert({
        where: { uf: body.store.city.uf },
        update: {},
        create: { uf: body.store.city.uf, name: body.store.city.uf },
      });
      const city = await prisma.city.upsert({
        where: { name_stateId: { name: body.store.city.name, stateId: state.id } },
        update: {},
        create: { name: body.store.city.name, stateId: state.id },
      });
      cityId = city.id;
    }

    // endereço vazio só para vincular city (opcional)
    const address = cityId
      ? await prisma.address.create({ data: { cityId } })
      : undefined;

    // loja
    let storeId: number | undefined;
    if (body.store?.name) {
      const store = await prisma.store.upsert({
        where: body.store.cnpj ? { cnpj: body.store.cnpj } : { name: body.store.name },
        update: { name: body.store.name, addressId: address?.id },
        create: { name: body.store.name, cnpj: body.store.cnpj || null, addressId: address?.id },
      });
      storeId = store.id;
    }

    // transação
    const created = await prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.create({
        data: {
          accessKey: body.accessKey,
          issuedAt: new Date(body.issuedAt),
          uf: body.uf,
          userId: uid,
          storeId,
          total: body.total,
        },
      });

      for (const it of body.items) {
        // tenta achar product via alias
        let productId: number | undefined = undefined;

        if (it.aliasProductId) {
          productId = it.aliasProductId;
        } else {
          const alias = await tx.productAlias.findUnique({ where: { alias: it.rawDesc } });
          if (alias) productId = alias.productId;
        }

        await tx.receiptItem.create({
          data: {
            receiptId: receipt.id,
            productId,
            rawDesc: it.rawDesc,
            quantity: it.quantity,
            unit: it.unit || null,
            unitPrice: it.unitPrice,
            total: it.total,
          },
        });

        // histórico de preço (mesmo sem product ainda)
        await tx.priceHistory.create({
          data: {
            productId: productId ?? null,
            storeId: storeId || null,
            price: it.unitPrice,
            measuredAt: new Date(body.issuedAt),
            receiptId: receipt.id,
          },
        });
      }

      return receipt;
    });

    return new Response(JSON.stringify({ ok: true, id: created.id }), { status: 201 });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 400 });
  }
}
