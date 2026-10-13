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

`ADMIN_API_TOKEN` là cơ chế MVP local và phải dài tối thiểu 24 ký tự. Không commit token thật. Trước khi public deploy, thay bằng Google/OIDC verification và phân quyền Admin chính thức.

## Chuẩn bị deploy

Lệnh `npm start` tự chạy các file migration SQL trước khi mở API. Migration hiện tại có thể chạy
lặp lại an toàn. Khi deploy, đặt `HOST=0.0.0.0`, `DATABASE_URL`, `ADMIN_API_TOKEN`,
`ADMIN_USER_ID` và `CORS_ORIGIN` bằng biến môi trường của nền tảng; không ghi secret vào GitHub.
