import { randomBytes, randomUUID } from 'node:crypto';
import { hashPassword } from './auth.js';
import { createPool } from './database.js';

const username = process.argv[2]?.trim() || 'admin';
if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) throw new Error('Username must contain 3-40 safe characters');
const password = randomBytes(18).toString('base64url');
const passwordHash = await hashPassword(password);
const accountId = randomUUID();
const pool = createPool();

try {
  await pool.query('BEGIN');
  await pool.query(
    `INSERT INTO admin_accounts (admin_account_id, username, password_hash, display_name)
     VALUES ($1, $2, $3, 'Web Admin')`,
    [accountId, username, passwordHash],
  );
  await pool.query(
    `INSERT INTO admin_account_roles (admin_account_id, role_key) VALUES ($1, 'SUPER_ADMIN')`,
    [accountId],
  );
  await pool.query('COMMIT');
  console.log(JSON.stringify({ username, temporaryPassword: password, accountId }, null, 2));
} catch (error) {
  await pool.query('ROLLBACK');
  throw error;
} finally {
  await pool.end();
}
