// src/utils/priceIndex.ts
import { normalizeString } from "@/utils/normalizeString";

export type PriceSample = {
  purchaseId: string;
  market?: string | null;
  date?: Date | string | null;
  name: string;
  normalizedName: string;
  category?: string | null;
  brand?: string | null;
  unit?: string | null;
  qty?: number;
  total?: number; // total da linha
  unitPrice?: number; // preco unitário quando aplicável
};

export type ProductKey = string; // normalizedName

export type ProductIndex = {
  key: ProductKey;
  name: string;
  normalizedName: string;
  category?: string | null;
  brand?: string | null;

  markets: Record<
    string, // market name
    {
      samples: PriceSample[];
      min: number;
      max: number;
      avg: number;
      last?: PriceSample;
      count: number;
    }
  >;

  // agregados globais
  global: {
    min: number;
    max: number;
    avg: number;
    last?: PriceSample;
    count: number;
  };
};

export function coerceNumber(n: any, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

/**
 * Constrói um índice com base nas compras do usuário.
 * Espera uma lista de compras no formato:
 *   { id, market, date, itens: [{ nome, normalizedName?, preco, total, quantidade, unidade, brand?, category? }] }
 */
export function buildPriceIndex(purchases: any[]): Record<ProductKey, ProductIndex> {
  const idx: Record<ProductKey, ProductIndex> = {};

  for (const p of purchases || []) {
    const market: string = (p?.market ?? "—") as string;
    const date = p?.date ? new Date(p.date) : undefined;

    for (const it of p?.itens || []) {
      const name: string = it?.nome ?? "—";
      const normalizedName: string = it?.normalizedName || normalizeString(name);
      if (!normalizedName) continue;

      const unitPrice =
        typeof it?.total === "number" && it?.unidade && /^(kg|g|l|ml)$/i.test(String(it.unidade))
          ? coerceNumber(it.total) // itens de peso usam total na UI
          : coerceNumber(it.preco);

      const total = typeof it?.total === "number"
        ? coerceNumber(it.total)
        : coerceNumber(it.preco) * coerceNumber(it.quantidade || 1);

      const sample: PriceSample = {
        purchaseId: p?.id ?? "",
        market,
        date: date ?? null,
        name,
        normalizedName,
        category: it?.category ?? null,
        brand: it?.brand ?? null,
        unit: it?.unidade ?? null,
        qty: coerceNumber(it?.quantidade || 1, 1),
        unitPrice: unitPrice,
        total: total,
      };

      const key = normalizedName;
      if (!idx[key]) {
        idx[key] = {
          key,
          name,
          normalizedName,
          category: it?.category ?? null,
          brand: it?.brand ?? null,
          markets: {},
          global: { min: Infinity, max: 0, avg: 0, count: 0 },
        };
      }

      const bucket = idx[key];
      const m = market || "—";
      if (!bucket.markets[m]) {
        bucket.markets[m] = { samples: [], min: Infinity, max: 0, avg: 0, count: 0 };
      }
      const mk = bucket.markets[m];

      mk.samples.push(sample);
      mk.min = Math.min(mk.min, unitPrice || total || Infinity);
      mk.max = Math.max(mk.max, unitPrice || total || 0);
      mk.count++;
      mk.avg =
        mk.samples.reduce((acc, s) => acc + (s.unitPrice || s.total || 0), 0) / mk.samples.length;
      mk.last = mk.samples
        .slice()
        .sort((a, b) => (new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()))
        .slice(-1)[0];

      // globais
      const x = unitPrice || total || 0;
      bucket.global.min = Math.min(bucket.global.min, x || Infinity);
      bucket.global.max = Math.max(bucket.global.max, x || 0);
      bucket.global.count++;
      const all = Object.values(bucket.markets).flatMap((mm) => mm.samples);
      bucket.global.avg = all.length
        ? all.reduce((acc, s) => acc + (s.unitPrice || s.total || 0), 0) / all.length
        : 0;

      // “aprende” nome canônico mais longo (útil para UI)
      if ((name || "").length > (bucket.name || "").length) {
        bucket.name = name;
      }
      // mantém brand/categoria se vierem
      bucket.brand = bucket.brand ?? it?.brand ?? null;
      bucket.category = bucket.category ?? it?.category ?? null;
    }
  }

  // normaliza Infinities
  for (const k of Object.keys(idx)) {
    const g = idx[k].global;
    if (!Number.isFinite(g.min)) g.min = 0;
    if (!Number.isFinite(g.max)) g.max = 0;
    for (const mk of Object.values(idx[k].markets)) {
      if (!Number.isFinite(mk.min)) mk.min = 0;
      if (!Number.isFinite(mk.max)) mk.max = 0;
    }
  }

  return idx;
}

/** Converte o índice em lista, com filtros e ordenação. */
export function indexToArray(
  idx: Record<ProductKey, ProductIndex>,
  opts?: { category?: string | null; brand?: string | null; sort?: "alpha" | "min" | "avg" | "max" }
) {
  let arr = Object.values(idx);
  if (opts?.category) arr = arr.filter((p) => (p.category || null) === opts.category);
  if (opts?.brand) arr = arr.filter((p) => (p.brand || null) === opts.brand);

  switch (opts?.sort) {
    case "min":
      arr.sort((a, b) => a.global.min - b.global.min);
      break;
    case "avg":
      arr.sort((a, b) => a.global.avg - b.global.avg);
      break;
    case "max":
      arr.sort((a, b) => a.global.max - b.global.max);
      break;
    default:
      arr.sort((a, b) => (a.name || a.normalizedName).localeCompare(b.name || b.normalizedName));
  }

  return arr;
}
