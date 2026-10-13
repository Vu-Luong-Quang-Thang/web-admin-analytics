import { createHash, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { OAuth2Client } from 'google-auth-library';

export type IdentityPrincipal = {
  userId: string;
  email?: string;
  name?: string;
  pictureUrl?: string;
  localDevelopment?: boolean;
};
const identityNamespace = 'c22d8235-9d37-5d5f-bc4f-1f3bbd0b59a8';

export function googlePrincipalUserId(issuer: string, subject: string): string {
  const namespace = Buffer.from(identityNamespace.replaceAll('-', ''), 'hex');
  const canonical = `google|${issuer.trim()}|${subject.trim()}`;
  const bytes = Buffer.from(createHash('sha1').update(namespace).update(canonical).digest().subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function localPrincipal(token: string): IdentityPrincipal | null {
  if (process.env.NODE_ENV === 'production') return null;
  const expected = process.env.ADMIN_API_TOKEN;
  const userId = process.env.ADMIN_USER_ID;
  if (!expected || expected.length < 24 || !userId) return null;
  const left = Buffer.from(token);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right)
    ? { userId, name: 'Local Developer', localDevelopment: true }
    : null;
}

export async function authenticate(request: IncomingMessage): Promise<IdentityPrincipal | null> {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  const local = localPrincipal(token);
  if (local) return local;

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) return null;
  try {
    const ticket = await new OAuth2Client().verifyIdToken({ idToken: token, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.iss || !payload.sub || payload.email_verified !== true) return null;
    const userId = googlePrincipalUserId(payload.iss, payload.sub);
    return {
      userId,
      ...(payload.email ? { email: payload.email } : {}),
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.picture ? { pictureUrl: payload.picture } : {}),
    };
  } catch {
    return null;
  }
}
