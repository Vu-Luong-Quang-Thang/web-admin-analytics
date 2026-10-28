# Live finance metrics through @DuyAnh tunnel — 2026-10-28

## Phạm vi

Web Admin chuyển ba KPI từ nhập tay sang dữ liệu được tổng hợp tại thời điểm gọi API:

- `APP_ACTIVE_USERS`
- `APP_PAYING_USERS`
- `APP_REVENUE`

Các KPI Landing Page, Facebook, TikTok, Store, Firebase và các chỉ số khác tiếp tục dùng luồng
nhập thủ công hiện tại. `APP_TRANSACTIONS` chưa chuyển sang nguồn live trong thay đổi này.

## Kiến trúc

`Frontend Render -> backend Web Admin local -> HTTPS tunnel @DuyAnh -> finance-backend -> trooi_finance`

- Frontend chỉ gọi backend Web Admin đang được public bằng tunnel riêng.
- Backend Web Admin gọi `TROOI_FINANCE_API_URL` theo kiểu server-to-server.
- Chỉ `finance-backend` truy vấn `trooi_finance`.
- Không có connection string PostgreSQL trong frontend và không public cổng database.
- Service token chỉ nằm trong environment của hai backend.

## Hợp đồng dữ liệu

Backend Web Admin gọi:

`GET {TROOI_FINANCE_API_URL}/api/v1/admin/statistics/revenue?from=...&to=...`

với header `x-admin-analytics-token`. Response được chuyển thành ba entry `LIVE_API`, nguồn
`TROOI_DATABASE`, đúng kỳ người dùng đang chọn.

Summary loại các bản ghi thủ công của đúng ba metric live để tránh cộng/hiển thị trùng. Dữ liệu
lịch sử vẫn còn trong bảng `manual_statistic_entries`; thay đổi này không xóa bản ghi.

Form nhập tay ẩn ba metric live và backend cũng từ chối POST/PATCH chúng tại trust boundary.

## Khi tunnel hoặc finance-backend không khả dụng

Backend vẫn trả các KPI thủ công khác. Ba KPI live bị loại khỏi response và trường `live` có
trạng thái `unavailable`; frontend hiển thị cảnh báo thay vì dùng số thủ công cũ như thể đó là
dữ liệu trực tiếp.

Web Admin không dùng push channel. Mỗi lần tải/làm mới hoặc đổi kỳ báo cáo sẽ gọi API lại.

## Biến môi trường

Backend Web Admin:

- `TROOI_FINANCE_API_URL=https://crystal-records-singles-maker.trycloudflare.com`
- `TROOI_FINANCE_API_TOKEN=<secret dài ít nhất 32 ký tự>`

Máy @DuyAnh chạy `finance-backend`:

- `ADMIN_ANALYTICS_API_TOKEN` phải bằng `TROOI_FINANCE_API_TOKEN`.

Không commit giá trị token thật. File `backend/.env` local đã được `.gitignore` loại trừ.

## Kiểm tra đã chạy

- Backend `npm run typecheck`: đạt.
- Backend unit tests: 9 đạt, 2 PostgreSQL integration tests bị skip theo cấu hình test runner.
- Backend `npm run build`: đạt.
- Frontend `npm run typecheck`: đạt.
- Frontend `npm run build`: đạt.

Xác minh end-to-end qua tunnel phụ thuộc máy @DuyAnh pull/rebuild `finance-backend` và cấu hình
cùng service token. Trước bước đó, tunnel health có thể `ok` nhưng route tổng hợp mới chưa tồn tại.
