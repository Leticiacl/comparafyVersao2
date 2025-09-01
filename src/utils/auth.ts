// src/utils/auth.ts
function safeGetSS(key: string): string | null {
  try {
    const v = sessionStorage.getItem(key);
    if (!v) return null;
    const s = String(v).trim().toLowerCase();
    if (!s || s === "null" || s === "undefined" || s === '""') return null;
    return v;
  } catch {
    return null;
  }
}

function safeGetLS(key: string): string | null {
  try {
    const v = localStorage.getItem(key);
    if (!v) return null;
    const s = String(v).trim().toLowerCase();
    if (!s || s === "null" || s === "undefined" || s === '""') return null;
    return v;
  } catch {
    return null;
  }
}

export function getFirebaseAuthUid(): string | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || "";
      if (key.startsWith("firebase:authUser:")) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const obj = JSON.parse(raw);
          const uid = obj?.uid;
          if (uid && String(uid).trim()) return String(uid);
        } catch {}
      }
    }
  } catch {}
  return null;
}

export function getStoredUserId(): string | null {
  const direct = safeGetSS("userId") ?? safeGetLS("userId");
  if (direct) return direct;

  const rawSS = safeGetSS("user");
  const rawLS = safeGetLS("user");
  const raw = rawSS ?? rawLS;
  if (!raw) return null;

  try {
    const obj = JSON.parse(raw);
    const maybe =
      obj?.uid || obj?.id || obj?.userId || obj?.user?.uid || obj?.user?.id;
    const s = String(maybe || "").trim();
    return s ? s : null;
  } catch {
    const s = String(raw).trim();
    return s ? s : null;
  }
}

export function getEffectiveUid(): string | null {
  const authUid = getFirebaseAuthUid();
  if (!authUid) return null;
  return getStoredUserId() ?? authUid;
}

export function clearStoredUser() {
  try {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("user");
  } catch {}
  try {
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || "";
      if (k.startsWith("firebase:authUser:")) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
}
