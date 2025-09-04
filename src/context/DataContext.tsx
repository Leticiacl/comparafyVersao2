// src/context/DataContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/services/firebase";
import { signInAnonymously } from "firebase/auth";
import {
  // listas
  fetchUserLists,
  createNewList,
  fetchItemsFromList,
  addItemToList as addItemToListService,
  toggleItemPurchased,
  deleteItem as deleteItemFromFirestore,
  updateItem as updateItemInFirestore,
  updateListName,
  deleteListFromFirestore,
  duplicateList,
  markAllItemsPurchased,
  saveSuggestion,
  getSuggestionsForField,
  type NewItem,
  // compras
  fetchPurchasesForUser,
  createPurchaseFromList,
  createPurchaseFromReceipt,
  appendItemsToPurchase,
  appendItemsToPurchaseArray,
  updatePurchaseMeta,
  deletePurchase,
  updatePurchaseItem,
  deletePurchaseItem,
  type Purchase,
  type PurchaseItem,
} from "../services/firestoreService";

/* ================== Tipos locais ================== */
export interface Item {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  preco: number;
  mercado?: string;
  observacoes?: string;
  comprado: boolean;
  peso?: number;
}

export interface Lista {
  id: string;
  nome: string;
  market?: string;
  itens: Item[];
  createdAt?: any;
}

interface DataContextType {
  // listas
  lists: Lista[];
  fetchUserData(): Promise<void>;
  createList(nome: string): Promise<Lista | null>;
  fetchItems(listId: string): Promise<void>;
  addItem(listId: string, item: NewItem): Promise<string>;
  addItemToList?(listId: string, item: NewItem): Promise<string>;
  updateItem(listId: string, itemId: string, data: Omit<Item, "id" | "comprado">): Promise<void>;
  toggleItem(listId: string, itemId: string): Promise<void>;
  deleteItem(listId: string, itemId: string): Promise<void>;
  updateListNameInContext(listId: string, novoNome: string): void;
  deleteList(listId: string): Promise<void>;
  duplicateListInContext(listId: string): Promise<void>;
  markAllInList(listId: string): Promise<void>;
  saveSuggestions(field: string, value: string): Promise<void>;
  getSuggestions(field: string): Promise<string[]>;
  savings: number;

  // compras
  purchases: Purchase[];
  fetchPurchases(): Promise<void>;
  createPurchaseFromListInContext(params: {
    listId: string;
    name: string;
    market: string;
    date: Date;
    selectedItemIds?: string[];
    extras?: PurchaseItem[];
  }): Promise<Purchase>;
  createPurchaseFromReceiptInContext(params: {
    name: string;
    market: string;
    date: Date;
    itens?: PurchaseItem[];
  }): Promise<void>;
  renamePurchaseInContext(purchaseId: string, newName: string): Promise<void>;
  updatePurchaseMetaInContext(
    purchaseId: string,
    meta: Partial<Pick<Purchase, "name" | "market" | "createdAt">>
  ): Promise<void>;
  deletePurchaseInContext(purchaseId: string): Promise<void>;
  updatePurchaseItemInContext(
    purchaseId: string,
    index: number,
    item: Partial<PurchaseItem>
  ): Promise<void>;
  deletePurchaseItemInContext(purchaseId: string, index: number): Promise<void>;
  appendItemsToPurchaseById(purchaseId: string, items: PurchaseItem[]): Promise<void>;
  appendItemsToPurchaseInContext(items: PurchaseItem[]): Promise<string | null>;
}

/* ================== Helpers de UID/Auth ================== */
function getStoredUserId(): string | null {
  const direct = sessionStorage.getItem("userId");
  if (direct) return direct;
  const raw = sessionStorage.getItem("user");
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    return obj?.uid || obj?.id || obj?.userId || null;
  } catch {
    return raw || null;
  }
}

async function ensureAuth(): Promise<string> {
  if (auth.currentUser?.uid) return auth.currentUser.uid;
  await signInAnonymously(auth);
  return auth.currentUser!.uid;
}

function getUid(): string | null {
  return auth.currentUser?.uid || getStoredUserId();
}

/* ================== util ================== */
const lineTotal = (it: any) =>
  (typeof it.total === "number" && it.total) ||
  (Number(it.preco) || 0) * (Number(it.quantidade) || 1);

/* ================== Contexto ================== */
const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lists, setLists] = useState<Lista[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  /* ======== Listas ======== */
  const fetchUserData = async () => {
    const userId = getUid();
    if (!userId) return;
    const data = await fetchUserLists(userId);
    setLists(data);
  };

  const createList = async (nome: string) => {
    const userId = getUid();
    if (!userId) return null;
    const newList = await createNewList(userId, nome);
    setLists((prev) => [...prev, newList]);
    return newList;
  };

  const fetchItems = async (listId: string) => {
    const userId = getUid();
    if (!userId) return;
    const itens = await fetchItemsFromList(userId, listId);
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, itens } : l)));
  };

  const addItem = async (listId: string, item: NewItem) => {
    const uid = await ensureAuth();
    const newId = await addItemToListService(uid, listId, item);
    await fetchUserData();
    return newId;
  };

  const updateItem = async (listId: string, itemId: string, data: Omit<Item, "id" | "comprado">) => {
    const userId = getUid();
    if (!userId) return;
    await updateItemInFirestore(userId, listId, itemId, data);
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId ? { ...l, itens: (l.itens || []).map((i) => (i.id === itemId ? { ...i, ...data } : i)) } : l
      )
    );
  };

  const toggleItem = async (listId: string, itemId: string) => {
    const userId = getUid();
    if (!userId) return;
    const updated = await toggleItemPurchased(userId, listId, itemId);
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? { ...l, itens: (l.itens || []).map((i) => (i.id === itemId ? { ...i, comprado: updated.comprado } : i)) }
          : l
      )
    );
  };

  const deleteItem = async (listId: string, itemId: string) => {
    const userId = getUid();
    if (!userId) return;
    await deleteItemFromFirestore(userId, listId, itemId);
    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, itens: (l.itens || []).filter((i) => i.id !== itemId) } : l))
    );
  };

  const updateListNameInContext = (listId: string, novoNome: string) => {
    const userId = getUid();
    if (!userId) return;
    updateListName(userId, listId, novoNome);
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, nome: novoNome } : l)));
  };

  const deleteList = async (listId: string) => {
    const userId = getUid();
    if (!userId) return;
    await deleteListFromFirestore(userId, listId);
    setLists((prev) => prev.filter((l) => l.id !== listId));
  };

  const duplicateListInContext = async (listId: string) => {
    const userId = getUid();
    if (!userId) return;
    await duplicateList(userId, listId);
    await fetchUserData();
  };

  const markAllInList = async (listId: string) => {
    const userId = getUid();
    if (!userId) return;
    await markAllItemsPurchased(userId, listId);
    const itens = await fetchItemsFromList(userId, listId);
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, itens } : l)));
  };

  const saveSuggestions = async (field: string, value: string) => {
    const userId = getUid();
    if (!userId) return;
    await saveSuggestion(userId, field, value);
  };
  const getSuggestions = async (field: string) => {
    const userId = getUid();
    if (!userId) return [];
    return await getSuggestionsForField(userId, field);
  };

  const savings = lists.reduce((sum, l) => {
    const itens = l.itens || [];
    return sum + itens.reduce((acc, i) => (i.comprado ? acc + i.preco : acc), 0);
  }, 0);

  /* ======== Compras ======== */
  const fetchPurchases = async () => {
    const userId = getUid();
    if (!userId) return;
    const data = await fetchPurchasesForUser(userId);
    setPurchases(
      data.sort((a, b) => {
        const ta = new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt).getTime();
        const tb = new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt).getTime();
        return tb - ta;
      })
    );
  };

  const createPurchaseFromListInContext = async (params: {
    listId: string;
    name: string;
    market: string;
    date: Date;
    selectedItemIds?: string[];
    extras?: PurchaseItem[];
  }) => {
    const userId = getUid();
    if (!userId) throw new Error("missing-user");
    const p = await createPurchaseFromList({ userId, ...params });
    setPurchases((prev) => [p, ...prev]);
    return p;
  };

  const createPurchaseFromReceiptInContext = async (params: {
    name: string;
    market: string;
    date: Date;
    itens?: PurchaseItem[];
  }) => {
    const userId = getUid();
    if (!userId) throw new Error("missing-user");
    const p = await createPurchaseFromReceipt({ userId, ...params });
    setPurchases((prev) => [p, ...prev]);
  };

  const renamePurchaseInContext = async (purchaseId: string, newName: string) => {
    const userId = getUid();
    if (!userId) return;
    await updatePurchaseMeta(userId, purchaseId, { name: newName.trim() });
    setPurchases((prev) => prev.map((p) => (p.id === purchaseId ? { ...p, name: newName.trim() } : p)));
  };

  const updatePurchaseMetaInContext = async (
    purchaseId: string,
    meta: Partial<Pick<Purchase, "name" | "market" | "createdAt">>
  ) => {
    const userId = getUid();
    if (!userId) return;
    await updatePurchaseMeta(userId, purchaseId, meta);
    setPurchases((prev) =>
      prev.map((p) =>
        p.id === purchaseId
          ? {
              ...p,
              ...(meta.name !== undefined ? { name: meta.name } : {}),
              ...(meta.market !== undefined ? { market: meta.market } : {}),
              ...(meta.createdAt !== undefined ? { createdAt: meta.createdAt } : {}),
            }
          : p
      )
    );
  };

  const deletePurchaseInContext = async (purchaseId: string) => {
    const userId = getUid();
    if (!userId) return;
    await deletePurchase(userId, purchaseId);
    setPurchases((prev) => prev.filter((p) => p.id !== purchaseId));
  };

  // Merge de item sem sobrescrever campos existentes
  const updatePurchaseItemInContext = async (
    purchaseId: string,
    index: number,
    item: Partial<PurchaseItem>
  ) => {
    const userId = getUid();
    if (!userId) return;
    // ✅ envia PATCH parcial sem fazer cast para PurchaseItem
    await updatePurchaseItem(userId, purchaseId, index, item);
    setPurchases((prev) =>
      prev.map((p) => {
        if (p.id !== purchaseId) return p;
        const itens = p.itens.map((it, i) => (i === index ? { ...it, ...item } : it));
        const total = itens.reduce((s, it) => s + lineTotal(it), 0);
        return { ...p, itens, itemCount: itens.length, total };
      })
    );
  };

  const deletePurchaseItemInContext = async (purchaseId: string, index: number) => {
    const userId = getUid();
    if (!userId) return;
    await deletePurchaseItem(userId, purchaseId, index);
    setPurchases((prev) =>
      prev.map((p) => {
        if (p.id !== purchaseId) return p;
        const itens = p.itens.filter((_, i) => i !== index);
        const total = itens.reduce((s, it) => s + lineTotal(it), 0);
        return { ...p, itens, itemCount: itens.length, total };
      })
    );
  };

  const appendItemsToPurchaseById = async (purchaseId: string, items: PurchaseItem[]) => {
    const userId = getUid();
    if (!userId) return;
    await appendItemsToPurchaseArray(userId, purchaseId, items);
    setPurchases((prev) =>
      prev.map((p) =>
        p.id === purchaseId
          ? {
              ...p,
              itens: [...(p.itens || []), ...items],
              itemCount: (p.itemCount || 0) + items.length,
              total: (typeof p.total === "number" ? p.total : 0) + items.reduce((s, it) => s + lineTotal(it), 0),
            }
          : p
      )
    );
  };

  const appendItemsToPurchaseInContext = async (items: PurchaseItem[]): Promise<string | null> => {
    const userId = getUid();
    if (!userId) return null;
    if (!purchases.length) return null;

    const purchaseId = purchases[0].id;
    await appendItemsToPurchase({ userId, purchaseId, items });

    setPurchases((prev) =>
      prev.map((p) => (p.id === purchaseId ? { ...p, itens: [...(p.itens || []), ...items] } : p))
    );
    return purchaseId;
  };

  useEffect(() => {
    (async () => {
      await ensureAuth();
      await Promise.all([fetchUserData(), fetchPurchases()]);
    })();
  }, []); // eslint-disable-line

  return (
    <DataContext.Provider
      value={{
        // listas
        lists,
        fetchUserData,
        createList,
        fetchItems,
        addItem,
        addItemToList: (listId: string, item: NewItem) => addItem(listId, item),
        updateItem,
        toggleItem,
        deleteItem,
        updateListNameInContext,
        deleteList,
        duplicateListInContext,
        markAllInList,
        saveSuggestions,
        getSuggestions,
        savings,
        // compras
        purchases,
        fetchPurchases,
        createPurchaseFromListInContext,
        createPurchaseFromReceiptInContext,
        renamePurchaseInContext,
        updatePurchaseMetaInContext,
        deletePurchaseInContext,
        updatePurchaseItemInContext,
        deletePurchaseItemInContext,
        appendItemsToPurchaseById,
        appendItemsToPurchaseInContext,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
};
