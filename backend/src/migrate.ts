import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createPool } from './database.js';

const pool = createPool();
const directory = resolve(process.cwd(), '../database/migrations');

try {
  const files = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
  for (const file of files) await pool.query(await readFile(resolve(directory, file), 'utf8'));
  console.log(`Applied ${files.length} database migration file(s)`);
} finally {
  await pool.end();
}
