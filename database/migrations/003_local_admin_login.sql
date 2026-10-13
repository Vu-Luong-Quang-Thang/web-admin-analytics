ALTER TABLE admin_accounts ADD COLUMN admin_account_id uuid;
UPDATE admin_accounts SET admin_account_id = trooi_user_id WHERE admin_account_id IS NULL;
ALTER TABLE admin_accounts ALTER COLUMN admin_account_id SET NOT NULL;
ALTER TABLE admin_account_roles DROP CONSTRAINT admin_account_roles_trooi_user_id_fkey;
ALTER TABLE admin_accounts DROP CONSTRAINT admin_accounts_pkey;
ALTER TABLE admin_accounts ADD PRIMARY KEY (admin_account_id);
ALTER TABLE admin_accounts ALTER COLUMN trooi_user_id DROP NOT NULL;
ALTER TABLE admin_accounts ADD COLUMN username text;
ALTER TABLE admin_accounts ADD COLUMN password_hash text;
CREATE UNIQUE INDEX uq_admin_accounts_trooi_user ON admin_accounts (trooi_user_id) WHERE trooi_user_id IS NOT NULL;
CREATE UNIQUE INDEX uq_admin_accounts_username ON admin_accounts (lower(username)) WHERE username IS NOT NULL;

ALTER TABLE admin_account_roles ADD COLUMN admin_account_id uuid;
UPDATE admin_account_roles r SET admin_account_id = a.admin_account_id
FROM admin_accounts a WHERE r.trooi_user_id = a.trooi_user_id;
ALTER TABLE admin_account_roles ALTER COLUMN admin_account_id SET NOT NULL;
ALTER TABLE admin_account_roles DROP CONSTRAINT admin_account_roles_pkey;
ALTER TABLE admin_account_roles DROP COLUMN trooi_user_id;
ALTER TABLE admin_account_roles ADD PRIMARY KEY (admin_account_id, role_key);
ALTER TABLE admin_account_roles ADD CONSTRAINT fk_admin_account_roles_account
  FOREIGN KEY (admin_account_id) REFERENCES admin_accounts(admin_account_id) ON DELETE CASCADE;

CREATE TABLE admin_sessions (
  session_id uuid PRIMARY KEY,
  admin_account_id uuid NOT NULL REFERENCES admin_accounts(admin_account_id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_admin_sessions_active ON admin_sessions (token_hash, expires_at);
