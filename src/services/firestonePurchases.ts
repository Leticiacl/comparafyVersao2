// src/services/firestorePurchases.ts
import { collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'

// Tipos mínimos usados pelas páginas/Context
export type PurchaseDoc = {
  id: string
  source: 'list' | 'receipt'
  sourceRefId?: string
  sourceRefName?: string
  createdAt: any
  market?: string
}

export type PurchaseItem = {
  id: string
  nome: string
  quantidade: number
  unidade: string
  peso?: number
  preco: number // unitário
  mercado?: string
  fromListItemId?: string
}

// Lista todas as compras + seus itens
export async function fetchUserPurchases(userId: string) {
  const purchasesRef = collection(db, 'users', userId, 'purchases')
  const snaps = await getDocs(purchasesRef)

  const result: Array<PurchaseDoc & { itens: PurchaseItem[] }> = []
  for (const snap of snaps.docs) {
    const docData = snap.data()
    const itemsRef = collection(db, 'users', userId, 'purchases', snap.id, 'items')
    const itemsSnap = await getDocs(itemsRef)
    const itens = itemsSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<PurchaseItem, 'id'>),
    }))
    result.push({
      id: snap.id,
      source: docData.source,
      sourceRefId: docData.sourceRefId,
      sourceRefName: docData.sourceRefName,
      createdAt: docData.createdAt,
      market: docData.market,
      itens,
    })
  }
  return result
}

// Cria compra a partir de uma LISTA
export async function createPurchaseFromList(userId: string, list: {
  id: string
  nome: string
  itens: Array<{
    id: string
    nome: string
    quantidade: number
    unidade: string
    peso?: number
    preco: number
    mercado?: string
  }>
}) {
  const purchaseRef = await addDoc(collection(db, 'users', userId, 'purchases'), {
    source: 'list',
    sourceRefId: list.id,
    sourceRefName: list.nome,
    createdAt: new Date(),
  })

  const itemsRef = collection(db, 'users', userId, 'purchases', purchaseRef.id, 'items')
  for (const it of list.itens) {
    await addDoc(itemsRef, {
      nome: it.nome,
      quantidade: it.quantidade ?? 1,
      unidade: it.unidade,
      peso: it.peso ?? null,
      preco: it.preco ?? 0,
      mercado: it.mercado ?? '',
      fromListItemId: it.id,
    })
  }
  return purchaseRef.id
}

// Cria compra a partir de CUPOM (scanner/parse externo alimenta esse payload)
export async function createPurchaseFromReceipt(userId: string, payload: {
  market?: string
  itens: Array<{
    nome: string
    quantidade: number
    unidade: string
    peso?: number
    preco: number
    mercado?: string
  }>
}) {
  const purchaseRef = await addDoc(collection(db, 'users', userId, 'purchases'), {
    source: 'receipt',
    createdAt: new Date(),
    market: payload.market ?? '',
  })
  const itemsRef = collection(db, 'users', userId, 'purchases', purchaseRef.id, 'items')
  for (const it of payload.itens) {
    await addDoc(itemsRef, {
      nome: it.nome,
      quantidade: it.quantidade ?? 1,
      unidade: it.unidade,
      peso: it.peso ?? null,
      preco: it.preco ?? 0,
      mercado: it.mercado ?? payload.market ?? '',
    })
  }
  return purchaseRef.id
}

export async function updatePurchaseItem(
  userId: string,
  purchaseId: string,
  itemId: string,
  data: Partial<Omit<PurchaseItem, 'id'>>
) {
  const ref = doc(db, 'users', userId, 'purchases', purchaseId, 'items', itemId)
  await updateDoc(ref, data as any)
}

export async function deletePurchase(userId: string, purchaseId: string) {
  const itemsRef = collection(db, 'users', userId, 'purchases', purchaseId, 'items')
  const itemsSnap = await getDocs(itemsRef)
  await Promise.all(itemsSnap.docs.map((d) => deleteDoc(d.ref)))
  const ref = doc(db, 'users', userId, 'purchases', purchaseId)
  await deleteDoc(ref)
}
