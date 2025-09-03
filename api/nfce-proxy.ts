// /api/nfce-proxy.ts
// Proxy simples para contornar CORS ao buscar páginas públicas da NFC-e.
// Uso:  GET /api/nfce-proxy?url=<URL da NFC-e>
// Obs.: configure no frontend: VITE_NFCE_PROXY=/api/nfce-proxy e VITE_FORCE_PROXY=1

export const config = { runtime: "edge" }; // Vercel Edge

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
} as const;

// --- util: resposta JSON com CORS
function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

// --- util: valida URL segura (apenas http/https)
function toSafeUrl(raw: string | null): URL | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u;
  } catch {
    return null;
  }
}

// --- handler
export default async function handler(req: Request) {
  // Pré-flight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const { searchParams } = new URL(req.url);
  const targetUrl = toSafeUrl(searchParams.get("url"));
  if (!targetUrl) {
    return json(400, { error: "missing_or_invalid_url" });
  }

  // Timeout para evitar pendurar função edge
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s

  try {
    const r = await fetch(targetUrl.toString(), {
      method: "GET",
      redirect: "follow",
      // Nunca envia credenciais/cookies
      credentials: "omit",
      signal: controller.signal,
      headers: {
        // Alguns portais exigem UA "de navegador"
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!r.ok) {
      return json(502, { error: "upstream_error", status: r.status });
    }

    const html = await r.text();

    // Devolve HTML dentro de JSON (evita problemas de MIME/CORS no front)
    return json(200, { html, source: targetUrl.hostname });
  } catch (e: any) {
    // AbortError vira "timeout"
    const error =
      e?.name === "AbortError" ? "timeout" : e?.message || "proxy_failed";
    return json(500, { error });
  } finally {
    clearTimeout(timeout);
  }
}
