# Statistics API Contract

## Summary

```http
GET /api/admin/statistics/summary
Authorization: Bearer <verified-id-token>
```

MVP không nhận query parameter.

### 200 OK

```json
{
  "totalAccounts": 10,
  "payingUsers": 3,
  "successfulPayments": 4,
  "conversionRate": 30,
  "generatedAt": "2026-10-12T04:00:00.000Z"
}
```

Quy tắc:

- Các count là integer không âm.
- `conversionRate` là number từ 0 đến 100, làm tròn tối đa hai chữ số thập phân.
- `generatedAt` là UTC ISO 8601 do Backend tạo.
- Database rỗng trả bốn KPI bằng 0.
- Không có `currency` vì Summary không trả giá trị tiền.

### Lỗi

- `401 Unauthorized`: thiếu token, token sai hoặc token hết hạn.
- `403 Forbidden`: đã xác thực nhưng không phải System Admin.
- `500 Internal Server Error`: lỗi không mong đợi; không trả stack trace hoặc secret.

Error body dùng format chung hiện có của `TroOi-Project`; không tạo format riêng chỉ cho module Statistics.

## Authentication dependency

`AuthGuard` phải xác minh Google ID token thật, ánh xạ identity sang `user_id` và gắn authenticated user vào request trước khi `AdminGuard` kiểm tra `ADMIN_USER_IDS`.

Chỉ kiểm tra chuỗi `Bearer ` không được coi là authentication.

