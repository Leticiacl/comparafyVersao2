export type Currency = "BRL" | "USD";

export interface UserProfile {
  uid: string;
  displayName?: string;
  email?: string;
  createdAt?: number;
}

export interface Store {
  id: string;
  name: string;
  city?: string;
  state?: string;
  lastSeenAt?: number;
}

export interface Product {
  id: string;          // slug/uuid
  ean?: string;        // EAN-13
  name: string;
  brand?: string;
  size?: string;
  imageUrl?: string;
  createdAt?: number;
}

export interface PricePoint {
  productId: string;
  storeId: string;
  price: number;
  currency: Currency;
  collectedAt: number; // epoch ms
  source: "manual" | "scan" | "cupom";
  userId?: string;
}

export interface ShoppingList {
  id: string;
  userId: string;
  name: string;
  budget?: number;
  createdAt: number;
}

export interface ListItem {
  listId: string;
  productId: string;
  qty: number;
  notes?: string;
  targetStoreId?: string;
  lockedPrice?: number;
  addedAt: number;
}

export interface Purchase {
  id: string;
  userId: string;
  storeId: string;
  total: number;
  currency: Currency;
  purchasedAt: number;
}

// src/types/index.ts
export type PurchaseItem = {
  id?: string;
  nome: string;
  quantidade: number;
  unidade?: string;
  peso?: number;
  preco: number;
  total?: number;

  // P2 — enriquecimento (opcionais)
  normalizedName?: string;
  category?: string | null;
  brand?: string | null;
};

export interface ReceiptItem {
  productId?: string;
  ean?: string;
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface ReceiptParseResult {
  store?: Store;
  items: ReceiptItem[];
  subtotal?: number;
  taxes?: number;
  total?: number;
  purchasedAt?: number;
}
