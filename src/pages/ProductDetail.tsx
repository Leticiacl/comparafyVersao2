import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/ui/PageHeader";
import BottomNav from "@/components/BottomNav";
import { useData } from "@/context/DataContext";
import Sparkline from "@/components/ui/Sparkline";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

type PeriodKey = "none" | "30" | "60" | "90" | "max";

const brl = (n: number) =>
  Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const norm = (s: string) =>
  (s || "")
    .normalize("NFD")
    // @ts-ignore
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ç/gi, "c")
    .toLowerCase()
    .trim();

const toDate = (v: any): Date => {
  if (v instanceof Date) return v;
  if (v?.seconds) return new Date(v.seconds * 1000);
  if (typeof v === "number") return new Date(v);
  const d = new Date(v);
  return isNaN(d.getTime()) ? new Date() : d;
};
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const endOfDay   = (d: Date) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
const subDays    = (d: Date, days: number) => { const x = new Date(d); x.setDate(x.getDate() - days); return x; };

export default function ProductDetail() {
  const nav = useNavigate();
  const { name = "" } = useParams();
  const target = decodeURIComponent(name || "");
  const { purchases = [] } = useData();

  const [period, setPeriod] = useState<PeriodKey>("none");

  const now = new Date();
  const end = endOfDay(now);
  const start =
    period === "max"
      ? new Date(0)
      : period === "none"
      ? new Date(0)
      : startOfDay(subDays(now, Number(period) - 1));

  const data = useMemo(() => {
    const key = norm(target);
    type Row = {
      date: Date;
      market: string;
      qty: number;
      unit?: string;
      total: number;
      unitPrice: number;
    };

    const rows: Row[] = [];
    for (const p of purchases) {
      const d = toDate(p.createdAt);
      if (period !== "none" && (d < start || d > end)) continue;
      for (const it of p.itens || []) {
        if (norm(it.nome) !== key) continue;

        const total =
          (typeof it.total === "number" && it.total) ||
          (Number(it.preco) || 0) * (Number(it.quantidade) || 1);
        const unitPrice =
          Number(it.preco) ||
          (total && Number(it.quantidade) ? total / Number(it.quantidade) : total);

        rows.push({
          date: d,
          market: p.market || "—",
          qty: Number(it.quantidade) || 1,
          unit: it.unidade || undefined,
          total: +Number(total || 0).toFixed(2),
          unitPrice: +Number(unitPrice || 0).toFixed(2),
        });
      }
    }

    // ordenar por data asc para sparklines
    const sorted = rows.slice().sort((a, b) => a.date.getTime() - b.date.getTime());
    const seriesGlobal = sorted.map((r) => r.unitPrice || r.total).slice(-40); // limita 40 pts

    // métricas globais (com base no último preço válido)
    const last = sorted.length ? sorted[sorted.length - 1].unitPrice || sorted[sorted.length - 1].total : 0;
    const min = sorted.length ? Math.min(...sorted.map((r) => r.unitPrice || r.total)) : 0;
    const max = sorted.length ? Math.max(...sorted.map((r) => r.unitPrice || r.total)) : 0;
    const avg = sorted.length
      ? +(sorted.reduce((s, r) => s + (r.unitPrice || r.total), 0) / sorted.length).toFixed(2)
      : 0;

    // por mercado
    const byMarket = new Map<string, Row[]>();
    for (const r of sorted) {
      if (!byMarket.has(r.market)) byMarket.set(r.market, []);
      byMarket.get(r.market)!.push(r);
    }
    const marketBlocks = Array.from(byMarket.entries())
      .map(([m, arr]) => {
        const s = arr.map((r) => r.unitPrice || r.total).slice(-30);
        const lastM = arr.length ? arr[arr.length - 1].unitPrice || arr[arr.length - 1].total : 0;
        const avgM =
          arr.length ? +(arr.reduce((s, r) => s + (r.unitPrice || r.total), 0) / arr.length).toFixed(2) : 0;
        const varPct = avgM ? +(((lastM - avgM) / avgM) * 100).toFixed(0) : 0;
        return {
          market: m,
          last: lastM,
          avg: avgM,
          series: s,
          varPct,
        };
      })
      .sort((a, b) => a.market.localeCompare(b.market));

    // ocorrências (lista de compras)
    const occurrences = rows
      .slice()
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    return { rows, seriesGlobal, last, min, max, avg, marketBlocks, occurrences };
  }, [purchases, target, period, start.getTime(), end.getTime()]);

  return (
    <div className="mx-auto max-w-xl bg-white px-4 md:px-6 pt-safe pb-28">
      <PageHeader
        title={target || "Produto"}
        leftSlot={
          <button onClick={() => nav(-1)} className="p-1" aria-label="Voltar">
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </button>
        }
      />

      {/* período */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodKey)}
          className="rounded-2xl border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="none">Histórico: Nenhum</option>
          <option value="30">Histórico: 30 dias</option>
          <option value="60">Histórico: 60 dias</option>
          <option value="90">Histórico: 90 dias</option>
          <option value="max">Histórico: Máximo</option>
        </select>
        <div />
      </div>

      {/* resumo global */}
      <div className="mb-3 rounded-2xl border border-gray-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-semibold text-gray-900">Resumo</div>
          {period !== "none" && <Sparkline data={data.seriesGlobal} width={120} />}
        </div>
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-2">
            <div className="text-[11px] text-gray-500">Último</div>
            <div className="font-semibold text-gray-900">{brl(data.last)}</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-2">
            <div className="text-[11px] text-gray-500">Mín</div>
            <div className="font-semibold text-gray-900">{brl(data.min)}</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-2">
            <div className="text-[11px] text-gray-500">Máx</div>
            <div className="font-semibold text-gray-900">{brl(data.max)}</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-2">
            <div className="text-[11px] text-gray-500">Média</div>
            <div className="font-semibold text-gray-900">{brl(data.avg)}</div>
          </div>
        </div>
      </div>

      {/* por mercado */}
      <div className="mb-3 space-y-2">
        {data.marketBlocks.map((b) => (
          <div key={b.market} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-3">
            <div className="min-w-0">
              <div className="truncate text-sm text-gray-800">{b.market}</div>
              {period !== "none" ? (
                <div className="text-xs text-gray-500">
                  Último: <span className="font-medium text-gray-800">{brl(b.last)}</span>
                  {" · "}
                  Média: <span className="font-medium">{brl(b.avg)}</span>
                  {" · "}
                  <span className={b.varPct >= 0 ? "text-red-600" : "text-green-600"}>
                    {b.varPct >= 0 ? "▲" : "▼"} {Math.abs(b.varPct)}%
                  </span>
                </div>
              ) : (
                <div className="text-xs text-gray-500">Último: <span className="font-medium">{brl(b.last)}</span></div>
              )}
            </div>
            {period !== "none" && <Sparkline data={b.series} />}
          </div>
        ))}
      </div>

      {/* ocorrências */}
      <div className="mb-10 rounded-2xl border border-gray-200 bg-white p-3">
        <div className="mb-2 font-semibold text-gray-900">Ocorrências</div>
        {data.rows.length === 0 ? (
          <div className="py-4 text-center text-sm text-gray-500">Sem dados no período.</div>
        ) : (
          <ul className="max-h-[320px] space-y-2 overflow-auto text-sm">
            {data.occurrences.map((o, i) => (
              <li key={i} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-gray-800">{o.market}</div>
                  <div className="text-xs text-gray-500">
                    {o.date.toLocaleDateString("pt-BR")} · {o.qty} {o.unit || "un"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{brl(o.unitPrice || o.total)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <BottomNav activeTab="compare" />
    </div>
  );
}
