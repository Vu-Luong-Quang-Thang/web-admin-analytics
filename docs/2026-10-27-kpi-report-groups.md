# Worklog: Phân nhóm KPI trên dashboard

Ngày thực hiện: 27/10/2026  
Phạm vi: Web Admin Analytics - giao diện tổng quan KPI

## Mục tiêu

Giảm cảm giác rối khi nhiều KPI thuộc các nguồn và giai đoạn khác nhau cùng xuất hiện trong một lưới. Không thay đổi dữ liệu, API, công thức tổng hợp hoặc quy trình nhập số liệu.

## Thay đổi

- Chia thẻ KPI thành năm nhóm theo thứ tự: Landing Page, Facebook, TikTok, Ứng dụng và Doanh thu.
- Chỉ hiển thị một nhóm khi kỳ báo cáo có KPI thuộc nhóm đó.
- Dùng `metricKey` để nhận diện KPI landing page, TikTok và doanh thu.
- Dùng `source` để phân biệt các KPI mạng xã hội có cùng loại chỉ số giữa Facebook và TikTok.
- Với `DOWNLOAD_CLICKS`, dùng `scopeKey` chứa `landing` để đặt bản ghi vào Landing Page; các bản ghi còn lại thuộc Ứng dụng.
- Hiển thị tên nguồn thân thiện từ catalog khi bản ghi không có `scopeKey`.
- Giữ lưới tự co giãn và cấu trúc heading có nhãn truy cập được cho từng nhóm.

## Tệp thay đổi

- `frontend/src/App.tsx`
- `frontend/src/styles.css`

## Xác minh local

- `npm run typecheck`: đạt.
- `npm run build`: đạt với Vite 7.3.7, 33 module được chuyển đổi.
- `git diff --check`: đạt, không có lỗi whitespace.

## Triển khai

Repository dùng Render Blueprint. Dịch vụ `web-admin-analytics` chạy dưới dạng static site với lệnh build `cd frontend && npm ci && npm run build`. Commit được push lên `main` để kích hoạt Auto-Deploy; cần xác minh trạng thái triển khai và phản hồi HTTP của frontend sau khi push.
