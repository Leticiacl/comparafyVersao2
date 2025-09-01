// src/utils/match.ts
import { normalizeString } from "@/utils/normalizeString";

export type MatchSuggestion<T = any> = {
  score: number;   // 0..1
  target: T;       // item do catálogo
};

// Jaro-Winkler simples (bom para nomes curtos/médios)
function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  const m = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  let matches = 0, transpositions = 0;
  const aFlags = new Array(a.length).fill(false);
  const bFlags = new Array(b.length).fill(false);

  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - m);
    const end = Math.min(i + m + 1, b.length);
    for (let j = start; j < end; j++) {
      if (!bFlags[j] && a[i] === b[j]) {
        aFlags[i] = bFlags[j] = true;
        matches++; break;
      }
    }
  }
  if (!matches) return 0;

  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aFlags[i]) continue;
    while (!bFlags[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }
  const mF = matches;
  const jaro = (mF / a.length + mF / b.length + (mF - transpositions / 2) / mF) / 3;

  // prefixo comum até 4 chars
  let prefix = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length) && a[i] === b[i]; i++) prefix++;
  return jaro + prefix * 0.1 * (1 - jaro);
}

export function similar(a: string, b: string): number {
  const na = normalizeString(a);
  const nb = normalizeString(b);
  if (!na || !nb) return 0;
  return jaroWinkler(na, nb);
}

/** Retorna top-N sugestões acima de um limiar. */
export function topSuggestions<T extends { nome: string; sinonimos?: string[] }>(
  query: string,
  universe: T[],
  limit = 5,
  threshold = 0.84
): MatchSuggestion<T>[] {
  const res: MatchSuggestion<T>[] = [];
  for (const t of universe) {
    const base = t.nome || "";
    let s = similar(query, base);
    if (t.sinonimos?.length) {
      s = Math.max(s, ...t.sinonimos.map((sug) => similar(query, sug)));
    }
    if (s >= threshold) res.push({ score: s, target: t });
  }
  res.sort((a, b) => b.score - a.score);
  return res.slice(0, limit);
}
