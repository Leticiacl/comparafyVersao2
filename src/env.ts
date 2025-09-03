// src/env.ts
type Bool = 0 | 1;

function req(name: string, v: any) {
  if (v === undefined || v === null || v === "") {
    throw new Error(`[Firebase ENV] Faltando ${name}. Verifique as env VITE_* no Vercel/.env.local.`);
  }
  return String(v);
}

// ⚠️ Em dev/local você pode colocar valores de fallback.
// Em produção (Vercel) eles DEVEM vir das Environment Variables.
export const ENV = {
  // ---- Firebase (cliente) ----
  FIREBASE_API_KEY: req("VITE_FIREBASE_API_KEY", import.meta.env.VITE_FIREBASE_API_KEY),
  FIREBASE_AUTH_DOMAIN: req("VITE_FIREBASE_AUTH_DOMAIN", import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  FIREBASE_PROJECT_ID: req("VITE_FIREBASE_PROJECT_ID", import.meta.env.VITE_FIREBASE_PROJECT_ID),
  FIREBASE_STORAGE_BUCKET: req("VITE_FIREBASE_STORAGE_BUCKET", import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  FIREBASE_MESSAGING_SENDER_ID: req("VITE_FIREBASE_MESSAGING_SENDER_ID", import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  FIREBASE_APP_ID: req("VITE_FIREBASE_APP_ID", import.meta.env.VITE_FIREBASE_APP_ID),

  // ---- Proxy da NFC-e (front chama /api/nfce-proxy) ----
  // Pode manter o default para o mesmo domínio do app:
  NFCE_PROXY: (import.meta as any).env?.VITE_NFCE_PROXY || "/api/nfce-proxy",

  // Se quiser forçar SEMPRE o proxy:
  FORCE_PROXY: (((import.meta as any).env?.VITE_FORCE_PROXY || "1") === "1") as unknown as Bool,
};
export type ENV = typeof ENV;
