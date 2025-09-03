// src/server/normalize.ts
export function toSlug(s: string) {
    return s
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120);
  }
  
  // heurística simples para nome -> slug consistente (pode evoluir depois)
  export function productSlugFromRaw(raw: string) {
    let s = raw
      .replace(/\b(qtde|quantidade|qtd|itens?:?).*$/i, '')
      .replace(/\bvalor\s*total.*$/i, '')
      .replace(/\(c[oó]digo:\s*\d+\)/i, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  
    // remove sufixos comuns
    s = s.replace(/\b(un|u|und|unid|kg|g|l|ml|dz|bd)\b.*$/i, '').trim();
    return toSlug(s);
  }
  