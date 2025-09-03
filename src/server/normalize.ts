// src/server/normalize.ts
export function slugify(s: string): string {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

export function normalizeName(raw: string): { displayName: string; slug: string } {
  let name = String(raw || '').trim();

  // remove ruído típico de NFC-e
  name = name.replace(/\b(qtde|qtd|quant|qtde total de itens)[: ]*[\d.,]+/gi, '');
  name = name.replace(/\b\(c[oó]digo:\s*\d+\)/gi, '');
  name = name.replace(/\s{2,}/g, ' ').trim();

  // capitaliza leve
  name = name
    .toLowerCase()
    .replace(/\b([a-zà-ú]{2,})/g, (m) => m[0].toUpperCase() + m.slice(1));

  const slug = slugify(name);
  return { displayName: name, slug };
}
