# Chạy local và kết nối hai repository

## Nguyên tắc

Admin frontend và Backend/App là hai repository độc lập:

```text
web-admin-analytics  --HTTP-->  TroOi-Project  --> PostgreSQL
```

Không copy `src`, migrations, database password hoặc service credential từ `TroOi-Project` vào frontend.

## Thư mục tham khảo trên Windows

```text
T:\exe2\git\web-admin-analytics
T:\exe2\git\TroOi-Project-admin-analytics
```

Nếu máy đã có hai thư mục này thì không clone lại. Nếu chưa có, clone từng repository vào hai thư mục riêng và checkout đúng nhánh được giao.

## Backend + Database

Nhánh Backend Analytics:

```text
feature/admin-analytics-api
```

Các biến local tối thiểu:

```env
PORT=3100
DATABASE_URL=postgresql://trooi:trooi_local@localhost:55432/trooi_test
ADMIN_USER_IDS=<internal-user-uuid>
GOOGLE_CLIENT_ID=<google-oauth-client-id>
```

Không commit file `.env` thật. `trooi_test` dùng cho kiểm thử; không reset `trooi_dev`.

Lệnh PowerShell:

```powershell
cd T:\exe2\git\TroOi-Project-admin-analytics
pnpm install
$env:DATABASE_URL='postgresql://trooi:trooi_local@localhost:55432/trooi_test'
$env:PORT='3100'
pnpm exec tsx scripts/database/migrate.ts up
pnpm build
pnpm start
```

Địa chỉ kiểm tra:

- Health: `http://localhost:3100/api/v1/health`
- Swagger: `http://localhost:3100/docs`
- Analytics: `http://localhost:3100/api/v1/admin/analytics/overview`

Analytics thiếu token phải trả `401`. User đăng nhập hợp lệ nhưng không thuộc `ADMIN_USER_IDS` phải trả `403`.

## Admin frontend

Frontend dùng:

```env
VITE_API_BASE_URL=http://localhost:3100/api/v1
```

API client gọi đường dẫn tương đối:

```text
/admin/analytics/overview
```

Frontend không được gọi PostgreSQL, không chứa Google/Meta service secret và phải hiển thị `payingUsers: null` thành **Chưa xác định**.

## Trạng thái đã kiểm chứng

- PostgreSQL container healthy.
- Sáu migrations đã chạy trên `trooi_test`.
- Backend build thành công.
- Health và Swagger trả `200`.
- Analytics không có token trả `401`.
- Unit, HTTP và PostgreSQL integration tests của Admin Analytics pass.

Google login thật và `ADMIN_USER_IDS` thật là bước cấu hình môi trường tiếp theo; không gửi token trong chat hoặc commit vào repository.
