import React, { useEffect, useState } from "react";

export type PurchaseExtraItem = {
  nome: string;
  quantidade: number;
  unidade: string;
  peso?: number;
  preco: number;
  observacoes?: string;
  mercado?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (item: PurchaseExtraItem) => void;
  initial?: Partial<PurchaseExtraItem>;
  title?: string;
};

const units = ["kg", "g", "l", "ml", "dúzia", "un"];
const inputBase =
  "w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-gray-300 placeholder:text-gray-400";

const PurchaseItemModal: React.FC<Props> = ({ open, onClose, onConfirm, initial = {}, title }) => {
  const [nome, setNome] = useState(initial.nome ?? "");
  const [quantidade, setQuantidade] = useState<number>(Number(initial.quantidade ?? 1));
  const [peso, setPeso] = useState<string>(initial.peso != null ? String(initial.peso) : "");
  const [unidade, setUnidade] = useState(initial.unidade ?? "kg");
  const [precoStr, setPrecoStr] = useState<string>(initial.preco != null ? toMoney(initial.preco!) : "");
  const [observacoes, setObservacoes] = useState(initial.observacoes ?? "");

  useEffect(() => {
    if (!open) return;
    setNome(initial.nome ?? "");
    setQuantidade(Number(initial.quantidade ?? 1));
    setPeso(initial.peso != null ? String(initial.peso) : "");
    setUnidade(initial.unidade ?? "kg");
    setPrecoStr(initial.preco != null ? toMoney(Number(initial.preco)) : "");
    setObservacoes(initial.observacoes ?? "");
  }, [open]);

  if (!open) return null;

  const parseMoney = (s: string) =>
    Number((s || "0").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")) || 0;

  function toMoney(n: number) {
    return n ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace("R$ ", "") : "";
  }

  const confirm = () => {
    if (!nome.trim()) return;
    onConfirm({
      nome: nome.trim(),
      quantidade: Number.isFinite(quantidade) ? quantidade : 1,
      unidade,
      peso: peso ? Number(peso) : undefined,
      preco: parseMoney(precoStr),
      observacoes: observacoes?.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-6 text-3xl font-extrabold">{title ?? "Adicionar Item"}</h2>

        <label className="mb-1 block text-sm font-medium">Nome *</label>
        <input
          className={`${inputBase} mb-4`}
          placeholder="Ex.: Arroz"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <label className="mb-1 block text-sm font-medium">Quantidade *</label>
        <input
          type="number"
          min={1}
          className={`${inputBase} mb-4`}
          value={quantidade}
          onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
        />

        <label className="mb-1 block text-sm font-medium">Peso</label>
        <div className="mb-4 flex gap-3">
          <input
            type="number"
            step="any"
            className={`${inputBase} w-2/3`}
            placeholder="Ex.: 1.5"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
          />
          <select className={`${inputBase} w-1/3`} value={unidade} onChange={(e) => setUnidade(e.target.value)}>
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        <label className="mb-1 block text-sm font-medium">Preço</label>
        <div className="relative mb-4">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
          <input
            inputMode="decimal"
            className={`${inputBase} pl-9`}
            placeholder="0,00"
            value={precoStr}
            onChange={(e) => setPrecoStr(e.target.value)}
          />
        </div>

        <label className="mb-1 block text-sm font-medium">Observações</label>
        <textarea
          className={`${inputBase} mb-6`}
          placeholder="Alguma observação?"
          rows={3}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl bg-gray-100 px-5 py-3 font-medium text-gray-800">
            Cancelar
          </button>
          <button onClick={confirm} className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-black">
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseItemModal;
