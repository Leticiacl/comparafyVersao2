// src/services/imageMemory.ts
// Cache de imagens e utilitários de normalização

const KEY_NAME_TO_URL = "imgCache.nameToUrl.v1";
const KEY_PURCHASE_IMG = "imgCache.purchaseItem.v1"; // opcional, p/ por-item

export function normKey(s: string) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/* ---------- nome -> url ---------- */
type NameMap = Record<string, string>;

function readNameMap(): NameMap {
  try {
    const raw = localStorage.getItem(KEY_NAME_TO_URL);
    return raw ? (JSON.parse(raw) as NameMap) : {};
  } catch {
    return {};
  }
}
function writeNameMap(map: NameMap) {
  try { localStorage.setItem(KEY_NAME_TO_URL, JSON.stringify(map)); } catch {}
}

export function getUrlForName(name: string): string | null {
  const map = readNameMap();
  return map[normKey(name)] || null;
}
export function setUrlForName(name: string, url: string) {
  const map = readNameMap();
  map[normKey(name)] = url;
  writeNameMap(map);
}

/* ---------- (opcional) compra+índice -> url ---------- */
type PurchaseImgMap = Record<string, string>; // key: `${purchaseId}#${index}`

function readPurchaseMap(): PurchaseImgMap {
  try {
    const raw = localStorage.getItem(KEY_PURCHASE_IMG);
    return raw ? (JSON.parse(raw) as PurchaseImgMap) : {};
  } catch {
    return {};
  }
}
function writePurchaseMap(map: PurchaseImgMap) {
  try { localStorage.setItem(KEY_PURCHASE_IMG, JSON.stringify(map)); } catch {}
}

export function savePurchaseImage(purchaseId: string, index: number, url: string) {
  const map = readPurchaseMap();
  map[`${purchaseId}#${index}`] = url;
  writePurchaseMap(map);
}
export function getPurchaseImage(purchaseId: string, index: number): string | null {
  const map = readPurchaseMap();
  return map[`${purchaseId}#${index}`] || null;
}
