# Statistics API Contract

## Query chung dự kiến

```text
from=YYYY-MM-DD&to=YYYY-MM-DD&timezone=Asia/Ho_Chi_Minh
```

Endpoint snapshot hiện tại chưa nhận các query này. Khi triển khai bộ lọc, Backend phải validate ngày, `from <= to`, timezone cho phép và giới hạn khoảng truy vấn.

## Endpoint hiện đã triển khai

```text
GET /api/v1/admin/analytics/overview
```

Các endpoint Landing, App, Marketing và Sources mới là kế hoạch; chưa được xem là API hiện có cho tới khi có nguồn thật, adapter và test.

## Business Summary

```http
GET /api/v1/admin/analytics/overview
Authorization: Bearer <verified-id-token>
```

### 200 OK

```json
{
  "totalAccounts": 10,
  "payingUsers": null,
  "successfulPayments": 4,
  "paymentClaimSubmitters": 2,
  "gatewayCheckoutCreators": 1,
  "conversionRate": null,
  "payingUsersStatus": "UNAVAILABLE_POLICY_OPEN",
  "generatedAt": "2026-10-12T04:00:00.000Z"
}
```

Quy tắc:

- Các count có dữ liệu là integer không âm.
- `payingUsers` và `conversionRate` là `null` cho tới khi nhóm chốt quy tắc canonical xác định payer.
- `paymentClaimSubmitters` và `gatewayCheckoutCreators` chỉ mô tả người gửi claim/người tạo checkout; không phải payer đã xác minh và không được cộng trực tiếp.
- `payingUsersStatus` hiện là `UNAVAILABLE_POLICY_OPEN`.
- `generatedAt` là UTC ISO 8601 do Backend tạo.
- Database rỗng trả các count khả dụng bằng 0; KPI payer vẫn trả `null`.
- Không có `currency` vì Summary không trả giá trị tiền.

Field `sources` chưa có trong endpoint hiện tại. Khi triển khai nguồn ngoài, trạng thái dự kiến là `CONNECTED`, `STALE`, `ERROR`, `NOT_CONNECTED`, `NOT_AVAILABLE`; phải cập nhật backend, OpenAPI và file này trong cùng PR.

### Lỗi

- `401 Unauthorized`: thiếu token, token sai hoặc token hết hạn.
- `403 Forbidden`: đã xác thực nhưng không phải System Admin.
- `400 Bad Request`: dành cho date range/timezone khi bộ lọc này được triển khai; endpoint snapshot hiện tại chưa nhận query đó.
- `502 Bad Gateway`: nguồn ngoài lỗi; overview có thể trả partial data kèm source `ERROR` nếu contract đã chốt.
- `500 Internal Server Error`: lỗi không mong đợi; không trả stack trace hoặc secret.

Error body dùng format chung hiện có của `TroOi-Project`; không tạo format riêng chỉ cho module Statistics.

## Authentication dependency

`AuthGuard` phải xác minh Google ID token thật, ánh xạ identity sang `user_id` và gắn authenticated user vào request trước khi `AdminGuard` kiểm tra `ADMIN_USER_IDS`.

Chỉ kiểm tra chuỗi `Bearer ` không được coi là authentication.

