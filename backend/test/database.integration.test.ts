import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { createPool, findEntry, getSummary, insertEntry, listEntries, resolveAdminPrincipal, updateEntry } from '../src/database.js';

const databaseUrl = process.env.TEST_DATABASE_URL;

test('PostgreSQL supports the complete manual-entry workflow', { skip: !databaseUrl }, async () => {
  const pool = createPool(databaseUrl);
  const id = randomUUID();
  const actorId = '00000000-0000-4000-8000-000000000001';
  const scopeKey = `integration-${id}`;
  const entry = {
    metricKey: 'SOCIAL_ORGANIC_REACH' as const,
    source: 'FACEBOOK_INSIGHTS' as const,
    scopeKey,
    value: 100,
    unit: 'COUNT' as const,
    periodStart: '2099-01-01',
    periodEnd: '2099-01-07',
    timezone: 'Asia/Ho_Chi_Minh',
    verification: 'MANUAL_VERIFIED' as const,
    note: 'Integration test',
  };
  try {
    const created = await insertEntry(pool, id, actorId, entry);
    assert.equal(created.entryId, id);
    assert.equal(created.value, 100);

    assert.equal((await findEntry(pool, id))?.scopeKey, scopeKey);
    const listed = await listEntries(pool, { metricKey: 'SOCIAL_ORGANIC_REACH', from: '2099-01-01', to: '2099-01-07', limit: 10, offset: 0 });
    assert.ok(listed.items.some((item) => item.entryId === id));

    const updated = await updateEntry(pool, id, actorId, { ...entry, value: 125 });
    assert.equal(updated?.value, 125);
    assert.ok((await getSummary(pool, '2099-01-01', '2099-01-07', false)).some((item) => item.entryId === id));
  } finally {
    await pool.query('DELETE FROM manual_statistic_entries WHERE entry_id = $1', [id]);
    await pool.end();
  }
});

test('PostgreSQL resolves roles and permissions for a linked TrọƠi account', { skip: !databaseUrl }, async () => {
  const pool = createPool(databaseUrl);
  const userId = randomUUID();
  const accountId = randomUUID();
  try {
    await pool.query(`INSERT INTO admin_accounts (admin_account_id, trooi_user_id, display_name) VALUES ($1, $2, 'Integration Admin')`, [accountId, userId]);
    await pool.query(`INSERT INTO admin_account_roles (admin_account_id, role_key) VALUES ($1, 'EDITOR')`, [accountId]);
    const principal = await resolveAdminPrincipal(pool, { userId, email: 'admin@example.test' });
    assert.deepEqual(principal?.roles, ['EDITOR']);
    assert.ok(principal?.permissions.includes('analytics:read'));
    assert.ok(principal?.permissions.includes('analytics:write'));
    assert.ok(!principal?.permissions.includes('admin:manage'));
  } finally {
    await pool.query('DELETE FROM admin_accounts WHERE admin_account_id = $1', [accountId]);
    await pool.end();
  }
});
