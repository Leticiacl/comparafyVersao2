// src/pages/PurchaseEdit.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import PageHeader from "@/components/ui/PageHeader";
import BottomNav from "@/components/BottomNav";
import SimpleCalendar from "@/components/ui/SimpleCalendar";
import { useData } from "@/context/DataContext";
import { toISO, isoToDisplay } from "@/utils/date";

const PurchaseEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { purchases, fetchPurchases, updatePurchaseMetaInContext } = useData() as any;

  const p = useMemo(() => purchases.find((x: any) => x.id === id), [purchases, id]);

  const [loading, setLoading] = useState(!p);
  const [name, setName] = useState<string>(p?.name || "");
  const [market, setMarket] = useState<string>(p?.market || "");
  const [dateISO, setDateISO] = useState<string>(p ? toISO(new Date(p.createdAt?.seconds ? p.createdAt.seconds * 1000 : p.createdAt)) : "");
  const [showCal, setShowCal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!p && id) {
        setLoading(true);
        await fetchPurchases();
        setLoading(false);
      }
    })();
  }, [p, id, fetchPurchases]);

  useEffect(() => {
    if (p) {
      setName(p.name || "");
      setMarket(p.market || "");
      const ms = typeof p.createdAt === "number"
        ? p.createdAt
        : p.createdAt?.seconds
        ? p.createdAt.seconds * 1000
        : Date.parse(p.createdAt || "");
      setDateISO(toISO(new Date(ms)));
    }
  }, [p]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-xl bg-white p-4 pb-28">
        <PageHeader title="Editar compra" />
        <div className="p-4 text-gray-500">Carregando…</div>
        <BottomNav activeTab="purchases" />
      </main>
    );
  }

  if (!p) {
    return (
      <main className="mx-auto w-full max-w-xl bg-white p-4 pb-28">
        <PageHeader title="Editar compra" />
        <div className="p-4 text-gray-500">Compra não encontrada.</div>
        <BottomNav activeTab="purchases" />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl bg-white p-4 pb-28">
      <PageHeader title="Editar compra" />

      <label className="mb-2 mt-2 block font-medium text-gray-800">Nome da compra</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-4 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-yellow-400"
        placeholder="Ex.: Compra do mês"
      />

      <label className="mb-2 block font-medium text-gray-800">Data</label>
      <div
        className="mb-2 w-full cursor-pointer select-none rounded-2xl border border-gray-200 px-4 py-3"
        onClick={() => setShowCal((v) => !v)}
        role="button"
        aria-label="Selecionar data"
      >
        {isoToDisplay(dateISO)}
      </div>
      {showCal && (
        <SimpleCalendar
          value={dateISO}
          onChange={(iso) => {
            setDateISO(iso);
            setShowCal(false);
          }}
          onClose={() => setShowCal(false)}
        />
      )}

      <label className="mt-4 mb-2 block font-medium text-gray-800">Mercado</label>
      <input
        value={market}
        onChange={(e) => setMarket(e.target.value)}
        className="mb-6 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-yellow-400"
        placeholder="Ex.: Supermercado X"
      />

      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-1/3 rounded-xl border border-gray-300 py-3 text-gray-700 active:scale-[0.99]"
        >
          Cancelar
        </button>
        <button
          onClick={async () => {
            try {
              setSaving(true);
              const when = new Date(`${dateISO}T00:00:00`);
              await updatePurchaseMetaInContext(p.id, {
                name: name.trim(),
                market: market.trim(),
                createdAt: when,
              });
              toast.success("Compra atualizada!");
              navigate(`/purchases/${p.id}`);
            } catch (e) {
              console.error(e);
              toast.error("Não foi possível salvar as alterações.");
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
          className="w-2/3 rounded-xl bg-yellow-500 py-3 font-semibold text-black active:scale-[0.99] disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      <BottomNav activeTab="purchases" />
    </main>
  );
};

export default PurchaseEdit;
