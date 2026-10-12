# Phạm vi MVP nhập số liệu thủ công

## Mục tiêu

Admin đăng nhập, nhập số liệu lấy từ các dashboard nguồn, lưu vào PostgreSQL và xem kết quả trên Web Admin. Hệ thống không yêu cầu cập nhật thời gian thực.

## Bắt buộc

- React + TypeScript frontend tách khỏi Landing Page.
- Backend xác minh token và phân biệt `401`/`403`.
- Form thêm và sửa số liệu thủ công.
- Danh sách lịch sử bản ghi và người cập nhật.
- Dashboard tổng hợp theo KPI và khoảng thời gian.
- PostgreSQL lưu dữ liệu; frontend không hard-code KPI values.
- Validation, audit fields và phân biệt verified/unverified/demo.
- Swagger, unit test, database integration test và E2E cơ bản.
- Dataset đối soát được bằng tay với nguồn gốc.

## Nguồn dữ liệu

- Người phụ trách đọc GA4, Firebase, Meta Business Suite hoặc Store Console rồi nhập số.
- Accounts/payments có thể query trực tiếp từ database app; không nhập lại nếu query hiện có đã đáp ứng.
- Nếu chưa có dữ liệu thật, dùng `DEMO` và hiển thị nhãn rõ ràng.

## Được hoãn

- GA4 Data API, Firebase Analytics API, Meta Graph/Marketing API.
- Google Play Developer API và App Store Connect API.
- Đồng bộ thời gian thực, polling, webhook, quota, cache nguồn ngoài.
- Kho dữ liệu/ETL, dự đoán và attribution xuyên thiết bị.

## Kiến trúc

```text
Nguồn số liệu → người nhập → Admin form → Backend API → PostgreSQL → Dashboard
```

## Definition of Done

- Admin thêm/sửa/xem được bản ghi; user thường không có quyền.
- Dữ liệu sai bị từ chối bằng lỗi dễ hiểu.
- Dashboard hiển thị nguồn, khoảng thời gian, trạng thái và thời điểm cập nhật.
- `DEMO` không bị nhầm với dữ liệu thật.
- API/database/UI cho cùng kết quả trên dataset nghiệm thu.
- Build, lint, typecheck, unit/integration/E2E tests pass.
- Không có secret hoặc credential trong repository/log.
- Có hướng dẫn chạy local và ít nhất một reviewer khác duyệt PR.
