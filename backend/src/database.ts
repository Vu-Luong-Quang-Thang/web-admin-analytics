import { Pool } from 'pg';
import type { ManualEntryInput } from './contracts.js';

export function createPool(databaseUrl = process.env.DATABASE_URL): Pool {
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  return new Pool({ connectionString: databaseUrl, max: 10, connectionTimeoutMillis: 5_000 });
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
  return result.rows[0];
}

export async function listEntries(pool: Pool, limit: number) {
  const result = await pool.query(
    `SELECT * FROM manual_statistic_entries ORDER BY period_end DESC, updated_at DESC LIMIT $1`,
    [limit],
  );
  return result.rows;
}

export async function findEntry(pool: Pool, id: string) {
  const result = await pool.query(`SELECT * FROM manual_statistic_entries WHERE entry_id = $1`, [id]);
  return result.rows[0] ?? null;
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
  return result.rows[0] ?? null;
}
