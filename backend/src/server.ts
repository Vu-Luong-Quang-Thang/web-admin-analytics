import { randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { authenticate } from './auth.js';
import { createPool, findEntry, insertEntry, listEntries, updateEntry } from './database.js';
import { ValidationError, validateEntry } from './validation.js';

const pool = createPool();
const prefix = '/api/v1/admin/statistics/entries';

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS',
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
  const url = new URL(request.url ?? '/', 'http://localhost');
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'access-control-allow-origin': process.env.CORS_ORIGIN ?? 'http://localhost:5173',
      'access-control-allow-headers': 'authorization, content-type',
      'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS',
    });
    response.end();
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/v1/health') {
    json(response, 200, { status: 'ok' });
    return;
  }
  const principal = authenticate(request);
  if (!principal) {
    json(response, 401, { error: 'Unauthorized' });
    return;
  }
  try {
    if (request.method === 'POST' && url.pathname === prefix) {
      const row = await insertEntry(pool, randomUUID(), principal.userId, validateEntry(await readJson(request)));
      json(response, 201, { data: row });
      return;
    }
    if (request.method === 'GET' && url.pathname === prefix) {
      const rawLimit = Number(url.searchParams.get('limit') ?? 50);
      const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 50;
      json(response, 200, { data: await listEntries(pool, limit) });
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
        metricKey: existing.metric_key,
        source: existing.source,
        scopeKey: existing.scope_key,
        value: Number(existing.value),
        unit: existing.unit,
        periodStart: existing.period_start instanceof Date
          ? existing.period_start.toISOString().slice(0, 10)
          : String(existing.period_start),
        periodEnd: existing.period_end instanceof Date
          ? existing.period_end.toISOString().slice(0, 10)
          : String(existing.period_end),
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
const server = createServer((request, response) => void handler(request, response));
server.listen(port, '127.0.0.1', () => console.log(`Admin Analytics API listening on http://127.0.0.1:${port}`));

async function shutdown() {
  server.close();
  await pool.end();
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
