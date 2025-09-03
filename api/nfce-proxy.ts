// /api/nfce-proxy.ts
export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get('url');
    if (!target) {
      return new Response(JSON.stringify({ error: 'missing url' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const r = await fetch(target, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!r.ok) {
      return new Response(JSON.stringify({ error: `upstream ${r.status}` }), {
        status: 502, headers: { 'Content-Type': 'application/json' },
      });
    }

    const html = await r.text();
    return new Response(JSON.stringify({ html }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'proxy_failed' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
