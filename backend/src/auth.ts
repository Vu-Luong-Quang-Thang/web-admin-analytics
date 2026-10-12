import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

export type AdminPrincipal = { userId: string };

export function authenticate(request: IncomingMessage): AdminPrincipal | null {
  const expected = process.env.ADMIN_API_TOKEN;
  const userId = process.env.ADMIN_USER_ID;
  const header = request.headers.authorization;
  if (!expected || expected.length < 24 || !userId || !header?.startsWith('Bearer ')) return null;
  const actual = header.slice(7).trim();
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  return { userId };
}
