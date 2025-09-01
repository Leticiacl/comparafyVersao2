import React, { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { useData } from "@/context/DataContext";

export type ListItemInput = {
  nome: string;
  quantidade: number | "" ;
  unidade: string;
  peso?: number | "";
  preco?: number | "";
  observacoes?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;

  /** lista onde o item será salvo */
  listId: string | null;

  /** quando presente, o modal entra em modo edição */
  itemToEdit?: (ListItemInput & { id: string });

  /** manter aberto após salvar (usado para “adicionar vários”) */
  keepOpen?: boolean;

  /**
   * Compatibilidade com tela de listas (criação).
   * Se não for passado, o modal usa diretamente o DataContext.
   */
  onSave?: (listId: string, item: ListItemInput) => Promise<any>;
};

function toNumber(v: number | string | "" | undefined | null): number | null {
  if (v === "" || v === undefined || v === null) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const AddItemModal: React.FC<Props> = ({
  isOpen,
  onClose,
  listId,
  itemToEdit,
  keepOpen,
  onSave,
}) => {
  const { addItem, updateItem } = useData();

  const [form, setForm] = useState<ListItemInput>({
    nome: "",
    quantidade: 1,
    unidade: "kg",
    peso: "",
    preco: "",
    observacoes: "",
  });

  // carrega valores quando abrimos para edição
  useEffect(() => {
    if (isOpen && itemToEdit) {
      setForm({
        nome: itemToEdit.nome ?? "",
        quantidade:
          (typeof itemToEdit.quantidade === "number"
            ? itemToEdit.quantidade
            : Number(itemToEdit.quantidade)) || 1,
        unidade: itemToEdit.unidade || "kg",
        peso:
          itemToEdit.peso === undefined || itemToEdit.peso === null
            ? ""
            : (itemToEdit.peso as number),
        preco:
          itemToEdit.preco === undefined || itemToEdit.preco === null
            ? ""
            : (itemToEdit.preco as number),
        observacoes: itemToEdit.observacoes || "",
      });
    }
    if (isOpen && !itemToEdit) {
      // modo criar: limpa
      setForm({
        nome: "",
        quantidade: 1,
        unidade: "kg",
        peso: "",
        preco: "",
        observacoes: "",
      });
    }
  }, [isOpen, itemToEdit]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listId) return;

    const payload = {
      nome: form.nome.trim(),
      quantidade: toNumber(form.quantidade) ?? 1,
      unidade: form.unidade || "kg",
      peso: toNumber(form.peso) ?? undefined,
      preco: toNumber(form.preco) ?? undefined,
      observacoes: (form.observacoes || "").trim(),
    };

    try {
      // 🔁 SE tem id => EDITA; senão, CRIA
      if (itemToEdit?.id) {
        await updateItem(listId, itemToEdit.id, payload as any);
      } else {
        if (onSave) {
          await onSave(listId, payload as any);
        } else {
          await addItem(listId, payload as any);
        }
      }

      if (!keepOpen) onClose();
      else {
        // limpar só em modo "adicionar vários"
        if (!itemToEdit?.id) {
          setForm({
            nome: "",
            quantidade: 1,
            unidade: "kg",
            peso: "",
            preco: "",
            observacoes: "",
          });
        }
      }
    } catch (err) {
      alert("Não foi possível salvar o item. Verifique sua sessão e permissões.");
      // console.error(err);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px]" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold mb-4">
            {itemToEdit ? "Editar item" : "Adicionar item"}
          </Dialog.Title>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Nome *</label>
              <input
                className="mt-1 w-full rounded-lg border p-2"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Quantidade *</label>
              <input
                className="mt-1 w-full rounded-lg border p-2"
                inputMode="decimal"
                value={form.quantidade}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quantidade: e.target.value as any }))
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Peso</label>
                <input
                  className="mt-1 w-full rounded-lg border p-2"
                  inputMode="decimal"
                  value={form.peso ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, peso: e.target.value as any }))
                  }
                  placeholder="ex.: 5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Unidade</label>
                
                <select
                  className="mt-1 w-full rounded-lg border p-2"
                  value={form.unidade}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unidade: e.target.value }))
                  }
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="l">l</option>
                  <option value="ml">ml</option>
                  <option value="dúzia">dúzia</option>
                  <option value="un">un</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Preço</label>
              <input
                className="mt-1 w-full rounded-lg border p-2"
                inputMode="decimal"
                value={form.preco ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, preco: e.target.value as any }))
                }
                placeholder="ex.: 10,99"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Observações / Marca
              </label>
              <textarea
                className="mt-1 w-full rounded-lg border p-2"
                rows={3}
                value={form.observacoes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, observacoes: e.target.value }))
                }
                placeholder="Ex.: marca, promoção, detalhes..."
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-gray-100 px-4 py-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-yellow-500 px-4 py-2 font-semibold text-black"
              >
                {itemToEdit ? "Salvar" : "Adicionar"}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AddItemModal;
