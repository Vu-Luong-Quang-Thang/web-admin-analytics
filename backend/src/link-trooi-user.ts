import { createPool } from './database.js';

const [username, userId] = process.argv.slice(2);
if (!username || !userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
  throw new Error('Usage: npm run link-trooi-user -- <admin-username> <trooi-user-uuid>');
}

const pool = createPool();
try {
  const result = await pool.query(
    `UPDATE admin_accounts SET trooi_user_id = $2, updated_at = now()
     WHERE lower(username) = lower($1) RETURNING admin_account_id`,
    [username, userId],
  );
  if (!result.rowCount) throw new Error(`Admin account not found: ${username}`);
  console.log(`Linked admin ${username} to TrọƠi user ${userId}`);
} finally {
  await pool.end();
}
