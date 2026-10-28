import { randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { authenticate, newSessionToken, sessionTokenHash, verifyPassword } from './auth.js';
import { createPool, createSession, findEntry, getSummary, insertEntry, listEntries, passwordAccount, resolveAdminPrincipal, updateEntry } from './database.js';
import { ValidationError, validateEntry, validateFilters, validateSummaryPeriod } from './validation.js';
import { financeEntries, withoutAutomaticManualEntries } from './finance.js';

const pool = createPool();
const prefix = '/api/v1/admin/statistics/entries';
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const localOrigins = new Set(['http://localhost:5173', 'http://127.0.0.1:5173']);

function corsOrigin(request: IncomingMessage): string | undefined {
  const origin = request.headers.origin;
  if (!origin) return undefined;
  const configuredOrigins = (process.env.CORS_ORIGIN ?? '').split(',').map((value) => value.trim());
  if (configuredOrigins.includes(origin)) return origin;
  return process.env.NODE_ENV !== 'production' && localOrigins.has(origin) ? origin : undefined;
}

function setCorsHeaders(request: IncomingMessage, response: ServerResponse): void {
  const origin = corsOrigin(request);
  if (origin) response.setHeader('access-control-allow-origin', origin);
  response.setHeader('vary', 'Origin');
  response.setHeader('access-control-allow-headers', 'authorization, content-type');
  response.setHeader('access-control-allow-methods', 'GET, POST, PATCH, OPTIONS');
}

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk);
    size += buffer.length;
    if (size > 64 * 1024) throw new ValidationError('body is too large');
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ValidationError('body must be valid JSON');
  }
}

async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  setCorsHeaders(request, response);
  const url = new URL(request.url ?? '/', 'http://localhost');
  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/v1/health') {
    json(response, 200, { status: 'ok' });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/v1/auth/login') {
    const key = request.socket.remoteAddress ?? 'unknown';
    const now = Date.now();
    const attempt = loginAttempts.get(key);
    if (attempt && attempt.resetAt > now && attempt.count >= 5) {
      json(response, 429, { error: 'Too many login attempts. Try again later.' });
      return;
    }
    try {
      const body = await readJson(request) as Record<string, unknown>;
      const username = typeof body.username === 'string' ? body.username.trim() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      const account = username ? await passwordAccount(pool, username) : null;
      const valid = account?.password_hash && await verifyPassword(password, account.password_hash);
      if (!valid) {
        loginAttempts.set(key, { count: attempt?.resetAt && attempt.resetAt > now ? attempt.count + 1 : 1, resetAt: now + 60_000 });
        json(response, 401, { error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        return;
      }
      loginAttempts.delete(key);
      const token = newSessionToken();
      await createSession(pool, randomUUID(), account.admin_account_id, sessionTokenHash(token));
      const principal = await resolveAdminPrincipal(pool, {
        accountId: account.admin_account_id,
        userId: account.trooi_user_id ?? account.admin_account_id,
        email: account.email ?? undefined,
        name: account.display_name ?? undefined,
      });
      json(response, 200, { data: principal, token, expiresInSeconds: 28_800 });
      return;
    } catch (error) {
      if (error instanceof ValidationError) json(response, 400, { error: error.message });
      else json(response, 500, { error: 'Internal server error' });
      return;
    }
  }
  const identity = await authenticate(request, pool);
  if (!identity) {
    json(response, 401, { error: 'Unauthorized' });
    return;
  }
  try {
    const principal = await resolveAdminPrincipal(pool, identity);
    if (!principal) {
      json(response, 403, { error: 'Admin account is inactive or has not been granted access' });
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/v1/auth/me') {
      json(response, 200, { data: principal });
      return;
    }
    const requiredPermission = request.method === 'GET' ? 'analytics:read' : 'analytics:write';
    if (!principal.permissions.includes(requiredPermission)) {
      json(response, 403, { error: `Missing permission: ${requiredPermission}` });
      return;
    }
    if (request.method === 'POST' && url.pathname === prefix) {
      const row = await insertEntry(pool, randomUUID(), principal.userId, validateEntry(await readJson(request)));
      json(response, 201, { data: row });
      return;
    }
    if (request.method === 'GET' && url.pathname === prefix) {
      const filters = validateFilters(url.searchParams);
      const result = await listEntries(pool, filters);
      json(response, 200, { data: result.items, pagination: {
        total: result.total, limit: filters.limit, offset: filters.offset,
      } });
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/v1/admin/statistics/summary') {
      const period = validateSummaryPeriod(url.searchParams);
      const manual = withoutAutomaticManualEntries(await getSummary(pool, period.from, period.to, period.includeDemo));
      try {
        json(response, 200, {
          period: { from: period.from, to: period.to },
          data: [...manual, ...await financeEntries(period.from, period.to)],
          live: { status: 'ok' },
        });
      } catch (error) {
        console.error('Finance API unavailable');
        json(response, 200, {
          period: { from: period.from, to: period.to },
          data: manual,
          live: { status: 'unavailable', message: (error as Error).message },
        });
      }
      return;
    }
    const match = url.pathname.match(/^\/api\/v1\/admin\/statistics\/entries\/([0-9a-f-]{36})$/i);
    if (match && request.method === 'GET') {
      const row = await findEntry(pool, match[1]!);
      json(response, row ? 200 : 404, row ? { data: row } : { error: 'Not found' });
      return;
    }
    if (match && request.method === 'PATCH') {
      const existing = await findEntry(pool, match[1]!);
      if (!existing) {
        json(response, 404, { error: 'Not found' });
        return;
      }
      const patch = await readJson(request);
      if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
        throw new ValidationError('body must be an object');
      }
      const row = await updateEntry(pool, match[1]!, principal.userId, validateEntry({
        metricKey: existing.metricKey,
        source: existing.source,
        scopeKey: existing.scopeKey,
        value: existing.value,
        unit: existing.unit,
        periodStart: existing.periodStart,
        periodEnd: existing.periodEnd,
        timezone: existing.timezone,
        verification: existing.verification,
        note: existing.note,
        ...patch,
      }));
      json(response, row ? 200 : 404, row ? { data: row } : { error: 'Not found' });
      return;
    }
    json(response, 404, { error: 'Not found' });
  } catch (error) {
    if (error instanceof ValidationError) {
      json(response, 400, { error: error.message });
      return;
    }
    if ((error as { code?: string }).code === '23505') {
      json(response, 409, { error: 'An entry already exists for this metric, source, scope and period' });
      return;
    }
    console.error('Request failed');
    json(response, 500, { error: 'Internal server error' });
  }
}

const port = Number(process.env.PORT ?? 3200);
const host = process.env.HOST ?? '127.0.0.1';
const server = createServer((request, response) => void handler(request, response));
server.listen(port, host, () => console.log(`Admin Analytics API listening on http://${host}:${port}`));

async function shutdown() {
  server.close();
  await pool.end();
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
