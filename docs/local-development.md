# Chạy local — Backend và Database độc lập

Toàn bộ Admin MVP nằm trong repo `web-admin-analytics`:

```text
web-admin-analytics/
├─ backend/              Node.js + TypeScript API
├─ database/migrations/  PostgreSQL schema
├─ compose.yml           PostgreSQL local
└─ docs/
```

`TroOi-Project` chỉ dùng để tham khảo dữ liệu/schema được phép. Không commit code Admin vào repo đó, không copy toàn bộ `src` và không kết nối database production.

## Yêu cầu

- Node.js 22 trở lên.
- Docker Desktop.
- PowerShell/Windows Terminal; VS Code chỉ là tùy chọn để xem/sửa file.

## Khởi động PostgreSQL

```powershell
cd T:\exe2\git\web-admin-analytics
docker compose up -d postgres
docker compose ps
```

PostgreSQL Admin chạy riêng trên cổng `55433`. Migration trong `database/migrations` được áp dụng khi volume được tạo lần đầu.

Không chạy `docker compose down -v` nếu muốn giữ dữ liệu; tham số `-v` xóa volume database.

## Build và test Backend

```powershell
cd T:\exe2\git\web-admin-analytics\backend
npm install
npm run typecheck
npm test
npm run build
```

Biến môi trường local:

```env
PORT=3200
DATABASE_URL=postgresql://admin_analytics:admin_analytics_local@localhost:55433/admin_analytics
ADMIN_API_TOKEN=<token-local-dai-it-nhat-24-ky-tu>
ADMIN_USER_ID=00000000-0000-4000-8000-000000000001
```

Không commit `.env` hoặc token thật. `ADMIN_API_TOKEN` chỉ là cơ chế local MVP; phải thay bằng Google/OIDC verification trước public deploy.

## API hiện có

```text
GET   http://localhost:3200/api/v1/health
POST  http://localhost:3200/api/v1/admin/statistics/entries
GET   http://localhost:3200/api/v1/admin/statistics/entries
GET   http://localhost:3200/api/v1/admin/statistics/entries/:id
PATCH http://localhost:3200/api/v1/admin/statistics/entries/:id
```

## Bằng chứng runtime hiện tại

- PostgreSQL container healthy.
- Migration tạo bảng, constraints và indexes thành công.
- Typecheck, 2 validation tests và build pass.
- Health trả `200`.
- Thiếu token trả `401`.
- Tạo entry trả `201`, list đọc lại được entry.
- Tạo trùng cùng metric/source/scope/period/timezone trả `409`.

## Frontend sau này

Frontend cấu hình:

```env
VITE_API_BASE_URL=http://localhost:3200/api/v1
```

Frontend gọi `/admin/statistics/entries`, không truy cập PostgreSQL và không hard-code KPI values trong bản bàn giao.
