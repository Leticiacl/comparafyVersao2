import * as jwt from 'jsonwebtoken';

const AUD = process.env.JWT_AUDIENCE!;
const ISS = process.env.JWT_ISSUER!;

/** Lê Authorization: Bearer <idTokenFirebase> e retorna { uid, email? } */
export function getUserFromAuthHeader(auth?: string) {
  if (!auth?.startsWith('Bearer ')) throw new Error('Missing token');
  const token = auth.slice(7);
  const decoded = jwt.decode(token, { complete: true }) as any;
  const payload = decoded?.payload;
  if (!payload) throw new Error('Invalid token');
  if (payload.aud !== AUD || payload.iss !== ISS) throw new Error('Invalid token');
  return { uid: payload.user_id as string, email: payload.email as string | undefined };
}
