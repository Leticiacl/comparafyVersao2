// src/utils/category.ts
import { CATEGORY_PHRASES } from "./category.dataset";

// Normalizador (igual ao que você usa)
const N = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    // @ts-ignore
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ç/g, "c")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// unidades/medidas/comuns para ignorar
const NOISE = /\b(\d+([.,]\d+)?)\s*(kg|g|l|ml|un|pct|pc|cx|und|gramas?)\b|\bkg\b|\bl\b|\bml\b|\bun\b/gi;

// Compilação das listas: frases exatas (com espaço) e tokens
const EXACT = new Map<string, string>();      // "pao de forma" -> Padaria
const TOKEN_MAP = new Map<string, Array<{ cat: string; w: number }>>(); // "trident" -> [{cat:"Doces · Balas e Chicletes",w:2},...]

(function build() {
  for (const [cat, phrases] of Object.entries(CATEGORY_PHRASES)) {
    for (const raw of phrases) {
      const p = N(raw);
      if (!p) continue;

      if (p.includes(" ")) {
        // prioriza frases completas
        EXACT.set(p, cat);
      } else {
        const arr = TOKEN_MAP.get(p) || [];
        arr.push({ cat, w: 1 });
        TOKEN_MAP.set(p, arr);
      }
    }
  }

  // alguns tokens fortes recebem peso maior
  for (const key of ["trident", "halls", "mentos", "fini", "yakult", "heineken", "nescau", "toddy", "gatorade", "red bull"]) {
    if (TOKEN_MAP.has(key)) TOKEN_MAP.set(key, (TOKEN_MAP.get(key) || []).map(x => ({ ...x, w: 2 })));
  }
})();

// Faz checagem de frases + escore por tokens; retorna melhor categoria
export function categorize(name: string): string {
  if (!name) return "Outros";

  let s = N(name).replace(NOISE, " ").replace(/\s+/g, " ").trim();
  if (!s) return "Outros";

  // 1) frases exatas
  for (const [phrase, cat] of EXACT) {
    if (s.includes(phrase)) return cat;
  }

  // 2) tokens com pontuação
  const scores = new Map<string, number>();
  const tokens = s.split(" ").filter(Boolean);

  for (const t of tokens) {
    const hits = TOKEN_MAP.get(t);
    if (!hits) continue;
    for (const { cat, w } of hits) {
      scores.set(cat, (scores.get(cat) || 0) + w);
    }
  }

  if (!scores.size) return "Outros";

  // escolhe maior pontuação; empates resolvidos por ordem alfabética da categoria
  let best = "Outros";
  let bestScore = -1;
  for (const [cat, sc] of scores) {
    if (sc > bestScore || (sc === bestScore && cat < best)) {
      best = cat;
      bestScore = sc;
    }
  }
  return best;
}
