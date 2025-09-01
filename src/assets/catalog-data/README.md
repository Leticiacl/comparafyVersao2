# Comparafy – Catálogo de categorias (22k itens)

Este pacote adiciona ~22 mil itens a uma base de normalização de categorias.
Arquivos:

- `catalog_categories.json` – lista única de categorias normalizadas
- `catalog_products_to_category.csv` – mapeamento (produto, grupo2 original, categoria_norm)
- `catalog_patterns.jsonl` – uma linha por produto: `{ "p": "<nome normalizado>", "c": "<categoria>" }`
- `categorizeFromDataset.ts` – utilidade para carregar `catalog_patterns.jsonl` e expor `categorize(name)`
- `integrate.md` – passo‑a‑passo para integrar no seu app

