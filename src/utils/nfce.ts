// src/utils/nfce.ts
export const T = (el: Element | null | undefined) =>
  (el?.textContent || "").replace(/\s+/g, " ").trim();

export const numBR = (s: string) => {
  const n = Number(s.replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? +n.toFixed(2) : 0;
};

export const parseQtyMG = (s: string) => {
  const v = s.replace(/\s/g, "");
  if (v.includes(",")) return numBR(v);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const unitMap = (u?: string) => {
  const x = (u || "").toLowerCase();
  if (/^un|und|unid$/.test(x)) return "un";
  if (/^kg$/.test(x)) return "kg";
  if (/^g$/.test(x)) return "g";
  if (/^l$/.test(x)) return "l";
  if (/^ml$/.test(x)) return "ml";
  if (/^bd/.test(x)) return "bd";
  if (/^dz/.test(x)) return "dz";
  if (x === "fr") return "un";
  return x || undefined;
};

export const capFirst = (s: string) => {
  const t = (s || "").toLowerCase().trim();
  return t ? t[0].toUpperCase() + t.slice(1) : t;
};

export const stripCodigo = (s: string) =>
  s.replace(/\s*\(c[oó]digo:\s*\d+\)\s*/gi, "").trim();
