import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { app } from "@/services/firebase";

/**
 * Dado um caminho "products/ean/7891234567890.webp",
 * retorna a URL pública do Firebase Storage.
 */
export async function getPublicUrlFromStoragePath(path: string): Promise<string> {
  const storage = getStorage(app);
  const r = ref(storage, path);
  return await getDownloadURL(r);
}
