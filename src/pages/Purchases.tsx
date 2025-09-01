import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import BottomNav from "@/components/BottomNav";
import { useData } from "@/context/DataContext";
import { Menu, Dialog } from "@headlessui/react";
import {
  EllipsisVerticalIcon,
  PencilSquareIcon,
  TrashIcon,
  WrenchScrewdriverIcon, // ícone diferente para Editar
} from "@heroicons/react/24/outline";

const currency = (n: number) => `R$ ${Number(n || 0).toFixed(2)}`;
const dateOnly = (any: any) => {
  const ms = typeof any === "number" ? any : any?.seconds ? any.seconds * 1000 : Date.parse(any || "");
  if (!Number.isFinite(ms)) return "-";
  return new Date(ms).toLocaleDateString("pt-BR");
};

const Purchases: React.FC = () => {
  const { purchases, fetchPurchases, renamePurchaseInContext, deletePurchaseInContext } = useData();
  const navigate = useNavigate();

  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchases();
  }, []); // eslint-disable-line

  const fromList = useMemo(() => purchases.filter((p) => p.source === "list"), [purchases]);
  const fromReceipt = useMemo(() => purchases.filter((p) => p.source === "receipt"), [purchases]);

  const Card: React.FC<{
    id?: string;
    name: string;
    market?: string;
    createdAt?: any;
    total: number;
    count: number;
  }> = ({ id, name, market, createdAt, total, count }) => {
    const handleOpen = () => {
      if (id) navigate(`/purchases/${id}`);
    };
    const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleOpen();
      }
    };
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        className="relative cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
      >
        <div className="flex items-start justify-between">
          <div className="text-left" style={{ maxWidth: "calc(100% - 44px)" }}>
            <div className="text-lg font-semibold text-gray-900 line-clamp-1">{name || "Compra"}</div>
          </div>

          {id && (
            <Menu as="div" className="absolute right-1 top-1">
              <Menu.Button className="rounded p-2 hover:bg-gray-100" onClick={(e) => e.stopPropagation()}>
                <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
              </Menu.Button>
              <Menu.Items
                className="absolute right-0 z-10 mt-2 w-56 overflow-hidden rounded-md bg-white shadow ring-1 ring-black/5"
                onClick={(e) => e.stopPropagation()}
              >
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/purchases/${id}/edit`);
                      }}
                      className={`flex w-full items-center gap-2 px-4 py-2 text-left ${active ? "bg-gray-100" : ""}`}
                    >
                      <WrenchScrewdriverIcon className="h-5 w-5 text-gray-700" />
                      Editar
                    </button>
                  )}
                </Menu.Item>
                <div className="h-px bg-gray-100" />
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameId(id);
                        setRenameValue(name || "");
                      }}
                      className={`flex w-full items-center gap-2 px-4 py-2 text-left ${active ? "bg-gray-100" : ""}`}
                    >
                      <PencilSquareIcon className="h-5 w-5 text-gray-600" />
                      Renomear
                    </button>
                  )}
                </Menu.Item>
                <div className="h-px bg-gray-100" />
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(id);
                      }}
                      className={`flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 ${active ? "bg-gray-100" : ""}`}
                    >
                      <TrashIcon className="h-5 w-5" />
                      Excluir
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>
          )}
        </div>

        <div className="mt-1 flex w-full items-center justify-between text-left">
          <div className="text-sm text-gray-500">
            {dateOnly(createdAt)} · {market || "—"} · {count} itens
          </div>
          <div className="font-semibold text-gray-900">{currency(total)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 pb-28 max-w-xl mx-auto bg-white">
      <PageHeader title="Compras" />

      <Link
        to="/purchases/new"
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-500 py-3 font-medium text-black hover:bg-yellow-500/90"
      >
        <span className="text-xl">+</span>
        <span>Nova compra</span>
      </Link>

      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase text-gray-500">A partir de lista</h2>
      <div className="space-y-3">
        {fromList.length === 0 && <div className="px-1 text-sm text-gray-500">Nenhuma compra criada por lista.</div>}
        {fromList.map((p) => (
          <Card
            key={p.id}
            id={p.id}
            name={p.name}
            market={p.market}
            createdAt={p.createdAt}
            total={p.total ?? 0}
            count={p.itemCount ?? p.itens?.length ?? 0}
          />
        ))}
      </div>

      <h2 className="mb-2 mt-8 text-sm font-semibold uppercase text-gray-500">A partir de nota fiscal</h2>
      <div className="space-y-3">
        {fromReceipt.length === 0 && <div className="px-1 text-sm text-gray-500">Nenhuma compra importada de NFC-e.</div>}
        {fromReceipt.map((p) => (
          <Card
            key={p.id}
            id={p.id}
            name={p.name}
            market={p.market}
            createdAt={p.createdAt}
            total={p.total ?? 0}
            count={p.itemCount ?? p.itens?.length ?? 0}
          />
        ))}
      </div>

      <BottomNav activeTab="purchases" />

      <Dialog open={!!renameId} onClose={() => setRenameId(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/20" />
        <div className="fixed inset-0 grid place-items-center p-4">
          <Dialog.Panel className="w-full max-w-sm rounded-xl bg-white p-4 shadow">
            <Dialog.Title className="mb-3 text-lg font-semibold">Renomear compra</Dialog.Title>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Novo nome"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-lg bg-gray-100 px-3 py-2" onClick={() => setRenameId(null)}>
                Cancelar
              </button>
              <button
                className="rounded-lg bg-yellow-500 px-3 py-2 text-black"
                onClick={async () => {
                  if (renameId && renameValue.trim()) {
                    await renamePurchaseInContext(renameId, renameValue.trim());
                    setRenameId(null);
                  }
                }}
              >
                Salvar
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} className="relative z-50">
  <div className="fixed inset-0 bg-black/20" />
  <div className="fixed inset-0 grid place-items-center p-4">
    <Dialog.Panel className="w-full max-w-sm rounded-xl bg-white p-4 shadow">
      <Dialog.Title className="mb-4 text-lg font-semibold">
        Deseja excluir esta compra?
      </Dialog.Title>

      <div className="flex justify-end gap-2">
        <button
          className="rounded-lg bg-gray-100 px-3 py-2"
          onClick={() => setDeleteId(null)}
        >
          Cancelar
        </button>

        <button
          className="rounded-lg bg-yellow-500 px-3 py-2 text-black"
          onClick={async () => {
            if (deleteId) {
              await deletePurchaseInContext(deleteId);
              setDeleteId(null);
              await fetchPurchases?.(); // ok se existir; ignora se não
            }
          }}
        >
          Excluir
        </button>
      </div>
      </Dialog.Panel>
    </div>
  </Dialog>

</div>

); 
}

export default Purchases;