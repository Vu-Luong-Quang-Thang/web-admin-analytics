# Statistics API Contract

## Trạng thái

- Manual Entry CRUD đã triển khai bước đầu trên nhánh `feature/admin-backend-database`.
- Summary và Google authentication đã triển khai; RBAC được lưu trong database Admin.

## Query chung dự kiến

```text
from=YYYY-MM-DD&to=YYYY-MM-DD&timezone=Asia/Ho_Chi_Minh
```

Endpoint snapshot hiện tại chưa nhận các query này. Khi triển khai bộ lọc, Backend phải validate ngày, `from <= to`, timezone cho phép và giới hạn khoảng truy vấn.

## Business Summary cũ — không dùng trong backend độc lập

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

Contract Overview dưới đây thuộc nhánh thử nghiệm trước trong `TroOi-Project` và không phải endpoint của backend Admin độc lập. Giữ lại để tham khảo quy tắc payer; không để frontend mới phụ thuộc endpoint này.

## Manual Entry API hiện có

```text
POST  /api/v1/admin/statistics/entries
GET   /api/v1/admin/statistics/entries
GET   /api/v1/admin/statistics/entries/:id
PATCH /api/v1/admin/statistics/entries/:id
GET   /api/v1/admin/statistics/summary
```

### Tạo bản ghi

```json
{
  "metricKey": "META_REACH",
  "source": "META_BUSINESS_SUITE",
  "scopeKey": "fanpage-main",
  "value": 1250,
  "unit": "COUNT",
  "periodStart": "2026-10-01",
  "periodEnd": "2026-10-07",
  "timezone": "Asia/Ho_Chi_Minh",
  "verification": "MANUAL_VERIFIED",
  "note": "Đối soát Meta Business Suite tuần 1"
}
```

Client không gửi `createdByUserId`, `createdAt`, `updatedByUserId` hoặc `updatedAt`; Backend lấy actor từ token và tự tạo timestamp.

### Quy tắc response/lỗi

- `201 Created`: tạo thành công.
- `200 OK`: đọc hoặc sửa thành công.
- `400 Bad Request`: enum, value, date, unit hoặc note không hợp lệ.
- `401 Unauthorized`: token thiếu/sai/hết hạn.
- `403 Forbidden`: user không phải Admin.
- `404 Not Found`: entry không tồn tại.
- `409 Conflict`: trùng metric/source/scope/period/timezone.

Danh sách hỗ trợ filter theo metric, source, verification và period. Phân trang phải được bổ sung nếu dataset có thể tăng; không trả vô hạn toàn bộ bảng.

### Lỗi

- `401 Unauthorized`: thiếu token, token sai hoặc token hết hạn.
- `403 Forbidden`: đã xác thực nhưng không phải System Admin.
- `400 Bad Request`: dành cho date range/timezone khi bộ lọc này được triển khai; endpoint snapshot hiện tại chưa nhận query đó.
- `500 Internal Server Error`: lỗi không mong đợi; không trả stack trace hoặc secret.

Error body dùng format chung hiện có của `TroOi-Project`; không tạo format riêng chỉ cho module Statistics.

## Authentication dependency

Backend xác minh Google ID token thật, ánh xạ identity sang cùng `user_id` của app Trọ Ơi, sau đó
đọc `admin_accounts`, roles và permissions trong database Admin. `VIEWER` chỉ có
`analytics:read`; `EDITOR` có thêm `analytics:write`; `SUPER_ADMIN` có toàn bộ quyền.

Chỉ kiểm tra chuỗi `Bearer ` không được coi là authentication.

