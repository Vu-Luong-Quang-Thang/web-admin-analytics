import { randomUUID } from 'node:crypto';
import { hashPassword } from './auth.js';
import { createPool } from './database.js';

const username = process.env.BOOTSTRAP_ADMIN_USERNAME?.trim();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

if (!username && !password) {
  console.log('Admin bootstrap not configured; skipping');
} else {
  if (!username || !/^[a-zA-Z0-9._-]{3,40}$/.test(username)) {
    throw new Error('BOOTSTRAP_ADMIN_USERNAME must contain 3-40 safe characters');
  }
  if (!password || password.length < 16) {
    throw new Error('BOOTSTRAP_ADMIN_PASSWORD must contain at least 16 characters');
  }

  const pool = createPool();
  try {
    const existing = await pool.query('SELECT admin_account_id FROM admin_accounts WHERE username = $1', [username]);
    if (existing.rowCount) {
      console.log(`Admin account ${username} already exists; bootstrap skipped`);
    } else {
      const accountId = randomUUID();
      await pool.query('BEGIN');
      await pool.query(
        `INSERT INTO admin_accounts (admin_account_id, username, password_hash, display_name)
         VALUES ($1, $2, $3, 'Web Admin')`,
        [accountId, username, await hashPassword(password)],
      );
      await pool.query(
        `INSERT INTO admin_account_roles (admin_account_id, role_key) VALUES ($1, 'SUPER_ADMIN')`,
        [accountId],
      );
      await pool.query('COMMIT');
      console.log(`Created permanent SUPER_ADMIN account: ${username}`);
    }
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  } finally {
    await pool.end();
  }
}
