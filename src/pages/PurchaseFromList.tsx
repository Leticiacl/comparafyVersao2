// src/pages/PurchaseFromList.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import PageHeader from "../components/ui/PageHeader";
import RoundCheck from "@/components/RoundCheck";
import PurchaseItemModal, { PurchaseExtraItem } from "@/components/PurchaseItemModal";
import BottomNav from "@/components/BottomNav";
import { useData } from "@/context/DataContext";
import SimpleCalendar from "@/components/ui/SimpleCalendar";
import { formatBRL } from "@/utils/price";
import { toISO, isoToDisplay } from "@/utils/date";

type ListOption = { id: string; nome: string; market?: string };

function todayISO() {
  return toISO(new Date());
}

const PurchaseFromList: React.FC = () => {
  const navigate = useNavigate();
  const { lists, fetchItems, fetchPurchases, createPurchaseFromListInContext } = useData();

  // Wizard step
  const [step, setStep] = useState<1 | 2>(1);

  // Passo 1 – metadados
  const [listId, setListId] = useState<string>("");
  const [purchaseName, setPurchaseName] = useState<string>("");
  const [nameTouched, setNameTouched] = useState<boolean>(false);
  const [purchaseMarket, setPurchaseMarket] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState<string>(todayISO()); // yyyy-mm-dd
  const [showCalendar, setShowCalendar] = useState<boolean>(false);

  // Passo 2 – itens e extras
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState<boolean>(true);
  const [extras, setExtras] = useState<PurchaseExtraItem[]>([]);
  const [openModal, setOpenModal] = useState(false);

  const [saving, setSaving] = useState(false);

  // Prefill lista inicial
  useEffect(() => {
    if (lists.length && !listId) {
      setListId(lists[0].id);
    }
  }, [lists, listId]);

  const options: ListOption[] = useMemo(
    () => lists.map((l) => ({ id: l.id, nome: l.nome, market: l.market })),
    [lists]
  );
  const list = useMemo(() => lists.find((l) => l.id === listId), [lists, listId]);

  // Auto-preencher nome e mercado
  useEffect(() => {
    if (list && !nameTouched) setPurchaseName(list.nome || "");
    if (list?.market && !purchaseMarket) setPurchaseMarket(list.market);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, nameTouched]);

  // Helpers de itens
  const toggleItem = (id: string, val: boolean) => {
    const next = { ...selected, [id]: val };
    setSelected(next);
    setSelectAll((list?.itens || []).every((it) => next[it.id]));
  };

  const toggleAll = (val: boolean) => {
    setSelectAll(val);
    const map: Record<string, boolean> = {};
    (list?.itens || []).forEach((it) => (map[it.id] = val));
    setSelected(map);
  };

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected]
  );

  const totalSelected = useMemo(() => {
    const ids = new Set(Object.entries(selected).filter(([, v]) => v).map(([k]) => k));
    return (list?.itens || [])
      .filter((it) => ids.has(it.id))
      .reduce((sum, it) => sum + (Number(it.preco) || 0), 0);
  }, [selected, list]);

  const extrasTotal = useMemo(
    () => extras.reduce((s, it) => s + (Number(it.preco) || 0), 0),
    [extras]
  );

  const grandTotal = totalSelected + extrasTotal;

  // Avançar do Passo 1 para Passo 2
  const handleContinueToItems = async () => {
    try {
      if (!listId) {
        toast.error("Selecione uma lista");
        return;
      }
      await fetchItems(listId);
      const l = lists.find((x) => x.id === listId);
      const next: Record<string, boolean> = {};
      (l?.itens || []).forEach((it) => (next[it.id] = true));
      setSelected(next);
      setSelectAll(true);
      setStep(2);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível carregar os itens da lista");
    }
  };

  // Criar compra (fecha tela e trava cliques)
  const handleCreate = async () => {
    if (saving) return;
    try {
      if (!list) {
        toast.error("Selecione uma lista");
        return;
      }
      setSaving(true);

      const ids = Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => k);

      const dateObj = purchaseDate ? new Date(`${purchaseDate}T00:00:00`) : new Date();
      const name = (purchaseName || list.nome || "Compra").trim();
      const market = (purchaseMarket || list.market || "—").trim();

      await createPurchaseFromListInContext({
        listId: list.id,
        name,
        market,
        date: dateObj,
        selectedItemIds: ids,
        extras,
      });

      await fetchPurchases();
      toast.success("Compra criada!");
      return navigate("/purchases");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível criar a compra");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl bg-white px-4 md:px-6 pt-safe pb-[88px]">
      <PageHeader title="Compra de uma lista" />

      {step === 1 && (
        <>
          {/* Seleção e metadados */}
          <label className="mb-2 block font-medium text-gray-800">Selecione a lista</label>
          <select
            value={listId}
            onChange={(e) => setListId(e.target.value)}
            className="mb-4 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-yellow-400"
          >
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome}
              </option>
            ))}
          </select>

          <label className="mb-2 block font-medium text-gray-800">Nome da compra</label>
          <input
            value={purchaseName}
            onChange={(e) => {
              setNameTouched(true);
              setPurchaseName(e.target.value);
            }}
            placeholder="Ex.: Compra do mês"
            className="mb-4 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-yellow-400"
          />

          <label className="mb-2 block font-medium text-gray-800">Data</label>
          <div
            className="mb-2 w-full cursor-pointer select-none rounded-2xl border border-gray-200 px-4 py-3"
            onClick={() => setShowCalendar((v) => !v)}
            role="button"
            aria-label="Selecionar data"
          >
            {isoToDisplay(purchaseDate)}
          </div>
          {showCalendar && (
            <SimpleCalendar
              value={purchaseDate}
              onChange={(iso) => {
                setPurchaseDate(iso);
                setShowCalendar(false);
              }}
              onClose={() => setShowCalendar(false)}
            />
          )}

          <label className="mt-4 mb-2 block font-medium text-gray-800">Mercado</label>
          <input
            value={purchaseMarket}
            onChange={(e) => setPurchaseMarket(e.target.value)}
            placeholder="Ex.: Supermercado X"
            className="mb-6 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-yellow-400"
          />

          <button
            onClick={handleContinueToItems}
            className="mb-6 w-full rounded-xl bg-yellow-500 py-3 font-semibold text-black active:scale-[0.99]"
          >
            Continuar
          </button>

          <BottomNav activeTab="purchases" />
        </>
      )}

      {step === 2 && (
        <>
          {/* Selecionar tudo */}
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Itens da lista</h2>
            <button
              type="button"
              onClick={() => toggleAll(!selectAll)}
              className="flex items-center gap-2 text-gray-700"
            >
              <RoundCheck checked={selectAll} onChange={toggleAll} size={20} />
              <span>Selecionar tudo</span>
            </button>
          </div>

          {/* Itens da lista */}
          <ul className="mb-6 space-y-2">
            {(list?.itens || []).map((it) => {
              const checked = !!selected[it.id];
              return (
                <li
                  key={it.id}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 p-4 active:scale-[.995]"
                  onClick={() => toggleItem(it.id, !checked)}
                >
                  <RoundCheck
                    checked={checked}
                    onChange={(val) => toggleItem(it.id, val)}
                    size={24}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="text-lg font-semibold text-gray-900">{it.nome}</div>
                    <div className="text-sm text-gray-500">
                      {it.peso ? `${it.peso} ${it.unidade ?? ""}` : `${it.quantidade ?? 1} ${it.unidade || "un"}`} ·{" "}
                      {formatBRL(Number(it.preco) || 0)}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">{formatBRL(Number(it.preco) || 0)}</div>
                </li>
              );
            })}
          </ul>

          {/* Itens extras */}
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Itens extras</h2>
            <button onClick={() => setOpenModal(true)} className="font-semibold text-yellow-600">
              + Adicionar
            </button>
          </div>

          {extras.length > 0 && (
            <ul className="mb-6 space-y-2">
              {extras.map((ex, i) => (
                <li key={i} className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                  <div>
                    <div className="font-medium text-gray-800">{ex.nome}</div>
                    <div className="text-sm text-gray-500">
                      {ex.quantidade ?? 1}x {ex.peso ? `• ${ex.peso} ${ex.unidade}` : `• ${ex.unidade ?? "un"}`} • {formatBRL(ex.preco)}
                    </div>
                  </div>
                  <button
                    onClick={() => setExtras((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-sm text-red-600"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Resumo */}
          <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="text-sm text-gray-600">
              {selectedCount}/{list?.itens?.length ?? 0} itens
            </div>
            <div className="text-sm font-semibold text-gray-900">{formatBRL(grandTotal)}</div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="w-1/3 rounded-xl border border-gray-300 py-3 text-gray-700 active:scale-[0.99]"
            >
              Voltar
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="w-2/3 rounded-xl bg-yellow-500 py-3 font-semibold text-black active:scale-[0.99] disabled:opacity-60"
            >
              Criar compra
            </button>
          </div>

          <BottomNav activeTab="purchases" />

          {/* Modal de extras */}
          <PurchaseItemModal
            open={openModal}
            onClose={() => setOpenModal(false)}
            onConfirm={(item) => setExtras((prev) => [...prev, item])}
            title="Adicionar Item"
          />
        </>
      )}
    </main>
  );
};

export default PurchaseFromList;
