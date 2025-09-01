// src/services/catalogBackfill.ts
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { matchCategory } from "@/utils/matchCategory";

const db = getFirestore();

export async function backfillPurchaseItemCategories(opts?: { batchSize?: number }) {
  const batchSize = opts?.batchSize ?? 50;
  const col = collection(db, "purchases");
  const snap = await getDocs(col);

  let updatedDocs = 0;
  let updatedItems = 0;

  for (const d of snap.docs) {
    const data = d.data() as any;
    const itens = Array.isArray(data?.itens) ? data.itens : [];
    let changed = false;

    const newItems = itens.map((it: any) => {
      const prev = it?.categoria || it?.category;
      const next = matchCategory(it?.nome || "");
      if (next && next !== prev) {
        changed = true;
        updatedItems += 1;
        return { ...it, categoria: next };
      }
      return it;
    });

    if (changed) {
      await updateDoc(doc(db, "purchases", d.id), { itens: newItems });
      updatedDocs += 1;
    }
  }

  return { updatedDocs, updatedItems };
}
