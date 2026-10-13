# Chạy toàn bộ dự án trên máy

Tất cả thành phần nằm trong `web-admin-analytics`; quy trình này không dùng và không sửa
`TroOi-Project`.

## Yêu cầu đã kiểm tra

- Node.js 22 trở lên (máy hiện tại: Node 24).
- Docker Desktop + Docker Compose.
- PowerShell/Windows Terminal. VS Code chỉ là tùy chọn.

## 1. Database

```powershell
cd T:\exe2\git\web-admin-analytics
docker compose up -d postgres
docker compose ps
```

Chờ trạng thái `healthy`. Dữ liệu nằm trong volume `web-admin-analytics_admin_analytics_data`.
`docker compose stop` hoặc `docker compose down` vẫn giữ volume. Không chạy
`docker compose down -v` vì `-v` xóa toàn bộ dữ liệu local.

## 2. Backend — Terminal thứ nhất

```powershell
cd T:\exe2\git\web-admin-analytics\backend
npm install
Copy-Item .env.example .env   # chỉ cần nếu chưa có .env
npm run build
npm start
```

Backend chạy tại `http://127.0.0.1:3200`. `npm start` tự áp dụng migration an toàn trước khi mở
API. File `.env` đã được gitignore; không commit token.

Kiểm tra:

```powershell
Invoke-RestMethod http://127.0.0.1:3200/api/v1/health
npm run typecheck
npm test
npm run test:integration
```

Integration test tạo một bản ghi riêng, kiểm tra CRUD/summary rồi tự xóa; không reset database.

## 3. Frontend — Terminal thứ hai

```powershell
cd T:\exe2\git\web-admin-analytics\frontend
npm install
Copy-Item .env.example .env   # chỉ cần nếu chưa có .env
npm run dev -- --host 127.0.0.1
```

Mở `http://127.0.0.1:5173`, nhập giá trị `ADMIN_API_TOKEN` trong `backend/.env`. Token chỉ nằm
trong `sessionStorage` và bị xóa khi đóng phiên trình duyệt.

Production dùng Google account của app Trọ Ơi. Sau khi biết `userId` của tài khoản app, cấp role
trong database Admin:

```powershell
cd T:\exe2\git\web-admin-analytics\backend
npm run build
npm run grant-admin -- <trooi-user-uuid> SUPER_ADMIN <email> <display name>
```

Role và quyền:

- `SUPER_ADMIN`: xem, cập nhật, quản lý Admin và đồng bộ.
- `EDITOR`: xem và cập nhật số liệu.
- `VIEWER`: chỉ xem.
- `SYNC_MANAGER`: xem và quản lý đồng bộ tự động.

Nếu đã tạo tài khoản Web Admin trước khi có tài khoản app, liên kết sau mà không mất role:

```powershell
npm run link-trooi-user -- admin <trooi-user-uuid>
```

## 4. Production build

```powershell
cd T:\exe2\git\web-admin-analytics\backend
npm run build

cd ..\frontend
npm run build
```

Thành công khi backend có `backend/build` và frontend có `frontend/dist`.

## 5. Deploy cho giáo viên xem

- Backend + PostgreSQL: dùng `render.yaml` tại root để tạo Render Blueprint.
- Frontend: deploy `frontend` dưới dạng Static Site; build command `npm ci && npm run build`,
  publish directory `dist`.
- Trước build frontend, đặt `VITE_API_URL` bằng URL backend thật.
- Sau khi có URL frontend, đặt `CORS_ORIGIN` của backend đúng URL đó rồi redeploy backend.
- Production không dùng `ADMIN_API_TOKEN`; giáo viên đăng nhập Google bằng tài khoản đã được cấp role.
- Kiểm tra sau deploy: health 200, đăng nhập, tạo một bản ghi `DEMO`, thấy KPI/lịch sử, rồi không
  dùng bản ghi demo như dữ liệu thật.

## API

Đặc tả đầy đủ: `backend/openapi.yaml`.

```text
GET   /api/v1/health
POST  /api/v1/admin/statistics/entries
GET   /api/v1/admin/statistics/entries
GET   /api/v1/admin/statistics/entries/:id
PATCH /api/v1/admin/statistics/entries/:id
GET   /api/v1/admin/statistics/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
```
