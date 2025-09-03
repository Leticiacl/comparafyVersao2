// src/services/api.ts
export async function postReceipt(idToken: string, payload: any) {
  const r = await fetch('/api/receipts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // opcionalmente pode enviar o token num header para checar no backend
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (r.status === 409) {
    const j = await r.json().catch(() => ({}));
    const msg = 'Essa nota já foi importada.';
    const err: any = new Error(msg);
    err.code = 'already_exists';
    err.payload = j;
    throw err;
  }

  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    const err: any = new Error(j?.error || 'Erro ao salvar');
    err.payload = j;
    throw err;
  }

  return r.json();
}
