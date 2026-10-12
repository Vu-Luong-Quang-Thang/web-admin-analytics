# Phạm vi MVP

## Mục tiêu

Admin đăng nhập an toàn và xem dữ liệu thật của bốn nhóm:

1. Landing: visitors, sessions, page views, click tải app và nguồn/UTM.
2. App: downloads hoặc proxy được gắn nhãn, first opens và active users.
3. Business: tổng tài khoản, paying users, successful payments và conversion rate.
4. Marketing: reach, impressions, clicks và fanpage/campaign.

## Bắt buộc

- Frontend React + TypeScript + Vite tách khỏi Landing Page.
- Backend xác minh token thật và phân biệt 401/403.
- GA4 cho Landing Page và UTM campaign.
- Firebase Analytics cho app opens, active users và app events.
- Backend/PostgreSQL cho tài khoản và thanh toán.
- Meta Graph/Marketing API cho reach, impressions, clicks và fanpage/campaign khi có quyền.
- Play Console/App Store Connect cho download chính thức khi app đã phát hành.
- Analytics API tích hợp các nguồn; frontend không giữ secret.
- Loading, empty và error state.
- Swagger, unit test và integration test.
- Dataset có thể đối soát bằng tay giữa database, API và giao diện.

## Triển khai theo giai đoạn

### Giai đoạn 1 - Core

- Authentication/authorization, layout, date filter và source status.
- User/payment statistics từ database.
- GA4 Landing Analytics và UTM.
- Firebase App Analytics.

### Giai đoạn 2 - External access

- Store download metrics khi app đã publish và có quyền.
- Meta Analytics khi có Page/Ad Account/token/quyền API.
- Nguồn chưa cấu hình hiển thị `Not connected`, không hiển thị dữ liệu Demo như dữ liệu thật.

### Ngoài phạm vi ban đầu

- TikTok, kho dữ liệu/ETL phức tạp, dự đoán và attribution xuyên thiết bị.

## Kiến trúc

```text
web-admin-analytics
        |
        | HTTPS + Bearer token
        v
TroOi-Project / NestJS Analytics API
   |       |         |          |
Postgres  GA4     Firebase   Meta/Stores
```

Frontend không kết nối trực tiếp PostgreSQL.

## Definition of Done

- Token thiếu/sai trả 401; user thường trả 403; System Admin trả 200.
- Không có dữ liệu hard-code hoặc Demo trong bản bàn giao.
- KPI database khớp giữa truy vấn, API và frontend.
- KPI tích hợp đối chiếu được với dashboard nguồn trong cùng khoảng ngày/múi giờ.
- Mỗi card ghi rõ source, thời điểm cập nhật và trạng thái kết nối.
- Không gọi Firebase `first_open` là download chính thức.
- Build, lint, typecheck và test đều pass.
- Không commit `.env`, token hoặc secret.
- Có README chạy local và ít nhất một reviewer khác duyệt PR.

