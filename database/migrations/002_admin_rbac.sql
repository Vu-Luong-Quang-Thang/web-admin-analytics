CREATE TABLE IF NOT EXISTS admin_accounts (
  trooi_user_id uuid PRIMARY KEY,
  display_name text,
  email text,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_roles (
  role_key text PRIMARY KEY,
  display_name text NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_permissions (
  permission_key text PRIMARY KEY,
  description text NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_account_roles (
  trooi_user_id uuid NOT NULL REFERENCES admin_accounts(trooi_user_id) ON DELETE CASCADE,
  role_key text NOT NULL REFERENCES admin_roles(role_key) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trooi_user_id, role_key)
);

CREATE TABLE IF NOT EXISTS admin_role_permissions (
  role_key text NOT NULL REFERENCES admin_roles(role_key) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES admin_permissions(permission_key) ON DELETE CASCADE,
  PRIMARY KEY (role_key, permission_key)
);

INSERT INTO admin_roles (role_key, display_name) VALUES
  ('SUPER_ADMIN', 'Quản trị toàn hệ thống'),
  ('EDITOR', 'Nhập và cập nhật số liệu'),
  ('VIEWER', 'Chỉ xem số liệu'),
  ('SYNC_MANAGER', 'Quản lý đồng bộ dữ liệu')
ON CONFLICT (role_key) DO UPDATE SET display_name = EXCLUDED.display_name;

INSERT INTO admin_permissions (permission_key, description) VALUES
  ('analytics:read', 'Xem KPI, biểu đồ và lịch sử số liệu'),
  ('analytics:write', 'Nhập và cập nhật số liệu thủ công'),
  ('admin:manage', 'Quản lý tài khoản, vai trò và quyền Admin'),
  ('sync:manage', 'Cấu hình và vận hành đồng bộ dữ liệu tự động')
ON CONFLICT (permission_key) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO admin_role_permissions (role_key, permission_key) VALUES
  ('SUPER_ADMIN', 'analytics:read'), ('SUPER_ADMIN', 'analytics:write'),
  ('SUPER_ADMIN', 'admin:manage'), ('SUPER_ADMIN', 'sync:manage'),
  ('EDITOR', 'analytics:read'), ('EDITOR', 'analytics:write'),
  ('VIEWER', 'analytics:read'),
  ('SYNC_MANAGER', 'analytics:read'), ('SYNC_MANAGER', 'sync:manage')
ON CONFLICT DO NOTHING;
