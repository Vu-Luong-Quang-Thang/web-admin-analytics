import { randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { authenticate } from './auth.js';
import { createPool, findEntry, getSummary, insertEntry, listEntries, updateEntry } from './database.js';
import { ValidationError, validateEntry, validateFilters, validateSummaryPeriod } from './validation.js';

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
      const filters = validateFilters(url.searchParams);
      const result = await listEntries(pool, filters);
      json(response, 200, { data: result.items, pagination: {
        total: result.total, limit: filters.limit, offset: filters.offset,
      } });
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/v1/admin/statistics/summary') {
      const period = validateSummaryPeriod(url.searchParams);
      json(response, 200, { period: { from: period.from, to: period.to }, data: await getSummary(
        pool, period.from, period.to, period.includeDemo,
      ) });
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
