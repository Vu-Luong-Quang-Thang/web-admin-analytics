# Admin Analytics API

Backend độc lập của `web-admin-analytics`. Backend này lưu số liệu nhập thủ công trong database riêng và không phụ thuộc code runtime của `TroOi-Project`.

## Chạy local

```powershell
docker compose up -d postgres
cd backend
npm install
Copy-Item .env.example .env
```

Nạp biến môi trường bằng cách phù hợp với máy, sau đó:

```powershell
npm run build
npm test
npm start
```

API:

```text
GET   /api/v1/health
POST  /api/v1/admin/statistics/entries
GET   /api/v1/admin/statistics/entries
GET   /api/v1/admin/statistics/entries/:id
PATCH /api/v1/admin/statistics/entries/:id
```

`ADMIN_API_TOKEN` là cơ chế MVP local và phải dài tối thiểu 24 ký tự. Không commit token thật. Trước khi public deploy, thay bằng Google/OIDC verification và phân quyền Admin chính thức.
