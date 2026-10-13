import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createPool } from './database.js';

const pool = createPool();
const directory = resolve(process.cwd(), '../database/migrations');

try {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const files = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
  let applied = 0;
  for (const file of files) {
    const exists = await pool.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [file]);
    if (exists.rowCount) continue;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(await readFile(resolve(directory, file), 'utf8'));
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      applied++;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  console.log(`Applied ${applied} new migration file(s); ${files.length} total`);
} finally {
  await pool.end();
}
