import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { OAuth2Client } from 'google-auth-library';
import type { Pool } from 'pg';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export type IdentityPrincipal = {
  accountId?: string;
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

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 12) throw new Error('Password must contain at least 12 characters');
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt:${salt.toString('base64url')}:${derived.toString('base64url')}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, saltText, hashText] = encoded.split(':');
  if (algorithm !== 'scrypt' || !saltText || !hashText) return false;
  const expected = Buffer.from(hashText, 'base64url');
  const actual = await scrypt(password, Buffer.from(saltText, 'base64url'), expected.length) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function newSessionToken(): string { return randomBytes(32).toString('base64url'); }
export function sessionTokenHash(token: string): string { return createHash('sha256').update(token).digest('hex'); }

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

export async function authenticate(request: IncomingMessage, pool: Pool): Promise<IdentityPrincipal | null> {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  const local = localPrincipal(token);
  if (local) return local;

  const session = await pool.query(
    `SELECT s.admin_account_id, a.trooi_user_id, a.email, a.display_name
     FROM admin_sessions s JOIN admin_accounts a ON a.admin_account_id = s.admin_account_id
     WHERE s.token_hash = $1 AND s.expires_at > now() AND a.status = 'ACTIVE'`,
    [sessionTokenHash(token)],
  );
  if (session.rows[0]) {
    await pool.query('UPDATE admin_sessions SET last_used_at = now() WHERE token_hash = $1', [sessionTokenHash(token)]);
    const row = session.rows[0];
    return { accountId: row.admin_account_id, userId: row.trooi_user_id ?? row.admin_account_id,
      email: row.email ?? undefined, name: row.display_name ?? undefined };
  }

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
