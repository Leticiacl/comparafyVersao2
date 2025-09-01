## Integração no app (Vite/React)

```ts
// scripts/build-catalog.ts
import fs from 'fs';
import path from 'path';

const src = path.resolve('src/assets/catalog/catalog_patterns.jsonl');
const out = path.resolve('src/assets/catalog/dict.generated.ts');

const lines = fs.readFileSync(src, 'utf8').split(/\r?\n/).filter(Boolean);
const entries = lines.map(l => JSON.parse(l) as {p:string;c:string});

const items = entries.map(e => `["${e.p.replace(/"/g,'\"')}", "${e.c.replace(/"/g,'\"')}"]`).join(',\n  ');

fs.writeFileSync(out, `// gerado – não editar\nexport const CAT_DICT_ENTRIES = [\n  ${items}\n] as const;\n`);
console.log('dict.generated.ts criado.');
```

3) Importe e conecte no seu util de categoria:

```ts
// src/utils/matchCategory.ts
import { CAT_DICT_ENTRIES } from "@/assets/catalog/dict.generated";
import { setDictionary } from "@/assets/catalog/categorizeFromDataset";

const dict = new Map<string,string>(CAT_DICT_ENTRIES as readonly any[]);
setDictionary(dict);

// exporte categorize() do arquivo categorizeFromDataset.ts
export { categorize } from "@/assets/catalog/categorizeFromDataset";
```

4) Adicione um passo de build no `package.json`:

```json
{
  "scripts": {
    "predev": "ts-node scripts/build-catalog.ts",
    "prebuild": "ts-node scripts/build-catalog.ts"
  }
}
```
