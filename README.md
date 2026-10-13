# TrọƠi Web Admin Analytics

Web Admin nội bộ cho phép nhóm **nhập số liệu thủ công có kiểm soát** và xem dashboard tổng hợp. MVP không tự động đồng bộ GA4, Firebase, Meta hoặc Store theo thời gian thực.

## Cách hệ thống hoạt động

```text
Người phụ trách mở dashboard nguồn
  (GA4 / Firebase / Meta / Store)
              |
              | đọc và đối soát số liệu
              v
web-admin-analytics/frontend
              |
              | HTTP + Bearer token
              v
web-admin-analytics/backend
              |
              | validate + audit
              v
PostgreSQL: manual statistic entries
              |
              v
Dashboard đọc API và hiển thị
```

Frontend không kết nối trực tiếp PostgreSQL. Không copy thư mục `src` giữa hai repository và không hard-code KPI vào giao diện.

## Repository

- `web-admin-analytics/backend`: API, validation, audit và database access.
- `web-admin-analytics/database`: migration PostgreSQL riêng của Admin.
- `web-admin-analytics/frontend`: React/Vite form nhập liệu, KPI và lịch sử.
- `render.yaml`: blueprint deploy API + PostgreSQL; frontend có thể deploy dạng static site.

`TroOi-Project` chỉ được clone để tham khảo cấu trúc/dữ liệu được phép; không commit code Admin vào repo đó và không copy toàn bộ `src`. `TroOi-Landing-Page`, GA4, Firebase, Meta Business Suite và Store Console chỉ là nơi đọc số liệu gốc.

## Phân chia công việc

| Vai trò | Nhánh | Trách nhiệm chính |
|---|---|---|
| Frontend Web Admin | `feature/admin-frontend` | Form nhập liệu, lịch sử, dashboard và API client |
| Backend + Database (Thắng) | `feature/admin-backend-database` | Migration, CRUD API, validation, auth và audit |
| Data + QA/DevOps | `feature/analytics-integration` | KPI catalog, dataset, đối soát, CI và E2E |
| Page Operations | `docs/page-operations` | Lấy số Meta, ghi nguồn và xác nhận kết quả |
| Tài liệu chung | `root/docs` | Contract và quyết định đã được nhóm duyệt |

Chi tiết từng đầu việc, bàn giao và tiêu chí nghiệm thu nằm trong `docs/team-plan.md`.

## Phạm vi MVP

### Nhập thủ công

- Social organic: reach và content views của Facebook/TikTok.
- Landing: users, sessions, page views và download clicks.
- App: store installs, first opens, active users và registrations.
- Attribution: installs/registrations xác định được nguồn Facebook, TikTok hoặc chiến dịch.
- Funnel chính: social reach → Landing users → download clicks → store installs → registrations.
- Paid Ads và payment không thuộc phạm vi hiện tại; metric cũ chỉ được giữ để tương thích dữ liệu.
- Có thể nhập dữ liệu mẫu, nhưng bắt buộc gắn trạng thái `DEMO`.

### Dữ liệu từ app gốc

Trong MVP độc lập, không kết nối trực tiếp database TroOi. Accounts/payments chỉ được import thủ công hoặc dùng dataset đã loại dữ liệu nhạy cảm sau khi nhóm chốt quy tắc. Không trình bày dữ liệu tham khảo là dữ liệu live.

## Trạng thái bản ghi thủ công

- `MANUAL_VERIFIED`: đã đối soát với dashboard nguồn.
- `MANUAL_UNVERIFIED`: đã nhập nhưng chưa đối soát.
- `DEMO`: dữ liệu mẫu phục vụ phát triển/trình diễn.

Dashboard phải hiển thị rõ trạng thái. Không trình bày `DEMO` như dữ liệu thật.

## Dữ liệu tối thiểu của một bản ghi

```text
metricKey       KPI nào
source          lấy từ đâu
value           giá trị
periodStart     ngày bắt đầu
periodEnd       ngày kết thúc
verification    trạng thái đối soát
note            ghi chú/bằng chứng không bí mật
createdBy       người nhập
createdAt       thời điểm tạo
updatedAt       thời điểm sửa gần nhất
```

## API

Đã triển khai và được tích hợp trên nhánh `feature/admin-mvp-integration`:

```http
POST  /api/v1/admin/statistics/entries
GET   /api/v1/admin/statistics/entries
GET   /api/v1/admin/statistics/entries/:id
PATCH /api/v1/admin/statistics/entries/:id
GET   /api/v1/admin/statistics/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
```

Production dùng Google account của app Trọ Ơi. Database Admin liên kết `trooi_user_id` và quản lý
role `SUPER_ADMIN`, `EDITOR`, `VIEWER`, `SYNC_MANAGER`; backend kiểm tra permission trước mỗi API.
Local token chỉ dành cho môi trường phát triển và không hoạt động trong production.

## Validation bắt buộc

- `value` là số không âm.
- `periodStart <= periodEnd`.
- `metricKey`, `source` và `verification` thuộc allowlist.
- Không tạo hai bản ghi cùng metric, source, phạm vi và khoảng thời gian nếu chưa xác định rõ quy tắc thay thế.
- Chỉ Admin được thêm/sửa; mọi bản ghi lưu người thực hiện và thời điểm.
- Không nhận `createdBy` từ client; Backend lấy từ user đã xác thực.

## Quy tắc làm việc

- Không code trực tiếp trên `main` hoặc `root/docs`.
- Không commit `.env`, token, credential, ảnh chứa token hoặc dữ liệu người dùng thật.
- Mỗi PR cần ít nhất một reviewer khác và CI pass.
- Người nhập số phải ghi nguồn và khoảng thời gian để người khác đối soát được.
- Không tự động hóa GA4/Firebase/Meta/Store trong MVP trừ khi nhóm thay đổi scope bằng tài liệu mới.

## Tài liệu

- `docs/mvp-scope.md`: phạm vi bắt buộc và phần được hoãn.
- `docs/statistics-definitions.md`: định nghĩa KPI.
- `docs/statistics-api-contract.md`: API hiện có và API dự kiến.
- `docs/team-plan.md`: phân công chi tiết.
- `docs/data-sources.md`: cách lấy và xác minh số liệu.
- `docs/manual-entry-design.md`: thiết kế dữ liệu, luồng nhập/sửa và validation.
- `docs/local-development.md`: chạy hai repository trên máy.
- `docs/future-automatic-sync.md`: lộ trình chuyển từ nhập tay sang scheduled/realtime sync.
