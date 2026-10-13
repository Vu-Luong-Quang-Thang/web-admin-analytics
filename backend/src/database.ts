import { Pool, types } from 'pg';
import type { EntryFilters, ManualEntry, ManualEntryInput } from './contracts.js';
import type { IdentityPrincipal } from './auth.js';

// PostgreSQL DATE has no timezone. Keep it as YYYY-MM-DD instead of converting
// local midnight to UTC, which can shift the calendar day.
types.setTypeParser(1082, (value) => value);

type EntryRow = Record<string, unknown>;

function dateOnly(value: unknown): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
}

function timestamp(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export function toEntry(row: EntryRow): ManualEntry {
  return {
    entryId: String(row.entry_id),
    metricKey: row.metric_key as ManualEntry['metricKey'],
    source: row.source as ManualEntry['source'],
    scopeKey: row.scope_key == null ? null : String(row.scope_key),
    value: Number(row.value),
    unit: row.unit as ManualEntry['unit'],
    periodStart: dateOnly(row.period_start),
    periodEnd: dateOnly(row.period_end),
    timezone: String(row.timezone),
    verification: row.verification as ManualEntry['verification'],
    note: row.note == null ? null : String(row.note),
    createdByUserId: String(row.created_by_user_id),
    updatedByUserId: String(row.updated_by_user_id),
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
  };
}

export function createPool(databaseUrl = process.env.DATABASE_URL): Pool {
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  return new Pool({ connectionString: databaseUrl, max: 10, connectionTimeoutMillis: 5_000 });
}

export type AdminPrincipal = IdentityPrincipal & { roles: string[]; permissions: string[] };

export async function resolveAdminPrincipal(pool: Pool, identity: IdentityPrincipal): Promise<AdminPrincipal | null> {
  if (identity.localDevelopment) {
    return { ...identity, roles: ['SUPER_ADMIN'], permissions: ['analytics:read', 'analytics:write', 'admin:manage', 'sync:manage'] };
  }
  const result = await pool.query(
    `SELECT a.trooi_user_id, a.display_name, a.email,
       coalesce(array_agg(DISTINCT ar.role_key) FILTER (WHERE ar.role_key IS NOT NULL), '{}') AS roles,
       coalesce(array_agg(DISTINCT rp.permission_key) FILTER (WHERE rp.permission_key IS NOT NULL), '{}') AS permissions
     FROM admin_accounts a
     LEFT JOIN admin_account_roles ar ON ar.trooi_user_id = a.trooi_user_id
     LEFT JOIN admin_role_permissions rp ON rp.role_key = ar.role_key
     WHERE a.trooi_user_id = $1 AND a.status = 'ACTIVE'
     GROUP BY a.trooi_user_id, a.display_name, a.email`,
    [identity.userId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...identity,
    name: identity.name ?? row.display_name ?? undefined,
    email: identity.email ?? row.email ?? undefined,
    roles: row.roles,
    permissions: row.permissions,
  };
}

export async function insertEntry(pool: Pool, id: string, actorId: string, entry: ManualEntryInput) {
  const result = await pool.query(
    `INSERT INTO manual_statistic_entries (
       entry_id, metric_key, source, scope_key, value, unit, period_start, period_end,
       timezone, verification, note, created_by_user_id, updated_by_user_id
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)
     RETURNING *`,
    [id, entry.metricKey, entry.source, entry.scopeKey, entry.value, entry.unit,
      entry.periodStart, entry.periodEnd, entry.timezone, entry.verification, entry.note, actorId],
  );
  return toEntry(result.rows[0]);
}

export async function listEntries(pool: Pool, filters: EntryFilters) {
  const where: string[] = [];
  const values: unknown[] = [];
  const add = (condition: string, value: unknown) => {
    values.push(value);
    where.push(condition.replace('?', `$${values.length}`));
  };
  if (filters.metricKey) add('metric_key = ?', filters.metricKey);
  if (filters.source) add('source = ?', filters.source);
  if (filters.verification) add('verification = ?', filters.verification);
  if (filters.from) add('period_end >= ?', filters.from);
  if (filters.to) add('period_start <= ?', filters.to);
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const count = await pool.query(`SELECT count(*)::int AS total FROM manual_statistic_entries ${clause}`, values);
  values.push(filters.limit, filters.offset);
  const result = await pool.query(
    `SELECT * FROM manual_statistic_entries ${clause}
     ORDER BY period_end DESC, updated_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );
  return { items: result.rows.map(toEntry), total: Number(count.rows[0].total) };
}

export async function findEntry(pool: Pool, id: string) {
  const result = await pool.query(`SELECT * FROM manual_statistic_entries WHERE entry_id = $1`, [id]);
  return result.rows[0] ? toEntry(result.rows[0]) : null;
}

export async function updateEntry(pool: Pool, id: string, actorId: string, entry: ManualEntryInput) {
  const result = await pool.query(
    `UPDATE manual_statistic_entries SET
       metric_key=$2, source=$3, scope_key=$4, value=$5, unit=$6,
       period_start=$7, period_end=$8, timezone=$9, verification=$10, note=$11,
       updated_by_user_id=$12, updated_at=now()
     WHERE entry_id=$1 RETURNING *`,
    [id, entry.metricKey, entry.source, entry.scopeKey, entry.value, entry.unit,
      entry.periodStart, entry.periodEnd, entry.timezone, entry.verification, entry.note, actorId],
  );
  return result.rows[0] ? toEntry(result.rows[0]) : null;
}

export async function getSummary(pool: Pool, from: string, to: string, includeDemo: boolean) {
  const result = await pool.query(
    `SELECT * FROM manual_statistic_entries
     WHERE period_start = $1 AND period_end = $2
       AND ($3::boolean OR verification <> 'DEMO')
     ORDER BY metric_key, source, scope_key NULLS FIRST`,
    [from, to, includeDemo],
  );
  return result.rows.map(toEntry);
}
