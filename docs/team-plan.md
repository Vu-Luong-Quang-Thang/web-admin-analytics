# Kế hoạch nhóm 4 người

## Việc chung trước khi code

- Chốt mapping payment → user.
- Chốt các giá trị `verification` được xem là thành công.
- Tạo GA4 property/data stream và quy ước UTM.
- Tạo Firebase project/app và danh sách event.
- Xác minh trạng thái publish store và quyền Meta Page/Ad Account.
- Review và duyệt API contract.
- Chỉ bắt đầu query `payingUsers` sau khi hai quyết định trên được ghi vào `statistics-definitions.md`.

## Người 1 - Frontend

Nhánh: `feature/admin-frontend`

- Khởi tạo React + TypeScript + Vite.
- Login/logout theo luồng Backend hiện có.
- Protected Overview và các section Landing, App, Business, Marketing.
- Dùng native `fetch`; chỉ thêm chart library khi biểu đồ đã được chốt.
- Hiển thị source status và phân biệt zero/empty/not connected/error.
- Loading, empty, 401, 403 và API-error state.
- Unit/component tests và README frontend.

## Người 2 - Authentication và API

Nhánh: `feature/admin-statistics-api`

- Xác minh Google ID token thật và gắn user vào request.
- Tạo `AdminGuard` dùng `ADMIN_USER_IDS` cho MVP.
- Tạo Analytics module, date-range validation và các endpoint đã chốt.
- Adapter phía server cho GA4, Firebase, Meta và Store; secret chỉ ở Backend.
- Timeout/cache/error isolation để một nguồn lỗi không làm mất toàn bộ dashboard.
- Swagger, unit tests và test 401/403/200.

## Người 3 - Data

Nhánh: `feature/statistics-data`

- Lập data mapping KPI → table → column → filter.
- Chốt payer mapping với nhóm.
- Viết query count tại PostgreSQL, không load tất cả record vào memory.
- Fixtures: database rỗng, chưa trả, nhiều payment, void/reverse, nhiều participant.
- Đối soát kết quả bằng tay.
- Thiết kế bảng snapshot/sync log chỉ khi API ngoài cần cache; không sao chép dữ liệu nghiệp vụ thành nguồn chính thứ hai.

## Người 4 - Integration và QA

Nhánh: `feature/admin-integration-qa`

- Docker/PostgreSQL, migration và seed reproducible.
- E2E cho 401, 403, 200 và dataset biên.
- Đối soát database ↔ API ↔ frontend.
- Đối soát GA4/Firebase/Meta/Store với dashboard nguồn trong cùng ngày và timezone.
- Test token thiếu/hết hạn, quota, timeout, stale cache và partial failure.
- CI: lint, typecheck, test và build cho frontend/backend.
- Kiểm tra secret, CORS, token logging và dữ liệu cá nhân.
- Demo script và checklist bàn giao.

## Thứ tự merge

```text
root/docs
  → tracking-landing-app
  → statistics-data + analytics-integrations
  → admin-analytics-api
  → admin-frontend
  → admin-integration-qa
```

Mỗi PR phải có reviewer khác và CI pass. Không code trực tiếp trên `main`.

