// src/utils/matchCategory.ts
import raw from "@/data/category.synonyms.json";
import { CAT_DICT_ENTRIES } from "@/assets/catalog/dict.generated";
import { setDictionary } from "@/assets/catalog/categorizeFromDataset";
const dict = new Map<string, string>(CAT_DICT_ENTRIES as readonly any[]);
setDictionary(dict);
export { categorize } from "@/assets/catalog/categorizeFromDataset";

type Dict = Record<string, string[]>;
const DICT: Dict = raw as Dict;

const N = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    // @ts-ignore
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (s: string) => N(s).split(" ").filter(Boolean);

const hasUnitBeverageHints = (s: string) => /\b(\d+(?:[,\.]\d+)?\s?(ml|l))\b|\b(2l|1l|350ml|600ml)\b/.test(N(s));
const hasCleaningHints = (s: string) => /\b(1l|2l|5l|cloro|cif|veja|sapolio|sapólio|desengordurante)\b/.test(N(s));

/** pontua candidato por sinônimos */
function score(name: string, syns: string[]): number {
  const nameTokens = tokenize(name);
  if (nameTokens.length === 0) return 0;

  let s = 0;

  for (const raw of syns) {
    const t = N(raw);
    if (!t) continue;

    // match exato (token)
    if (nameTokens.includes(t)) s += 5;

    // prefixo em qualquer token
    if (nameTokens.some((nt) => nt.startsWith(t) && t.length >= 3)) s += 2;

    // substring geral
    if (N(name).includes(t) && t.length >= 4) s += 1;
  }

  // boosts heurísticos por contexto
  if (hasUnitBeverageHints(name)) s += 2;
  if (hasCleaningHints(name)) s += 1;

  return s;
}

export function matchCategory(name: string): string {
  let best = "Outros";
  let bestScore = 0;

  for (const [cat, syns] of Object.entries(DICT)) {
    const sc = score(name, syns);
    if (sc > bestScore) {
      bestScore = sc;
      best = cat;
    }
  }

  // limiar mínimo pra evitar “chutes”
  return bestScore >= 3 ? best : "Outros";
}
