# Thiết kế nhập số liệu thủ công

Tài liệu này là thiết kế MVP để Backend và Frontend thống nhất trước khi code. Tên bảng/field cuối cùng phải theo convention của `TroOi-Project`.

## Bản ghi đề xuất

| Field | Ý nghĩa | Quy tắc |
|---|---|---|
| `entryId` | ID bản ghi | Backend tạo, không cho client chọn |
| `metricKey` | KPI | Thuộc allowlist |
| `source` | Nguồn đọc số | Thuộc allowlist |
| `scopeKey` | Page/campaign/app/property nếu cần | Có thể nullable |
| `value` | Giá trị | Số không âm |
| `unit` | count/percent/currency | Phải phù hợp KPI |
| `periodStart` | Ngày bắt đầu | ISO date |
| `periodEnd` | Ngày kết thúc | ISO date, không nhỏ hơn start |
| `timezone` | Múi giờ báo cáo | Mặc định `Asia/Ho_Chi_Minh` |
| `verification` | Mức độ tin cậy | verified/unverified/demo |
| `note` | Giải thích/tham chiếu | Giới hạn độ dài, không chứa secret |
| `createdByUserId` | Người tạo | Lấy từ token |
| `createdAt` | Thời điểm tạo | Backend/database tạo |
| `updatedByUserId` | Người sửa gần nhất | Lấy từ token |
| `updatedAt` | Thời điểm sửa | Backend/database tạo |

## Allowlist ban đầu

### Metric

```text
LANDING_USERS
LANDING_SESSIONS
LANDING_PAGE_VIEWS
DOWNLOAD_CLICKS
APP_FIRST_OPENS
APP_ACTIVE_USERS
STORE_DOWNLOADS
META_REACH
META_IMPRESSIONS
META_CLICKS
META_SPEND
```

### Source

```text
GA4_CONSOLE
FIREBASE_CONSOLE
GOOGLE_PLAY_CONSOLE
APP_STORE_CONNECT
META_BUSINESS_SUITE
MANUAL_OTHER
```

### Verification

```text
MANUAL_VERIFIED
MANUAL_UNVERIFIED
DEMO
```

Không thêm key mới chỉ từ frontend. Mọi key mới phải được bổ sung đồng thời vào docs, backend validation, OpenAPI và tests.

## Quy tắc trùng dữ liệu

Nhóm cần chốt một bản ghi duy nhất cho tổ hợp:

```text
metricKey + source + scopeKey + periodStart + periodEnd + timezone
```

Khuyến nghị MVP: nếu tổ hợp đã tồn tại, API POST trả `409 Conflict`; người dùng phải dùng PATCH để sửa. Cách này tránh âm thầm cộng hoặc tạo bản ghi trùng.

## Quy tắc summary

- Không cộng các period chồng lấn nếu KPI không có tính cộng dồn rõ ràng.
- `DEMO` không xuất hiện trong chế độ số liệu thật.
- `MANUAL_UNVERIFIED` phải có nhãn cảnh báo; nhóm cần chốt có đưa vào tổng hay không.
- Summary phải trả source/period/status để frontend giải thích số liệu.
- Accounts/payments tự động từ database không ghi lại thành manual entry.

## Sửa và xóa

- MVP cần PATCH và lưu audit fields.
- Không hard-delete nếu nhóm cần lịch sử; có thể bổ sung archive/void sau khi xác nhận nhu cầu.
- Không triển khai DELETE chỉ để tiện demo nếu chưa chốt yêu cầu phục hồi/audit.

## Validation tại trust boundary

- Client không được gửi actor ID đáng tin cậy.
- Backend không nhận enum ngoài allowlist.
- Value phải finite và không âm; currency cần quy tắc decimal rõ ràng.
- Date phải hợp lệ và start không sau end.
- Note phải giới hạn độ dài.
- Scope phải phù hợp source/KPI nếu metric yêu cầu Page/campaign.

## Trạng thái triển khai

Thiết kế này chưa phải schema đã tồn tại. Backend chỉ được đánh dấu hoàn thành sau khi migration, API, Swagger và PostgreSQL integration tests đều có bằng chứng pass.
