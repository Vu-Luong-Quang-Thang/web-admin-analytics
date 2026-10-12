# Phạm vi MVP

## Mục tiêu

Admin đăng nhập an toàn và xem bốn KPI từ dữ liệu thật:

1. Tổng số tài khoản.
2. Số người đã thanh toán.
3. Số giao dịch thành công.
4. Tỷ lệ chuyển đổi từ tài khoản sang người thanh toán.

## Bắt buộc

- Frontend React + TypeScript + Vite tách khỏi Landing Page.
- Backend xác minh token thật và phân biệt 401/403.
- `GET /api/admin/statistics/summary`.
- Loading, empty và error state.
- Swagger, unit test và integration test.
- Dataset có thể đối soát bằng tay giữa database, API và giao diện.

## Chưa thuộc MVP

- GA4, Firebase, Meta/TikTok và Marketing Analytics.
- Landing/App Analytics.
- Trends, date filter và biểu đồ.
- Export CSV/Excel.
- Revenue dashboard và currency.
- Bảng analytics tổng hợp mới.

Những phần trên chỉ được bổ sung sau khi MVP hoàn tất hoặc có yêu cầu xác nhận.

## Kiến trúc

```text
web-admin-analytics
        |
        | HTTPS + Bearer token
        v
TroOi-Project / NestJS
        |
        v
PostgreSQL hiện tại
```

Frontend không kết nối trực tiếp PostgreSQL.

## Definition of Done

- Token thiếu/sai trả 401; user thường trả 403; System Admin trả 200.
- Không có dữ liệu hard-code hoặc Demo trong bản bàn giao.
- Bốn KPI khớp giữa truy vấn database, API và frontend.
- Database rỗng trả về các giá trị 0 hợp lệ.
- Build, lint, typecheck và test đều pass.
- Không commit `.env`, token hoặc secret.
- Có README chạy local và ít nhất một reviewer khác duyệt PR.

