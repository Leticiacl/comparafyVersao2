// src/services/catalog.ts
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";
import seed from "@/catalog.seed.json";

const db = getFirestore();
const CATALOG = "catalog";

// cria documentos no Firestore do tipo:
// { name, category, synonyms }
export async function seedCatalogIfEmpty() {
  const snap = await getDocs(collection(db, CATALOG));
  if (!snap.empty) return 0;

  const batch = (seed as any[]).slice(0); // clone
  let created = 0;
  for (const row of batch) {
    const id = row.name.toLowerCase().replace(/\s+/g, "_");
    await setDoc(doc(db, CATALOG, id), row);
    created++;
  }
  return created;
}

export type CatalogRow = { name: string; category: string; synonyms?: string[] };

export async function fetchCatalog(): Promise<CatalogRow[]> {
  const snap = await getDocs(collection(db, CATALOG));
  const rows: CatalogRow[] = [];
  snap.forEach((d) => rows.push(d.data() as CatalogRow));
  return rows;
}


export function suggestForName(name: string, cat: CatalogRow[]) {
  const n = name.toLowerCase();
  // match exato de sinônimo/name
  return (
    cat.find((r) => r.name === n || (r.synonyms || []).some((s) => s === n)) ||
    null
  );
}

import { getDocs, query, where, updateDoc } from "firebase/firestore";

function norm(s: string) {
  return (s || "")
    .normalize("NFD")
    // @ts-ignore
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ç/gi, "c")
    .toLowerCase()
    .trim();
}

/** Aprende que "nomeLivre" pertence à categoria X.
 *  - Se existir um item com mesma categoria, acrescenta "nomeLivre" nos sinônimos.
 *  - Senão cria um novo registro no catálogo com esse nome.
 */
export async function learnMapping(nomeLivre: string, category: string) {
  const db = getFirestore();
  const catCol = collection(db, CATALOG);
  const n = norm(nomeLivre);

  // tenta achar uma entry com MESMA categoria para anexar como sinônimo
  const snap = await getDocs(catCol);
  let targetId: string | null = null;
  let target: any | null = null;

  snap.forEach((d) => {
    const row = d.data() as any;
    if (row?.category === category && !targetId) {
      targetId = d.id;
      target = row;
    }
  });

  if (targetId && target) {
    const synonyms = Array.from(new Set([...(target.synonyms || []), n]));
    await updateDoc(doc(db, CATALOG, targetId), { synonyms });
    return { updated: targetId, created: null };
  }

  // fallback: cria novo registro
  const id = n.replace(/\s+/g, "_");
  await setDoc(doc(db, CATALOG, id), { name: n, category, synonyms: [] });
  return { updated: null, created: id };
}
