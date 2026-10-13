import { createPool } from './database.js';

const [userId, role = 'SUPER_ADMIN', email, ...nameParts] = process.argv.slice(2);
const allowedRoles = new Set(['SUPER_ADMIN', 'EDITOR', 'VIEWER', 'SYNC_MANAGER']);

if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
  throw new Error('Usage: npm run grant-admin -- <trooi-user-uuid> [SUPER_ADMIN|EDITOR|VIEWER|SYNC_MANAGER] [email] [display name]');
}
if (!allowedRoles.has(role)) throw new Error(`Unsupported role: ${role}`);

const pool = createPool();
try {
  await pool.query('BEGIN');
  await pool.query(
    `INSERT INTO admin_accounts (admin_account_id, trooi_user_id, email, display_name)
     VALUES ($1, $1, $2, $3)
     ON CONFLICT (trooi_user_id) DO UPDATE SET
       email = coalesce(EXCLUDED.email, admin_accounts.email),
       display_name = coalesce(EXCLUDED.display_name, admin_accounts.display_name),
       status = 'ACTIVE', updated_at = now()`,
    [userId, email || null, nameParts.join(' ') || null],
  );
  await pool.query(
    `INSERT INTO admin_account_roles (admin_account_id, role_key)
     SELECT admin_account_id, $2 FROM admin_accounts WHERE trooi_user_id = $1
     ON CONFLICT DO NOTHING`,
    [userId, role],
  );
  await pool.query('COMMIT');
  console.log(`Granted ${role} to TrọƠi user ${userId}`);
} catch (error) {
  await pool.query('ROLLBACK');
  throw error;
} finally {
  await pool.end();
}
