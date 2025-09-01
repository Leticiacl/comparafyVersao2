// src/services/firestoreService.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/* ======================== Tipos exportados ======================== */
export type NewItem = {
  nome: string;
  quantidade?: number;
  unidade?: string;
  preco?: number;
  mercado?: string;
  observacoes?: string;
  peso?: number;
  comprado?: boolean;
};

export type PurchaseItem = {
  nome: string;
  quantidade: number;
  unidade?: string;
  peso?: number;
  preco: number; // unitário (ou total quando item por peso)
  mercado?: string;
  total?: number; // opcional (quando já vem total da linha)
};

export type Purchase = {
  id: string;
  name: string;
  market?: string;
  createdAt: Date | Timestamp | number | string;
  itens: PurchaseItem[];
  itemCount?: number;
  total?: number;
  source?: "list" | "receipt";
  sourceRefId?: string;
  sourceRefName?: string;
};

/* ======================== Helpers ======================== */
const listsCol = (userId: string) => collection(db, "users", userId, "lists");
const listDoc = (userId: string, listId: string) => doc(db, "users", userId, "lists", listId);
const listItemsCol = (userId: string, listId: string) =>
  collection(db, "users", userId, "lists", listId, "items");

const purchasesCol = (userId: string) => collection(db, "users", userId, "purchases");
const purchaseDoc = (userId: string, purchaseId: string) =>
  doc(db, "users", userId, "purchases", purchaseId);
const purchaseItemsCol = (userId: string, purchaseId: string) =>
  collection(db, "users", userId, "purchases", purchaseId, "items");

function toJsDate(any: any): Date {
  if (any instanceof Date) return any;
  if (any && typeof any.seconds === "number") return new Date(any.seconds * 1000);
  const d = new Date(any);
  return isNaN(d.getTime()) ? new Date() : d;
}

/** Remove campos `undefined`, define defaults e garante `total` numérico. */
function sanitizePurchaseItem(raw: any) {
  const nome = String(raw?.nome || raw?.name || "").trim() || "Item";
  const quantidade = Number(raw?.quantidade ?? 1) || 1;

  const precoUnit =
    Number(
      raw?.preco ??
        // alguns parsers trazem "unitario"
        raw?.unitario ??
        // quando só temos "total" e "quantidade", inferimos o unitário
        (typeof raw?.total === "number" && quantidade ? raw.total / quantidade : 0)
    ) || 0;

  const total =
    Number(
      raw?.total ??
        precoUnit * quantidade
    ) || 0;

  const doc: any = {
    nome,
    quantidade,
    preco: precoUnit,
    total,
    createdAt: serverTimestamp(),
  };

  // só inclui se existir (Firestore não aceita undefined)
  if (raw?.unidade) doc.unidade = String(raw.unidade);
  if (typeof raw?.peso === "number") doc.peso = Number(raw.peso);
  if (raw?.mercado) doc.mercado = String(raw.mercado);

  return doc;
}

/* ======================== LISTAS ======================== */

// Lista todas as listas (sem itens)
export async function fetchUserLists(userId: string) {
  const snap = await getDocs(listsCol(userId));
  return snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      nome: data.nome || data.name || "Minha lista",
      market: data.market || data.mercado || undefined,
      itens: [] as any[],
      createdAt: data.createdAt || null,
    };
  });
}

// Cria uma nova lista
export async function createNewList(userId: string, nome: string) {
  const ref = await addDoc(listsCol(userId), {
    nome: (nome || "Minha lista").trim(),
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, nome, itens: [] as any[], createdAt: new Date() };
}

// Busca itens de uma lista
export async function fetchItemsFromList(userId: string, listId: string) {
  let itemsSnap;
  try {
    itemsSnap = await getDocs(query(listItemsCol(userId, listId), orderBy("createdAt", "asc")));
  } catch {
    itemsSnap = await getDocs(listItemsCol(userId, listId));
  }
  return itemsSnap.docs.map((d) => {
    const x = d.data() as any;
    return {
      id: d.id,
      nome: x.nome,
      quantidade: Number(x.quantidade ?? 1),
      unidade: x.unidade ?? "un",
      preco: Number(x.preco ?? 0),
      mercado: x.mercado ?? "",
      observacoes: x.observacoes ?? "",
      comprado: !!x.comprado,
      peso: typeof x.peso === "number" ? x.peso : undefined,
    };
  });
}

// Adiciona item
export async function addItemToList(userId: string, listId: string, item: NewItem) {
  const ref = await addDoc(listItemsCol(userId, listId), {
    nome: item.nome,
    quantidade: Number(item.quantidade ?? 1),
    unidade: item.unidade ?? "un",
    preco: Number(item.preco ?? 0),
    mercado: item.mercado ?? "",
    observacoes: item.observacoes ?? "",
    comprado: !!item.comprado,
    peso: typeof item.peso === "number" ? item.peso : null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// Atualiza item
export async function updateItem(
  userId: string,
  listId: string,
  itemId: string,
  data: Omit<NewItem, "comprado">
) {
  await updateDoc(doc(db, "users", userId, "lists", listId, "items", itemId), {
    nome: data.nome,
    quantidade: Number(data.quantidade ?? 1),
    unidade: data.unidade ?? "un",
    preco: Number(data.preco ?? 0),
    mercado: data.mercado ?? "",
    observacoes: data.observacoes ?? "",
    peso: typeof data.peso === "number" ? data.peso : null,
  } as any);
}

// Alterna comprado
export async function toggleItemPurchased(userId: string, listId: string, itemId: string) {
  const ref = doc(db, "users", userId, "lists", listId, "items", itemId);
  const snap = await getDoc(ref);
  const cur = (snap.data() as any) || {};
  const next = !cur.comprado;
  await updateDoc(ref, { comprado: next });
  return { ...cur, comprado: next };
}

// Exclui item
export async function deleteItem(userId: string, listId: string, itemId: string) {
  await deleteDoc(doc(db, "users", userId, "lists", listId, "items", itemId));
}

// Renomeia lista
export async function updateListName(userId: string, listId: string, novoNome: string) {
  await updateDoc(listDoc(userId, listId), { nome: (novoNome || "").trim() });
}

// Exclui lista (com itens)
export async function deleteListFromFirestore(userId: string, listId: string) {
  const items = await getDocs(listItemsCol(userId, listId));
  await Promise.all(items.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(listDoc(userId, listId));
}

// Duplica lista (com itens)
export async function duplicateList(userId: string, listId: string) {
  const src = await getDoc(listDoc(userId, listId));
  if (!src.exists()) return;
  const data = src.data() as any;
  const newRef = await addDoc(listsCol(userId), {
    nome: data?.nome ? `${data.nome} (cópia)` : "Minha lista (cópia)",
    createdAt: serverTimestamp(),
  });
  const items = await getDocs(listItemsCol(userId, listId));
  for (const it of items.docs) {
    const x = it.data() as any;
    await addDoc(listItemsCol(userId, newRef.id), {
      ...x,
      createdAt: serverTimestamp(),
      comprado: false,
    });
  }
}

// Marca todos como comprados
export async function markAllItemsPurchased(userId: string, listId: string) {
  const items = await getDocs(listItemsCol(userId, listId));
  await Promise.all(items.docs.map((d) => updateDoc(d.ref, { comprado: true })));
}

/* ======================== Sugestões ======================== */
export async function saveSuggestion(userId: string, field: string, value: string) {
  const ref = doc(db, "users", userId, "suggestions", field);
  const snap = await getDoc(ref);
  const existing = ((snap.data() as any)?.values as string[]) || [];
  const v = (value || "").trim();
  if (!v) return;
  if (existing.includes(v)) return;
  const next = [...existing, v].slice(-50);
  if (snap.exists()) await updateDoc(ref, { values: next });
  else await setDoc(ref, { values: next });
}

export async function getSuggestionsForField(userId: string, field: string) {
  const ref = doc(db, "users", userId, "suggestions", field);
  const snap = await getDoc(ref);
  return ((snap.data() as any)?.values as string[]) || [];
}

/* ======================== COMPRAS ======================== */

export async function fetchPurchasesForUser(userId: string): Promise<Purchase[]> {
  const ps = await getDocs(purchasesCol(userId));
  const out: Purchase[] = [];
  for (const d of ps.docs) {
    const data = d.data() as any;

    let itsSnap;
    try {
      itsSnap = await getDocs(query(purchaseItemsCol(userId, d.id), orderBy("createdAt", "asc")));
    } catch {
      itsSnap = await getDocs(purchaseItemsCol(userId, d.id));
    }

    const itens: PurchaseItem[] = itsSnap.docs.map((it) => {
      const x = it.data() as any;
      return {
        nome: x.nome,
        quantidade: Number(x.quantidade ?? 1),
        unidade: x.unidade,
        peso: typeof x.peso === "number" ? x.peso : undefined,
        preco: Number(x.preco ?? 0),
        mercado: x.mercado,
        total: typeof x.total === "number" ? Number(x.total) : Number(x.preco || 0) * Number(x.quantidade || 1),
      };
    });

    const total = itens.reduce((s, it) => s + (Number(it.total) || (Number(it.preco) || 0) * (Number(it.quantidade) || 1)), 0);

    out.push({
      id: d.id,
      name: data.name || data.sourceRefName || "Compra",
      market: data.market || "",
      createdAt: data.date || data.createdAt || new Date(),
      itens,
      itemCount: itens.length,
      total,
      source: data.source,
      sourceRefId: data.sourceRefId,
      sourceRefName: data.sourceRefName,
    });
  }
  return out;
}

// Compra a partir de LISTA
export async function createPurchaseFromList(params: {
  userId: string;
  listId: string;
  name: string;
  market: string;
  date: Date;
  selectedItemIds?: string[];
  extras?: PurchaseItem[];
}): Promise<Purchase> {
  const { userId, listId, name, market, date, selectedItemIds = [], extras = [] } = params;

  // carrega itens da lista (apenas os selecionados)
  const listaItens: any[] = [];
  const itemsSnap = await getDocs(listItemsCol(userId, listId));
  for (const it of itemsSnap.docs) {
    if (selectedItemIds.length && !selectedItemIds.includes(it.id)) continue;
    const x = it.data() as any;
    listaItens.push({
      nome: x.nome,
      quantidade: Number(x.quantidade ?? 1),
      unidade: x.unidade ?? "un",
      peso: typeof x.peso === "number" ? x.peso : undefined,
      preco: Number(x.preco ?? 0),
      mercado: x.mercado ?? "",
    });
  }
  const itens: PurchaseItem[] = [...listaItens, ...(extras || [])];

  const pref = await addDoc(purchasesCol(userId), {
    source: "list",
    sourceRefId: listId,
    sourceRefName: name,
    name: name,
    market: market || "",
    createdAt: date,
    date,
  });

  for (const it of itens) {
    await addDoc(purchaseItemsCol(userId, pref.id), sanitizePurchaseItem(it));
  }

  const total = itens.reduce((s, it) => {
    const t = typeof it.total === "number" ? it.total : (Number(it.preco) || 0) * (Number(it.quantidade) || 1);
    return s + t;
  }, 0);

  return {
    id: pref.id,
    name,
    market,
    createdAt: date,
    itens,
    itemCount: itens.length,
    total,
    source: "list",
    sourceRefId: listId,
    sourceRefName: name,
  };
}

// Compra a partir de CUPOM/NFC-e
export async function createPurchaseFromReceipt(params: {
  userId: string;
  name: string;
  market: string;
  date: Date;
  itens?: PurchaseItem[];
}): Promise<Purchase> {
  const { userId, name, market, date, itens = [] } = params;

  const pref = await addDoc(purchasesCol(userId), {
    source: "receipt",
    name,
    market: market || "",
    createdAt: date,
    date,
  });

  for (const it of itens) {
    await addDoc(purchaseItemsCol(userId, pref.id), sanitizePurchaseItem(it));
  }

  const total = itens.reduce((s, it) => {
    const t = typeof it.total === "number" ? it.total : (Number(it.preco) || 0) * (Number(it.quantidade) || 1);
    return s + t;
  }, 0);

  return {
    id: pref.id,
    name,
    market,
    createdAt: date,
    itens,
    itemCount: itens.length,
    total,
    source: "receipt",
  };
}

// Acrescenta N itens em uma compra
export async function appendItemsToPurchaseArray(userId: string, purchaseId: string, items: PurchaseItem[]) {
  for (const it of items) {
    await addDoc(purchaseItemsCol(userId, purchaseId), sanitizePurchaseItem(it));
  }
}

// Payload agrupado
export async function appendItemsToPurchase(params: {
  userId: string;
  purchaseId: string;
  items: PurchaseItem[];
}) {
  const { userId, purchaseId, items } = params;
  await appendItemsToPurchaseArray(userId, purchaseId, items);
}

// Atualiza metadados
export async function updatePurchaseMeta(
  userId: string,
  purchaseId: string,
  meta: Partial<Pick<Purchase, "name" | "market" | "createdAt">>
) {
  await updateDoc(purchaseDoc(userId, purchaseId), {
    ...(meta.name !== undefined ? { name: meta.name } : {}),
    ...(meta.market !== undefined ? { market: meta.market } : {}),
    ...(meta.createdAt !== undefined ? { createdAt: meta.createdAt, date: meta.createdAt } : {}),
  });
}

// Atualiza um item por ÍNDICE
export async function updatePurchaseItem(
  userId: string,
  purchaseId: string,
  index: number,
  item: PurchaseItem
) {
  let itemsSnap;
  try {
    itemsSnap = await getDocs(query(purchaseItemsCol(userId, purchaseId), orderBy("createdAt", "asc")));
  } catch {
    itemsSnap = await getDocs(purchaseItemsCol(userId, purchaseId));
  }
  const docs = itemsSnap.docs;
  if (index < 0 || index >= docs.length) return;
  await updateDoc(docs[index].ref, sanitizePurchaseItem(item));
}

// Exclui item por ÍNDICE
export async function deletePurchaseItem(userId: string, purchaseId: string, index: number) {
  let itemsSnap;
  try {
    itemsSnap = await getDocs(query(purchaseItemsCol(userId, purchaseId), orderBy("createdAt", "asc")));
  } catch {
    itemsSnap = await getDocs(purchaseItemsCol(userId, purchaseId));
  }
  const docs = itemsSnap.docs;
  if (index < 0 || index >= docs.length) return;
  await deleteDoc(docs[index].ref);
}

// Exclui compra inteira
export async function deletePurchase(userId: string, purchaseId: string) {
  const its = await getDocs(purchaseItemsCol(userId, purchaseId));
  await Promise.all(its.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(purchaseDoc(userId, purchaseId));
}
