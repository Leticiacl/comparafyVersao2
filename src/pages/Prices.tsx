// src/pages/Prices.tsx
import React, { useEffect, useMemo, useState } from "react";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/ui/PageHeader";
import { useData } from "@/context/DataContext";
import { buildPriceIndex, indexToArray } from "@/utils/priceIndex";
import { formatBRL } from "@/utils/price";

const Prices: React.FC = () => {
  const { purchases = [], fetchPurchases } = useData() as any;

  useEffect(() => { fetchPurchases?.(); }, [fetchPurchases]);

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"alpha" | "min" | "avg" | "max">("min");

  const idx = useMemo(() => buildPriceIndex(purchases || []), [purchases]);

  const filtered = useMemo(() => {
    const all = indexToArray(idx, { sort });
    if (!q.trim()) return all;
    const term = q.trim().toLowerCase();
    return all.filter((p) =>
      (p.name || p.normalizedName).toLowerCase().includes(term) ||
      (p.brand || "").toLowerCase().includes(term) ||
      (p.category || "").toLowerCase().includes(term)
    );
  }, [idx, sort, q]);

  return (
    <div className="mx-auto max-w-3xl bg-white p-4 pb-28">
      <PageHeader title="Produtos & preços" subtitle="Histórico agregado por produto" />

      <div className="mb-4 flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar produto, marca ou categoria…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
        >
          <option value="min">Menor preço</option>
          <option value="avg">Médio</option>
          <option value="max">Maior preço</option>
          <option value="alpha">A–Z</option>
        </select>
      </div>

      <ul className="space-y-3">
        {filtered.map((p) => {
          const markets = Object.entries(p.markets).sort((a, b) => (a[0] || "").localeCompare(b[0] || ""));
          return (
            <li key={p.key} className="rounded-xl border border-gray-200 p-3">
              <div className="mb-1 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{p.name || p.normalizedName}</h3>
                  <p className="text-xs text-gray-600">
                    {p.brand ? `${p.brand} · ` : ""}{p.category ? p.category : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Faixa global</div>
                  <div className="text-base font-semibold">
                    {formatBRL(p.global.min)} – {formatBRL(p.global.max)}
                  </div>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {markets.map(([marketName, m]) => (
                  <div key={marketName} className="rounded-lg border border-gray-100 p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">{marketName}</span>
                      <span className="text-xs text-gray-500">{m.count} amostra(s)</span>
                    </div>
                    <div className="mt-1 text-sm">
                      <div>Min: <strong>{formatBRL(m.min)}</strong></div>
                      <div>Médio: <strong>{formatBRL(m.avg)}</strong></div>
                      <div>Max: <strong>{formatBRL(m.max)}</strong></div>
                      {m.last && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          Último: {formatBRL(m.last.unitPrice || m.last.total || 0)}
                          {m.last.date ? ` · ${new Date(m.last.date).toLocaleDateString()}` : ""}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </li>
          );
        })}
        {!filtered.length && (
          <li className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">
            Nada encontrado.
          </li>
        )}
      </ul>

      <BottomNav activeTab="products" />
    </div>
  );
};

export default Prices;
