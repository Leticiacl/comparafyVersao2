import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData, Item } from "../context/DataContext";
import BottomNav from "../components/BottomNav";
import AddItemModal from "../components/ui/AddItemModal";
import PageHeader from "../components/ui/PageHeader";
import { Menu } from "@headlessui/react";
import {
  EllipsisVerticalIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowLeftIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";
import { formatBRL } from "@/utils/price";

const ListDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    lists,
    fetchItems,
    addItem,
    updateItem,
    toggleItem,
    deleteItem,
    updateListNameInContext,
    deleteList,
    duplicateListInContext,
  } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (id) fetchItems(id);
  }, [id, fetchItems]);

  const lista = useMemo(() => lists.find((l) => l.id === id), [lists, id]);

  useEffect(() => {
    if (!id) return;
    if (lists.length && !lista) navigate("/lists", { replace: true });
  }, [id, lists, lista, navigate]);

  if (!lista) return null;

  const itens = lista.itens || [];

  // totais
  const totalGeral = +itens.reduce((sum, i) =>
    sum + Number(i.preco || 0) * Number(i.quantidade || 1), 0).toFixed(2);

  const subtotalMarcado = +itens.filter(i => i.comprado).reduce((sum, i) =>
    sum + Number(i.preco || 0) * Number(i.quantidade || 1), 0).toFixed(2);

  const comprados = itens.filter((i) => i.comprado).length;
  const pct = totalGeral > 0 ? Math.min(100, Math.round((subtotalMarcado / totalGeral) * 100)) : 0;

  const headerRight = (
    <Menu as="div" className="relative">
      <Menu.Button className="rounded p-2 hover:bg-gray-50">
        <EllipsisVerticalIcon className="h-6 w-6 text-gray-600" />
      </Menu.Button>
      <Menu.Items className="absolute right-0 z-10 mt-2 w-56 overflow-hidden rounded-md bg-white shadow ring-1 ring-black/5">
        <Menu.Item>
          {({ active }) => (
            <button
              onClick={() => { setEditing(true); setNewName(lista.nome || ""); }}
              className={`flex w-full items-center gap-2 px-4 py-2 text-left ${active ? "bg-gray-100" : ""}`}
            >
              <PencilSquareIcon className="h-5 w-5 text-gray-700" />
              Renomear
            </button>
          )}
        </Menu.Item>
        <Menu.Item>
          {({ active }) => (
            <button
              onClick={() => duplicateListInContext(lista.id)}
              className={`flex w-full items-center gap-2 px-4 py-2 text-left ${active ? "bg-gray-100" : ""}`}
            >
              <DocumentDuplicateIcon className="h-5 w-5 text-gray-700" />
              Duplicar
            </button>
          )}
        </Menu.Item>
        <div className="h-px bg-gray-100" />
        <Menu.Item>
          {({ active }) => (
            <button
              onClick={async () => { await deleteList(lista.id); navigate("/lists"); }}
              className={`flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 ${active ? "bg-gray-100" : ""}`}
            >
              <TrashIcon className="h-5 w-5" />
              Excluir
            </button>
          )}
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );

  return (
    <main className="mx-auto w-full max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl bg-white px-4 md:px-6 pt-safe pb-[88px]">
      <PageHeader
        title={lista.nome || "Minha lista"}
        subtitle={`${comprados}/${itens.length} itens · Total: ${formatBRL(totalGeral)}`}
        leftSlot={
          <button onClick={() => navigate(-1)} className="p-1" aria-label="Voltar">
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </button>
        }
        rightSlot={headerRight}
      />

      {/* Progresso interno (selecionado vs total estimado) */}
      <div className="mb-4 rounded-2xl border border-gray-200 p-3">
        <div className="mb-2 flex items-center justify-between text-sm text-gray-700">
          <span>Selecionado: <strong>{formatBRL(subtotalMarcado)}</strong></span>
          <span>Total estimado: <strong>{formatBRL(totalGeral)}</strong></span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-yellow-500 transition-[width] duration-300"
            style={{ width: `${pct}%` }}
            aria-label={`Progresso ${pct}%`}
          />
        </div>
      </div>

      {editing && (
        <div className="mb-3 flex items-center gap-2">
          <input
            className="w-full rounded border px-2 py-1"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            className="text-sm font-semibold text-yellow-600"
            onClick={() => { const t = newName.trim(); if (t) { updateListNameInContext(lista.id, t); setEditing(false); } }}
          >
            Salvar
          </button>
          <button className="text-sm text-gray-600" onClick={() => setEditing(false)}>
            Cancelar
          </button>
        </div>
      )}

      <button
        onClick={() => { setItemToEdit(null); setIsModalOpen(true); }}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-500 py-3 text-black shadow"
      >
        <span className="text-2xl leading-none">+</span> Adicionar item
      </button>

      <ul className="space-y-3">
        {itens.map((item) => {
          const totalItem = Number(item.preco || 0) * Number(item.quantidade || 1);
          return (
            <li key={item.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleItem(lista.id, item.id)}
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                    item.comprado ? "border-yellow-500 bg-yellow-500" : "border-gray-300"
                  }`}
                  aria-label={item.comprado ? "Desmarcar item" : "Marcar item"}
                >
                  {item.comprado && <CheckIcon className="h-4 w-4 text-black" />}
                </button>
                <div>
                  <h2 className={`text-lg font-semibold ${item.comprado ? "line-through text-gray-400" : "text-gray-900"}`}>
                    {item.nome}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {item.quantidade}x {item.peso ? `• ${item.peso} ${item.unidade}` : `• ${item.unidade}`}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-lg font-semibold text-gray-800">{formatBRL(totalItem)}</p>
                <p className="text-sm text-gray-600">UN. {formatBRL(Number(item.preco || 0))}</p>
                <div className="mt-1 flex justify-end gap-4 text-sm">
                  <button onClick={() => { setItemToEdit(item); setIsModalOpen(true); }} className="flex items-center gap-1 text-gray-700">
                    <PencilSquareIcon className="h-4 w-4" /> Editar
                  </button>
                  <button onClick={() => deleteItem(lista.id, item.id)} className="flex items-center gap-1 text-red-600">
                    <TrashIcon className="h-4 w-4" /> Excluir
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setItemToEdit(null); }}
        listId={lista.id}
        itemToEdit={itemToEdit || undefined}
        onSave={async (listId, data) => {
          if (itemToEdit?.id) await updateItem(listId, itemToEdit.id, data as any);
          else await addItem(listId, data as any);
        }}
        keepOpen={!itemToEdit}
      />

      <BottomNav activeTab="lists" />
    </main>
  );
};

export default ListDetail;
