# Statistics API Contract

## Query chung

```text
from=YYYY-MM-DD&to=YYYY-MM-DD&timezone=Asia/Ho_Chi_Minh
```

Backend validate ngày, `from <= to`, timezone cho phép và giới hạn khoảng truy vấn.

## Endpoints

```text
GET /api/admin/analytics/overview
GET /api/admin/analytics/landing
GET /api/admin/analytics/app
GET /api/admin/analytics/users
GET /api/admin/analytics/revenue
GET /api/admin/analytics/marketing
GET /api/admin/analytics/sources
```

Không tạo endpoint cho nguồn chưa có nhu cầu hiển thị. `overview` tổng hợp chỉ các KPI đã chốt.

## Business Summary

```http
GET /api/admin/analytics/overview
Authorization: Bearer <verified-id-token>
```

### 200 OK

```json
{
  "totalAccounts": 10,
  "payingUsers": 3,
  "successfulPayments": 4,
  "conversionRate": 30,
  "generatedAt": "2026-10-12T04:00:00.000Z",
  "sources": {
    "database": { "status": "CONNECTED", "updatedAt": "2026-10-12T04:00:00.000Z" },
    "ga4": { "status": "CONNECTED", "updatedAt": "2026-10-12T03:50:00.000Z" },
    "firebase": { "status": "CONNECTED", "updatedAt": "2026-10-12T03:50:00.000Z" },
    "meta": { "status": "NOT_CONNECTED", "updatedAt": null },
    "store": { "status": "NOT_AVAILABLE", "updatedAt": null }
  }
}
```

Quy tắc:

- Các count là integer không âm.
- `conversionRate` là number từ 0 đến 100, làm tròn tối đa hai chữ số thập phân.
- `generatedAt` là UTC ISO 8601 do Backend tạo.
- Database rỗng trả bốn KPI bằng 0.
- Không có `currency` vì Summary không trả giá trị tiền.

Trạng thái source: `CONNECTED`, `STALE`, `ERROR`, `NOT_CONNECTED`, `NOT_AVAILABLE`.

### Lỗi

- `401 Unauthorized`: thiếu token, token sai hoặc token hết hạn.
- `403 Forbidden`: đã xác thực nhưng không phải System Admin.
- `400 Bad Request`: date range/timezone không hợp lệ.
- `502 Bad Gateway`: nguồn ngoài lỗi; overview có thể trả partial data kèm source `ERROR` nếu contract đã chốt.
- `500 Internal Server Error`: lỗi không mong đợi; không trả stack trace hoặc secret.

Error body dùng format chung hiện có của `TroOi-Project`; không tạo format riêng chỉ cho module Statistics.

## Authentication dependency

`AuthGuard` phải xác minh Google ID token thật, ánh xạ identity sang `user_id` và gắn authenticated user vào request trước khi `AdminGuard` kiểm tra `ADMIN_USER_IDS`.

Chỉ kiểm tra chuỗi `Bearer ` không được coi là authentication.

