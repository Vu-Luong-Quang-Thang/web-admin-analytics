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
GET   /api/v1/admin/statistics/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
```

Danh sách hỗ trợ `metricKey`, `source`, `verification`, `from`, `to`, `limit`, `offset`.
Response dùng camelCase để frontend sử dụng trực tiếp. Endpoint `summary` chỉ lấy bản ghi có kỳ
khớp chính xác, không cộng các kỳ chồng lấn; dữ liệu `DEMO` mặc định bị loại. Đặc tả đầy đủ nằm
trong [`openapi.yaml`](./openapi.yaml).

## Kiểm thử với PostgreSQL thật

Sau khi container database đang chạy và đã nạp `TEST_DATABASE_URL`:

```powershell
npm run test:integration
```

Test tạo một bản ghi riêng ở kỳ năm 2099 và luôn xóa bản ghi đó khi kết thúc. Test không reset
database, không xóa volume và không ảnh hưởng dữ liệu nhập tay đang có.

Production xác minh Google ID token bằng cùng `GOOGLE_CLIENT_ID` và thuật toán tạo `userId` của
app Trọ Ơi. `admin_accounts.trooi_user_id` liên kết tài khoản app với RBAC của Admin; tài khoản
không tồn tại, bị khóa hoặc không có quyền phù hợp nhận `403`. Các role mặc định là
`SUPER_ADMIN`, `EDITOR`, `VIEWER`, `SYNC_MANAGER`.

Sau khi tài khoản đã từng đăng nhập app Trọ Ơi và có `userId`, cấp quyền ban đầu:

```powershell
npm run build
npm run grant-admin -- <trooi-user-uuid> SUPER_ADMIN <email> <display name>
```

`ADMIN_API_TOKEN` chỉ hoạt động khi không chạy `NODE_ENV=production`, nhằm phục vụ local
development. Không commit token hay ID người dùng thật.

## Chuẩn bị deploy

Lệnh `npm start` tự chạy các file migration SQL trước khi mở API. Migration hiện tại có thể chạy
lặp lại an toàn. Khi deploy, đặt `HOST=0.0.0.0`, `DATABASE_URL`, `GOOGLE_CLIENT_ID` và
`CORS_ORIGIN` bằng biến môi trường của nền tảng; không ghi credential hoặc danh sách người dùng
thật vào GitHub. Sau migration, chạy lệnh `grant-admin` với database production để bootstrap
System Admin đầu tiên.
