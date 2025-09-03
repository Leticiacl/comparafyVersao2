// src/pages/PurchaseDetail.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Menu, Dialog } from "@headlessui/react";
import {
  ArrowLeftIcon,
  EllipsisVerticalIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import BottomNav from "@/components/BottomNav";
import PurchaseItemModal, {
  PurchaseExtraItem as PurchaseItem,
} from "@/components/PurchaseItemModal";
import { useData } from "@/context/DataContext";
import { anyToISODate, isoToDisplay } from "@/utils/date";
import { formatBRL, computePurchaseTotal } from "@/utils/price";

/* -------- limpeza de nome (mesma regra do parser) -------- */
const STOPWORDS = new Set([
  "de","do","da","dos","das","e","ou","para","com","em",
  "no","na","nos","nas","kg","g","l","ml","bd","dz","un"
]);
function toTitle(s: string) {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => (i > 0 && STOPWORDS.has(w) ? w : w.replace(/^([a-zà-ú])/, (m) => m.toUpperCase())))
    .join(" ");
}
function cleanItemName(raw: string): string {
  if (!raw) return "";
  let s = String(raw).replace(/\s+/g, " ");
  s = s.replace(/\(c[oó]digo:\s*\d+\)/gi, "");
  s = s.replace(/\b(qtde|qtd|quant(?:idade)?|qtde total de itens|itens)\s*[:\-]?\s*[\d.,]+/gi, "");
  s = s.replace(/\s+(\d+(?:[.,]\d+)?)\s*$/g, "");
  s = s.replace(/[|]/g, " ").replace(/\s{2,}/g, " ").trim();
  s = s.replace(/\bun[:.]?\s*$/i, "").trim();
  return toTitle(s);
}

/* -------- mini-resolvedor de imagens (Open Food Facts) -------- */
const thumbCache = new Map<string, string | null>();

function useProductThumb(name: string | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const key = (name || "").toLowerCase().trim();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!key) return;
    const cached = thumbCache.get(key);
    if (cached !== undefined) { setUrl(cached); return; }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    (async () => {
      try {
        // tenta achar 1 imagem pelo nome (resultado rápido)
        const q = encodeURIComponent(key);
        const res = await fetch(
          `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${q}&search_simple=1&action=process&json=1&page_size=1`,
          { signal: ac.signal }
        );
        let found: string | null = null;
        if (res.ok) {
          const j = await res.json();
          const prod = j?.products?.[0];
          found =
            prod?.image_front_thumb_url ||
            prod?.image_front_small_url ||
            prod?.image_front_url ||
            null;
        }
        thumbCache.set(key, found);
        setUrl(found);
      } catch {
        thumbCache.set(key, null);
        setUrl(null);
      }
    })();

    return () => ac.abort();
  }, [key]);

  return url;
}

/* -------- helpers -------- */
function dateOnlyDisplay(any: any): string {
  const iso = anyToISODate(
    typeof any === "number" ? any : any?.seconds ? any.seconds * 1000 : any
  );
  return isoToDisplay(iso);
}

export default function PurchaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    purchases = [],
    renamePurchaseInContext,
    deletePurchaseInContext,
    updatePurchaseItemInContext,
    deletePurchaseItemInContext,
    appendItemsToPurchaseById,
  } = useData() as any;

  const p = useMemo(() => purchases.find((x: any) => x.id === id), [purchases, id]);

  const [editingTitle, setEditingTitle] = useState(false);
  const [newName, setNewName] = useState(p?.name || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  type EditState = { index: number; nome: string; quantidade: number; unidade: string; preco: number };
  const [edit, setEdit] = useState<EditState | null>(null);

  if (!p) {
    return (
      <main className="mx-auto w-full max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl bg-white px-4 md:px-6 pt-safe pb-[88px]">
        <div className="p-4 text-center text-gray-500">Compra não encontrada.</div>
        <BottomNav activeTab="purchases" />
      </main>
    );
  }

  const canAddItems = p?.source !== "receipt";
  const total = computePurchaseTotal(p);

  return (
    <main className="mx-auto w-full max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl bg-white px-4 md:px-6 pt-safe pb-[88px]">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="rounded p-2 hover:bg-gray-50">
          <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
        </button>

        <div className="min-w-0 flex-1 px-2">
          {!editingTitle ? (
            <div className="truncate text-2xl font-bold text-gray-900">{p.name || "Compra"}</div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                className="flex-1 rounded-xl border px-3 py-2"
              />
              <button
                className="rounded-xl bg-yellow-500 px-4 py-2 font-medium text:black"
                onClick={async () => {
                  const v = newName.trim();
                  if (v && v !== p.name) await renamePurchaseInContext(p.id, v);
                  setEditingTitle(false);
                }}
              >
                Salvar
              </button>
            </div>
          )}
          <div className="truncate text-sm text-gray-500">
            {dateOnlyDisplay(p.createdAt)} · {p.market || "—"} · {(p.itens || []).length} itens
          </div>
        </div>

        <Menu as="div" className="relative">
          <Menu.Button className="rounded p-2 hover:bg-gray-50">
            <EllipsisVerticalIcon className="h-6 w-6 text-gray-600" />
          </Menu.Button>
          <Menu.Items className="absolute right-0 z-10 mt-2 w-56 overflow-hidden rounded-md bg-white shadow ring-1 ring-black/5">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => { setNewName(p.name || ""); setEditingTitle(true); }}
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
                  onClick={() => setConfirmDelete(true)}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 ${active ? "bg-gray-100" : ""}`}
                >
                  <TrashIcon className="h-5 w-5" />
                  Excluir
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Menu>

        <img src="/LOGO_REDUZIDA.png" alt="Logo" className="ml-2 h-8" />
      </div>

      {/* Adicionar item */}
      {canAddItems && (
        <button
          onClick={() => setAddOpen(true)}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-500 py-3 font-medium text-black shadow active:scale-[0.99]"
        >
          <span className="text-2xl leading-none">+</span> Adicionar item
        </button>
      )}

      {/* Itens */}
      <div className="overflow-hidden rounded-2xl border border-gray-200">
        {p.itens?.map((it: any, i: number) => {
          const linhaTotal =
            (typeof it.total === "number" && it.total) ||
            (Number(it.preco) || 0) * (Number(it.quantidade) || 1);

          const name = cleanItemName(it.nome || it.name || "");
          // se o item já tiver imagem vinda do backend, usa; senão tenta OFF
          const localThumb =
            it.img || it.image || it.product?.images?.[0]?.url || it.images?.[0]?.url || null;
          const offThumb = useProductThumb(localThumb ? undefined : name);
          const thumb = localThumb || offThumb;

          return (
            <div key={i} className="flex items-start justify-between border-b border-gray-100 p-4 last:border-b-0">
              <div className="flex items-start gap-3">
                {thumb ? (
                  <img src={thumb} alt={name} className="mt-0.5 h-12 w-12 rounded-lg object-cover" />
                ) : (
                  <div className="mt-0.5 h-12 w-12 rounded-lg bg-gray-100" />
                )}
                <div>
                  <div className="font-medium text-gray-900">{name}</div>
                  <div className="text-sm text-gray-500">
                    {Number(it.quantidade) || 1}× · {it.unidade || "un"} {it.peso ? `· ${it.peso}` : ""}
                  </div>
                  <div className="text-sm text-gray-500">UN. {formatBRL(it.preco || 0)}</div>

                  {canAddItems && (
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <button
                        className="flex items-center gap-1 text-gray-700 hover:underline"
                        onClick={() =>
                          setEdit({
                            index: i,
                            nome: name,
                            quantidade: Number(it.quantidade) || 1,
                            unidade: it.unidade || "un",
                            preco: Number(it.preco) || 0,
                          })
                        }
                      >
                        <PencilSquareIcon className="h-4 w-4" /> Editar
                      </button>
                      <button
                        className="flex items-center gap-1 text-red-600 hover:underline"
                        onClick={() => deletePurchaseItemInContext(p.id, i)}
                      >
                        <TrashIcon className="h-4 w-4" /> Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right font-semibold text-gray-900">{formatBRL(linhaTotal)}</div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-lg font-bold">Total</span>
        <span className="text-lg font-extrabold">{formatBRL(total)}</span>
      </div>

      <BottomNav activeTab="purchases" />

      {/* Modal adicionar item */}
      <PurchaseItemModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onConfirm={async (item) => {
          const payload: PurchaseItem = {
            nome: cleanItemName(item.nome),
            quantidade: item.quantidade ?? 1,
            unidade: item.unidade ?? "un",
            preco: Number(item.preco || 0),
            mercado: item.mercado ?? "",
            observacoes: item.observacoes ?? "",
            peso: item.peso,
          };
          await appendItemsToPurchaseById(p.id, [payload]);
          setAddOpen(false);
        }}
        title="Adicionar Item"
      />

      {/* Editar item */}
      <Dialog open={!!edit} onClose={() => setEdit(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/20" />
        <div className="fixed inset-0 grid place-items-center p-4">
          <Dialog.Panel className="w-full max-w-sm rounded-xl bg-white p-4 shadow">
            <Dialog.Title className="mb-3 text-lg font-semibold">Editar item</Dialog.Title>
            {edit && (
              <div className="space-y-3">
                <div>
                  <div className="mb-1 text-sm font-medium">Nome</div>
                  <input
                    className="w-full rounded-lg border px-3 py-2"
                    value={edit.nome}
                    onChange={(e) => setEdit({ ...edit, nome: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="mb-1 text-sm font-medium">Qtd.</div>
                    <input
                      type="number" min={1} className="w-full rounded-lg border px-3 py-2"
                      value={edit.quantidade}
                      onChange={(e) => setEdit({ ...edit, quantidade: Math.max(1, Number(e.target.value || 1)) })}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-sm font-medium">Unidade</div>
                    <input
                      className="w-full rounded-lg border px-3 py-2"
                      value={edit.unidade}
                      onChange={(e) => setEdit({ ...edit, unidade: e.target.value })}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-sm font-medium">Preço</div>
                    <input
                      type="number" step="0.01" className="w-full rounded-lg border px-3 py-2"
                      value={edit.preco}
                      onChange={(e) => setEdit({ ...edit, preco: Number(e.target.value || 0) })}
                    />
                  </div>
                </div>

                <div className="mt-2 flex justify-end gap-2">
                  <button className="rounded-lg bg-gray-100 px-3 py-2" onClick={() => setEdit(null)}>Cancelar</button>
                  <button
                    className="rounded-lg bg-yellow-500 px-3 py-2 text-black"
                    onClick={async () => {
                      if (!edit) return;
                      await updatePurchaseItemInContext(p.id, edit.index, {
                        nome: cleanItemName(edit.nome),
                        quantidade: edit.quantidade,
                        unidade: edit.unidade,
                        preco: edit.preco,
                      });
                      setEdit(null);
                    }}
                  >
                    Salvar
                  </button>
                </div>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Confirmar exclusão */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/20" />
        <div className="fixed inset-0 grid place-items-center p-4">
          <Dialog.Panel className="w-full max-w-sm rounded-xl bg-white p-4 shadow">
            <Dialog.Title className="mb-4 text-lg font-semibold">Deseja excluir esta compra?</Dialog.Title>
            <div className="flex justify-end gap-2">
              <button className="rounded-lg bg-gray-100 px-3 py-2" onClick={() => setConfirmDelete(false)}>Cancelar</button>
              <button
                className="rounded-lg bg-yellow-500 px-3 py-2 text-black"
                onClick={async () => { await deletePurchaseInContext(p.id); setConfirmDelete(false); navigate("/purchases"); }}
              >
                Excluir
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </main>
  );
}
