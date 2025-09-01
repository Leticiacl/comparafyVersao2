import React, { useEffect, useMemo, useRef, useState } from "react";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/ui/PageHeader";
import { useData } from "@/context/DataContext";
import {
  CalendarDaysIcon,
  BuildingStorefrontIcon,
  BanknotesIcon,
  CubeIcon,
  ChevronDownIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import Sparkline from "@/components/ui/Sparkline";

// 🔸 além do categorize, importamos o “sinal” de pronto
import {
  categorize,
  getCategorizerVersion,
  onCategorizerReady,
} from "@/assets/catalog-data/categorizeFromDataset";

type Tab = "produtos" | "compras" | "estatisticas";
type PeriodKey = "none" | "30" | "60" | "90" | "max";

/* ---------- helpers ---------- */
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

// 🔸 normaliza e devolve a categoria SEMPRE em minúsculas
function toCategoryLabel(c: any): string {
  const out =
    (typeof c === "string" && c) ||
    c?.categoria ||
    c?.category ||
    c?.cat ||
    c?.nomeCategoria ||
    c?.name ||
    "outros";
  return String(out || "outros").toLowerCase();
}

/* ---------- Dropdown genérico ---------- */
function Dropdown({
  label,
  options,
  value,
  onChange,
  showSelected = false,
  align = "left",
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  showSelected?: boolean;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const selectedLabel =
    options.find((o) => String(o.value) === String(value))?.label || label;

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{showSelected ? selectedLabel : label}</span>
        <ChevronDownIcon className="ml-2 h-4 w-4 text-gray-500" />
      </button>

      {open && (
        <div
          className={[
            "absolute z-20 mt-2 max-h-60 overflow-auto rounded-2xl border border-gray-200 bg-white p-1 shadow-lg",
            "min-w-full sm:w-[220px]",
            align === "right" ? "right-0" : "left-0",
          ].join(" ")}
        >
          {options.map((opt) => {
            const selected = String(value) === String(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-gray-800 hover:bg-yellow-100 hover:text-yellow-700"
                role="option"
                aria-selected={selected}
              >
                <span className="w-4">{selected ? <CheckIcon className="h-4 w-4" /> : null}</span>
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ========================================================================== */

export default function Compare() {
  const { purchases = [] } = useData();
  const [tab, setTab] = useState<Tab>("produtos");

  // 🔸 quando o categorizador ficar pronto, forçamos nova renderização
  const [catVer, setCatVer] = useState(getCategorizerVersion());
  useEffect(() => {
    const off = onCategorizerReady(() => setCatVer(getCategorizerVersion()));
    return off;
  }, []);

  /* ------------------------- PRODUTOS ------------------------- */
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"az" | "min" | "max">("az");
  const [histPeriod, setHistPeriod] = useState<PeriodKey>("none");
  const [catFilter, setCatFilter] = useState<string>("");

  // busca por prefixo de palavra
  const wordPrefixMatch = (name: string, q: string) => {
    const tokens = norm(q).split(/\s+/).filter(Boolean);
    if (!tokens.length) return true;
    const words = norm(name).split(/[^a-z0-9]+/).filter(Boolean);
    return tokens.every((t) => words.some((w) => w.startsWith(t)));
  };

  const now = new Date();
  const histEnd = endOfDay(now);
  const histStart =
    histPeriod === "max"
      ? new Date(0)
      : histPeriod === "none"
      ? new Date(0)
      : startOfDay(subDays(now, Number(histPeriod) - 1));

  type Row = { market: string; nome: string; preco: number; date: Date; categoria: string };
  type Group = { nome: string; rows: Row[]; categoria: string };

  const { produtoGrupos, historyMap, categoriasDisponiveis } = useMemo(() => {
    const rows: Row[] = [];
    const history = new Map<string, number[]>();

    if (histPeriod === "none") {
      const latest = new Map<string, Row>();
      for (const p of purchases) {
        const d = toDate(p.createdAt);
        for (const it of p.itens || []) {
          if (query && !wordPrefixMatch(it.nome, query)) continue;

          const total =
            (typeof it.total === "number" && it.total) ||
            (Number(it.preco) || 0) * (Number(it.quantidade) || 1);
          const unit =
            Number(it.preco) ||
            (total && Number(it.quantidade) ? total / Number(it.quantidade) : 0);
          const price = +((unit || total) || 0).toFixed(2);
          const market = p.market || "—";
          const categoria = toCategoryLabel(categorize(it.nome || ""));
          const key = `${norm(it.nome)}|${market}`;

          const row: Row = { market, nome: it.nome, preco: price, date: d, categoria };
          const prev = latest.get(key);
          if (!prev || d.getTime() > prev.date.getTime()) latest.set(key, row);
        }
      }
      rows.push(...latest.values());
    } else {
      for (const p of purchases) {
        const d = toDate(p.createdAt);
        if (d < histStart || d > histEnd) continue;
        for (const it of p.itens || []) {
          if (query && !wordPrefixMatch(it.nome, query)) continue;

          const total =
            (typeof it.total === "number" && it.total) ||
            (Number(it.preco) || 0) * (Number(it.quantidade) || 1);
          const unit =
            Number(it.preco) ||
            (total && Number(it.quantidade) ? total / Number(it.quantidade) : 0);
          const price = +((unit || total) || 0).toFixed(2);
          const market = p.market || "—";
          const categoria = toCategoryLabel(categorize(it.nome || ""));

          rows.push({ market, nome: it.nome, preco: price, date: d, categoria });

          const hKey = `${norm(it.nome)}|${market}`;
          if (!history.has(hKey)) history.set(hKey, []);
          history.get(hKey)!.push(price);
        }
      }
      for (const [k, arr] of history) history.set(k, arr.slice(-20));
    }

    const map = new Map<string, Group>();
    for (const r of rows) {
      const key = norm(r.nome);
      if (!map.has(key)) map.set(key, { nome: r.nome, rows: [], categoria: r.categoria });
      map.get(key)!.rows.push(r);
    }
    let groups = Array.from(map.values());

    groups = groups.sort((a, b) => {
      if (sort === "az") return norm(a.nome).localeCompare(norm(b.nome));
      const minA = Math.min(...a.rows.map((r) => r.preco));
      const minB = Math.min(...b.rows.map((r) => r.preco));
      if (sort === "min") return minA - minB;
      const maxA = Math.max(...a.rows.map((r) => r.preco));
      const maxB = Math.max(...b.rows.map((r) => r.preco));
      return maxB - maxA;
    });

    const categorias = [...new Set(groups.map((g) => g.categoria).filter(Boolean))].sort();

    return { produtoGrupos: groups, historyMap: history, categoriasDisponiveis: categorias };
    // 🔸 dependemos de catVer para recategorizar quando o dicionário ficar pronto
  }, [purchases, query, sort, histPeriod, histStart.getTime(), histEnd.getTime(), catVer]);

  /* -------------------------- COMPRAS ------------------------- */
  const [aId, setAId] = useState<string>("");
  const [bId, setBId] = useState<string>("");
  const a = purchases.find((p) => p.id === aId);
  const b = purchases.find((p) => p.id === bId);

  const compareRows = useMemo(() => {
    if (!a || !b) return [];
    const sum = (it: any) =>
      (typeof it.total === "number" && it.total) ||
      (Number(it.preco) || 0) * (Number(it.quantidade) || 1);

    const mapA = new Map<string, number>();
    for (const it of a.itens || []) mapA.set(norm(it.nome), +sum(it).toFixed(2));

    const mapB = new Map<string, number>();
    for (const it of b.itens || []) mapB.set(norm(it.nome), +sum(it).toFixed(2));

    const keysIntersec = [...mapA.keys()].filter((k) => mapB.has(k));
    return keysIntersec
      .map((k) => ({
        key: k,
        nome: (a.itens || []).find((x: any) => norm(x.nome) === k)?.nome || k,
        a: mapA.get(k)!,
        b: mapB.get(k)!,
        equal: Math.abs(mapA.get(k)! - mapB.get(k)!) < 0.005,
      }))
      .sort((x, y) => norm(x.nome).localeCompare(norm(y.nome)));
  }, [a, b]);

  /* ------------------------ ESTATÍSTICAS ---------------------- */
  const [period, setPeriod] = useState<Exclude<PeriodKey, "none">>("30");
  const now2 = new Date();
  const end = endOfDay(now2);
  const start = period === "max" ? new Date(0) : startOfDay(subDays(now2, Number(period) - 1));

  const filtered = useMemo(
    () =>
      purchases.filter((p) => {
        const d = toDate(p.createdAt);
        return d >= start && d <= end;
      }),
    [purchases, start.getTime(), end.getTime()]
  );

  const byMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filtered) {
      const d = toDate(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) || 0) + (Number(p.total) || 0));
    }
    return Array.from(map.entries())
      .map(([k, v]) => ({ key: k, label: k.split("-").reverse().join("/"), total: +v.toFixed(2) }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [filtered]);

  const byMarket = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filtered)
      map.set(p.market || "—", (map.get(p.market || "—") || 0) + (Number(p.total) || 0));
    return Array.from(map.entries())
      .map(([m, v]) => ({ market: m, total: +v.toFixed(2) }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const top5 = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filtered) {
      for (const it of p.itens || []) {
        const tot =
          (typeof it.total === "number" && it.total) ||
          (Number(it.preco) || 0) * (Number(it.quantidade) || 1);
        const key = norm(it.nome);
        map.set(key, (map.get(key) || 0) + (+tot || 0));
      }
    }
    return Array.from(map.entries())
      .map(([k, v]) => ({ nome: k, total: +v.toFixed(2) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filtered]);

  /* --------------------------- UI ----------------------------- */
  return (
    <div className="mx-auto max-w-xl bg-white px-4 md:px-6 pt-safe pb-28">
      <PageHeader title="Comparar" />

      {/* Tabs */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        {(["produtos", "compras", "estatisticas"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-2xl px-3 py-2 text-sm font-semibold shadow-inner ${
              tab === t ? "bg-yellow-500 text-black" : "bg-gray-100 text-gray-700"
            }`}
          >
            {t === "produtos" ? "Produto" : t === "compras" ? "Compras" : "Estatísticas"}
          </button>
        ))}
      </div>

      {/* ---------- PRODUTO ---------- */}
      {tab === "produtos" && (
        <>
          <div className="mb-2 flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Filtros – ordem: Categorias, A–Z, Período */}
          <div className="mb-3 grid grid-cols-3 gap-2">
            <Dropdown
              label="Categorias"
              showSelected={catFilter !== ""}
              value={catFilter}
              onChange={(v) => setCatFilter(v)}
              options={[
                { value: "", label: "Todas" },
                ...categoriasDisponiveis.map((c) => ({ value: c, label: c })),
              ]}
              align="left"
            />

            <Dropdown
              label="A–Z"
              value={sort}
              onChange={(v) => setSort(v as "az" | "min" | "max")}
              options={[
                { value: "az", label: "A–Z" },
                { value: "min", label: "Menor preço" },
                { value: "max", label: "Maior preço" },
              ]}
              align="left"
            />

            <Dropdown
              label="Período"
              showSelected={histPeriod !== "none"}
              value={histPeriod}
              onChange={(v) => setHistPeriod(v as PeriodKey)}
              options={[
                { value: "none", label: "Nenhum" },
                { value: "30", label: "30 dias" },
                { value: "60", label: "60 dias" },
                { value: "90", label: "90 dias" },
                { value: "max", label: "Máximo" },
              ]}
              align="right"
            />
          </div>

          {/* Lista de produtos */}
          <div className="space-y-3">
            {produtoGrupos
              .filter((g) => !catFilter || g.categoria === catFilter)
              .map((g, i) => {
                const valores = g.rows.map((r) => r.preco);
                const faixa = valores.length
                  ? `${brl(Math.min(...valores))} – ${brl(Math.max(...valores))}`
                  : "—";

                const rowsByMarket = g.rows.reduce<Record<string, Row[]>>((acc, r) => {
                  (acc[r.market] ||= []).push(r);
                  return acc;
                }, {});
                const markets = Object.keys(rowsByMarket).sort((a, b) => a.localeCompare(b));

                return (
                  <div key={i} className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-[15px] font-semibold text-gray-900">{g.nome}</h3>
                      <span className="text-xs text-gray-500">{g.categoria}</span>
                    </div>
                    <div className="text-[15px] font-semibold text-gray-900">{faixa}</div>

                    {histPeriod !== "none" && (
                      <div className="mt-2 space-y-2">
                        {markets.map((mkt) => {
                          const sorted = rowsByMarket[mkt].sort(
                            (a, b) => a.date.getTime() - b.date.getTime()
                          );
                          const samples = sorted.map((r) => r.preco);
                          const last = samples[samples.length - 1] ?? 0;
                          const avg =
                            samples.length > 0
                              ? +(samples.reduce((s, v) => s + v, 0) / samples.length).toFixed(2)
                              : 0;
                          const variation = avg ? ((last - avg) / avg) * 100 : 0;

                          const hKey = `${norm(g.nome)}|${mkt}`;
                          const hist = historyMap.get(hKey) || [];

                          return (
                            <div
                              key={mkt}
                              className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3"
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm text-gray-800">{mkt}</div>
                                <div className="text-xs text-gray-500">
                                  Último: <span className="font-medium text-gray-800">{brl(last)}</span>
                                  {" · "}
                                  Média: <span className="font-medium">{brl(avg)}</span>
                                  {" · "}
                                  <span className={variation >= 0 ? "text-red-600" : "text-green-600"}>
                                    {variation >= 0 ? "▲" : "▼"} {Math.abs(variation).toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                              <Sparkline data={hist} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </>
      )}

      {/* ---------- COMPRAS ---------- */}
      {tab === "compras" && (
        <>
          <div className="mb-3 grid grid-cols-1 gap-2">
            <select
              value={aId}
              onChange={(e) => setAId(e.target.value)}
              className="rounded-2xl border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Selecione a compra A</option>
              {purchases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.market || "—"} · {brl(p.total || 0)}
                </option>
              ))}
            </select>
            <select
              value={bId}
              onChange={(e) => setBId(e.target.value)}
              className="rounded-2xl border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Selecione a compra B</option>
              {purchases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.market || "—"} · {brl(p.total || 0)}
                </option>
              ))}
            </select>
          </div>

          {a && b ? (
            <>
              <div className="mb-3 grid grid-cols-2 gap-2">
                {[a, b].map((x) => (
                  <div key={x.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                    <div className="text-sm font-semibold text-gray-900">{x.name}</div>
                    <div className="text-xs text-gray-500">{x.market || "—"}</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">{brl(x.total || 0)}</div>
                  </div>
                ))}
              </div>

              <CompareList a={a} b={b} />
            </>
          ) : (
            <p className="px-1 text-sm text-gray-500">Escolha duas compras para comparar.</p>
          )}
        </>
      )}

      {/* ---------- ESTATÍSTICAS ---------- */}
      {tab === "estatisticas" && (
        <StatsSection filtered={filtered} period={period} setPeriod={setPeriod} />
      )}

      <BottomNav activeTab="compare" />
    </div>
  );
}

/* --------- Subcomponentes ---------- */
function CompareList({ a, b }: { a: any; b: any }) {
  const brl = (n: number) =>
    Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const norm = (s: string) =>
    (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/ç/gi, "c").toLowerCase().trim();

  const sum = (it: any) =>
    (typeof it.total === "number" && it.total) ||
    (Number(it.preco) || 0) * (Number(it.quantidade) || 1);

  const mapA = new Map<string, number>();
  for (const it of a.itens || []) mapA.set(norm(it.nome), +sum(it).toFixed(2));
  const mapB = new Map<string, number>();
  for (const it of b.itens || []) mapB.set(norm(it.nome), +sum(it).toFixed(2));

  const keysIntersec = [...mapA.keys()].filter((k) => mapB.has(k));
  const rows = keysIntersec
    .map((k) => ({
      key: k,
      nome: (a.itens || []).find((x: any) => norm(x.nome) === k)?.nome || k,
      a: mapA.get(k)!,
      b: mapB.get(k)!,
      equal: Math.abs(mapA.get(k)! - mapB.get(k)!) < 0.005,
    }))
    .sort((x, y) => norm(x.nome).localeCompare(norm(y.nome)));

  if (rows.length === 0)
    return <p className="px-1 text-sm text-gray-500">Não há itens repetidos entre as duas compras.</p>;

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.key} className="rounded-2xl border border-gray-200 bg-white p-3">
          <div className="mb-2 text-sm text-gray-800">{r.nome}</div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-gray-200 px-2 py-1 text-sm">
              A: <span className="font-semibold">{brl(r.a || 0)}</span>
            </div>
            <div className="rounded-xl border border-gray-200 px-2 py-1 text-sm">
              B: <span className="font-semibold">{brl(r.b || 0)}</span>
            </div>
            <div className="ml-auto text-xs text-gray-500">{r.equal ? "igual" : ""}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsSection({
  filtered,
  period,
  setPeriod,
}: {
  filtered: any[];
  period: "30" | "60" | "90" | "max";
  setPeriod: (v: "30" | "60" | "90" | "max") => void;
}) {
  const brl = (n: number) =>
    Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const toDate = (v: any) => (v?.seconds ? new Date(v.seconds * 1000) : new Date(v));
  const norm = (s: string) =>
    (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/ç/gi, "c").toLowerCase().trim();

  const byMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filtered) {
      const d = toDate(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) || 0) + (Number(p.total) || 0));
    }
    return Array.from(map.entries())
      .map(([k, v]) => ({ key: k, label: k.split("-").reverse().join("/"), total: +v.toFixed(2) }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [filtered]);

  const byMarket = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filtered)
      map.set(p.market || "—", (map.get(p.market || "—") || 0) + (Number(p.total) || 0));
    return Array.from(map.entries())
      .map(([m, v]) => ({ market: m, total: +v.toFixed(2) }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const top5 = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filtered) {
      for (const it of p.itens || []) {
        const tot =
          (typeof it.total === "number" && it.total) ||
          (Number(it.preco) || 0) * (Number(it.quantidade) || 1);
        const key = norm(it.nome);
        map.set(key, (map.get(key) || 0) + (+tot || 0));
      }
    }
    return Array.from(map.entries())
      .map(([k, v]) => ({ nome: k, total: +v.toFixed(2) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filtered]);

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <label className="text-sm text-gray-700">Período:</label>
        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="appearance-none rounded-2xl border border-gray-200 bg-white px-3 py-2 pr-8 text-sm"
          >
            <option value="30">30 dias</option>
            <option value="60">60 dias</option>
            <option value="90">90 dias</option>
            <option value="max">Máximo</option>
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-gray-500" />
        </div>
      </div>

      {/* Gastos por mês */}
      <div className="mb-3 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b p-3">
          <CalendarDaysIcon className="h-5 w-5 text-yellow-500" />
          <div className="font-semibold text-gray-900">Gastos por mês</div>
        </div>
        <div className="p-3">
          {byMonth.length === 0 ? (
            <div className="py-4 text-center text-sm text-gray-500">Sem dados no período.</div>
          ) : (
            <ul className="space-y-2">
              {byMonth.map((m) => (
                <li
                  key={m.key}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
                >
                  <span className="text-sm text-gray-800">{m.label}</span>
                  <span className="text-sm font-semibold text-gray-900">{brl(m.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Gastos por mercado */}
      <div className="mb-3 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b p-3">
          <BuildingStorefrontIcon className="h-5 w-5 text-yellow-500" />
          <div className="font-semibold text-gray-900">Gastos por mercado</div>
        </div>
        <div className="p-3">
          {byMarket.length === 0 ? (
            <div className="py-4 text-center text-sm text-gray-500">Sem dados no período.</div>
          ) : (
            <ul className="space-y-2">
              {byMarket.map((m) => (
                <li
                  key={m.market}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
                >
                  <span className="text-sm text-gray-800">{m.market}</span>
                  <span className="text-sm font-semibold text-gray-900">{brl(m.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Top 5 produtos */}
      <div className="mb-10 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b p-3">
          <BanknotesIcon className="h-5 w-5 text-yellow-500" />
          <div className="font-semibold text-gray-900">Top 5 produtos mais comprados</div>
        </div>
        <div className="p-3">
          {top5.length === 0 ? (
            <div className="py-4 text-center text-sm text-gray-500">Sem dados no período.</div>
          ) : (
            <ul className="space-y-2">
              {top5.map((t, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
                >
                  <span className="truncate text-sm text-gray-800">{t.nome}</span>
                  <span className="text-sm font-semibold text-gray-900">{brl(t.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Gastos por categoria */}
      <div className="mb-10 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b p-3">
          <CubeIcon className="h-5 w-5 text-yellow-500" />
          <div className="font-semibold text-gray-900">Gastos por categoria</div>
        </div>
        <div className="p-3">
          {(() => {
            const map = new Map<string, number>();
            for (const p of filtered) {
              for (const it of p.itens || []) {
                const tot =
                  (typeof it.total === "number" && it.total) ||
                  (Number(it.preco) || 0) * (Number(it.quantidade) || 1);
                const cat = toCategoryLabel(categorize(it.nome || ""));
                map.set(cat, (map.get(cat) || 0) + (+tot || 0));
              }
            }
            const list = Array.from(map.entries())
              .map(([cat, v]) => ({ cat, total: +v.toFixed(2) }))
              .sort((a, b) => b.total - a.total);

            if (!list.length)
              return <div className="py-4 text-center text-sm text-gray-500">Sem dados no período.</div>;

            return (
              <ul className="space-y-2">
                {list.map((c) => (
                  <li
                    key={c.cat}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <span className="text-sm text-gray-800">{c.cat}</span>
                    <span className="text-sm font-semibold text-gray-900">{brl(c.total)}</span>
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>
      </div>
    </>
  );
}
