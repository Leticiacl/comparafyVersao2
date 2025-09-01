// Carregador e categorizador com: dicionário, 1ª palavra, keywords e no-space.
// Ordem: exato → 2 palavras → 1ª palavra → keywords/colados → no-space.

export type KeywordRule = { key: string; category: string };

export const normalize = (s: string) =>
  (s || "")
    .normalize("NFD")
    // @ts-ignore unicode
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ç/gi, "c")
    .toLowerCase()
    .replace(/([a-z])([A-Z0-9])/g, "$1 $2")
    .replace(/([0-9])([a-z])/g, "$1 $2")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/* ---------- estado interno ---------- */
let DICT: Map<string, string> | null = null;
let FIRST_WORD: Map<string, string> | null = null;
let KEYWORD_RE: Array<[RegExp, string]> = [];
let NO_SPACE: Map<string, string> | null = null;

/* ---------- observadores (opcional) ---------- */
let VERSION = 0;
const LISTENERS = new Set<() => void>();
function notify() { VERSION++; LISTENERS.forEach(fn => { try { fn(); } catch {} }); }
export function onCategorizerReady(cb: () => void) { LISTENERS.add(cb); return () => LISTENERS.delete(cb); }
export function getCategorizerVersion() { return VERSION; }

/* ---------- utils ---------- */
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ---------- setters ---------- */
export function setDictionary(dict: Map<string, string>) {
  DICT = new Map();
  NO_SPACE = new Map();

  for (const [rawK, rawV] of dict.entries()) {
    const k = normalize(rawK);
    const v = String(rawV || "outros").toLowerCase();
    if (!k) continue;
    DICT.set(k, v);
    const ns = k.replace(/ /g, "");
    if (ns) NO_SPACE.set(ns, v);
  }
  notify();
}

export function setFirstWordIndex(idx: Map<string, string>) {
  FIRST_WORD = new Map();
  for (const [rawK, rawV] of idx.entries()) {
    const first = normalize(rawK).split(" ")[0];
    if (!first) continue;
    if (!FIRST_WORD.has(first)) FIRST_WORD.set(first, String(rawV || "outros").toLowerCase());
  }
  notify();
}

export function setKeywordPatterns(rules: KeywordRule[]) {
  KEYWORD_RE = [];
  for (const r of rules || []) {
    const k = normalize(r.key);
    if (!k) continue;
    const cat = String(r.category || "outros").toLowerCase();
    KEYWORD_RE.push([new RegExp(`\\b${esc(k)}\\b`, "i"), cat]);
    const ns = k.replace(/ /g, "");
    if (ns && ns !== k) KEYWORD_RE.push([new RegExp(esc(ns), "i"), cat]);
  }
  notify();
}

/* ---------- categorizar ---------- */
export function categorize(name: string): string {
  const key = normalize(name);
  if (!key) return "outros";

  // 1) exato
  if (DICT && DICT.has(key)) return DICT.get(key)!;

  // 2) duas palavras (prefixo)
  const parts = key.split(" ");
  if (parts.length >= 2) {
    const firstTwo = `${parts[0]} ${parts[1]}`;
    if (DICT && DICT.has(firstTwo)) return DICT.get(firstTwo)!;

    if (DICT) {
      for (const [k, v] of DICT.entries()) {
        if (k.startsWith(firstTwo)) return v;
      }
    }
  }

  // 3) 1ª palavra
  const first = parts[0];
  if (FIRST_WORD && FIRST_WORD.has(first)) return FIRST_WORD.get(first)!;

  // 4) keywords/abreviações/colados
  for (const [re, cat] of KEYWORD_RE) {
    if (re.test(key) || re.test(key.replace(/ /g, ""))) return cat;
  }

  // 5) índice no-space
  if (NO_SPACE) {
    const nsKey = key.replace(/ /g, "");
    if (NO_SPACE.has(nsKey)) return NO_SPACE.get(nsKey)!;
    for (const [ns, cat] of NO_SPACE.entries()) {
      if (nsKey.startsWith(ns)) return cat;
    }
  }

  return "outros";
}
