// src/components/ListaCard.tsx
import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "@headlessui/react";
import {
  EllipsisVerticalIcon,
  PencilSquareIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import ConfirmDialog from "./ui/ConfirmDialog";
import { useData, Lista } from "../context/DataContext";

type Props = {
  list: Lista;
  onClick?: () => void;
};

const ListaCard: React.FC<Props> = ({ list, onClick }) => {
  const navigate = useNavigate();
  const data = useData() as any;
  const {
    updateListNameInContext,
    duplicateListInContext,
    deleteList, // fallback
    deleteListInContext, // prefer this se existir
  } = data;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [tempName, setTempName] = useState(list.nome || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const itensCount = list.itens?.length || 0;
  const comprados = useMemo(
    () => (list.itens || []).filter((i: any) => i.comprado).length,
    [list.itens]
  );

  const total = useMemo(() => {
    return (list.itens || []).reduce((acc: number, it: any) => {
      const q = typeof it.quantidade === "number" ? it.quantidade : 1;
      const p = typeof it.preco === "number" ? it.preco : 0;
      return acc + q * p;
    }, 0);
  }, [list.itens]);

  const progress = itensCount > 0 ? Math.min(100, (comprados / itensCount) * 100) : 0;

  const startRename = () => {
    setTempName(list.nome || "");
    setRenaming(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const saveRename = async () => {
    const trimmed = tempName.trim();
    setRenaming(false);
    if (!trimmed || trimmed === list.nome) return;
    updateListNameInContext(list.id, trimmed);
  };

  const cancelRename = () => {
    setTempName(list.nome || "");
    setRenaming(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (renaming || confirmOpen) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, [role='menu'], [role='menuitem'], input, textarea, a")) return;
    onClick ? onClick() : navigate(`/lists/${list.id}`);
  };

  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:bg-gray-50"
      onClick={handleCardClick}
      onMouseDownCapture={(e) => {
        if (renaming || confirmOpen) e.stopPropagation();
      }}
      role="button"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex-1">
          {renaming ? (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveRename();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    cancelRename();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-base outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); saveRename(); }}
                className="rounded-lg border border-transparent p-1.5 hover:bg-gray-100"
                aria-label="Salvar nome"
              >
                <CheckIcon className="h-5 w-5 text-green-600" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); cancelRename(); }}
                className="rounded-lg border border-transparent p-1.5 hover:bg-gray-100"
                aria-label="Cancelar"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900">
                {list.nome || "Sem nome"}
              </h2>
              <p className="text-sm text-gray-500">
                {comprados}/{itensCount} itens
              </p>
            </>
          )}
        </div>

        {/* Kebab menu */}
        <Menu as="div" className="relative">
          <Menu.Button
            type="button"
            className="rounded p-1 hover:bg-gray-100"
            onClick={(e) => e.stopPropagation()}
            aria-label="Mais opções"
          >
            <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
          </Menu.Button>

          <Menu.Items
            className="absolute right-0 z-10 mt-2 w-48 overflow-hidden rounded-xl border bg-white py-1 shadow-lg focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${active ? "bg-gray-100" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    startRename();
                  }}
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  Renomear
                </button>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${active ? "bg-gray-100" : ""}`}
                  onClick={async (e) => {
                    e.stopPropagation();
                    await duplicateListInContext(list.id);
                  }}
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                  Duplicar
                </button>
              )}
            </Menu.Item>

            <div className="my-1 h-px bg-gray-100" />

            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 ${active ? "bg-gray-100" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmOpen(true);
                    setTimeout(() => {
                      document.activeElement instanceof HTMLElement && document.activeElement.blur();
                    }, 0);
                  }}
                >
                  <TrashIcon className="h-4 w-4" />
                  Excluir
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Menu>
      </div>

      {/* Barra de progresso */}
      <div className="h-2 w-full rounded bg-gray-200">
        <div className="h-2 rounded bg-yellow-400" style={{ width: `${progress}%` }} />
      </div>

      <p className="mt-2 text-sm text-gray-600">
        Total estimado{" "}
        <span className="font-semibold text-gray-900">
          {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </span>
      </p>

      {/* Dialog de confirmação */}
      <ConfirmDialog
        open={confirmOpen}
        title="Deseja excluir esta lista?"
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={async () => {
          const del = deleteListInContext || deleteList;
          await del(list.id);
          setConfirmOpen(false);
        }}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default ListaCard;
