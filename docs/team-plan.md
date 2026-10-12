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

## Người 2 - Backend Analytics và Database (Thắng)

Nhánh: `feature/admin-analytics-api`

- Khảo sát authentication và luồng identity hiện tại của `TroOi-Project`.
- Xác minh Google ID token thật và gắn user vào request.
- Tạo `AdminGuard` dùng `ADMIN_USER_IDS` cho MVP.
- Tạo Analytics module, date-range validation và các endpoint đã chốt.
- Khảo sát schema và lập mapping KPI → table → column → filter.
- Chốt mapping payment → user và các giá trị `verification` thành công với cả nhóm.
- Viết query/repository cho accounts, paying users, successful payments và conversion rate.
- Chuẩn bị migration/index chỉ khi có nhu cầu được xác minh.
- Chuẩn bị seed/fixtures và đối soát kết quả SQL bằng tay.
- Trả dữ liệu tài khoản, paying users, successful payments và conversion rate theo API contract.
- Viết adapter phía server cho GA4, Firebase, Meta và Store; secret chỉ ở Backend.
- Timeout/cache/error isolation để một nguồn lỗi không làm mất toàn bộ dashboard.
- Trả source status `CONNECTED`, `STALE`, `ERROR`, `NOT_CONNECTED` hoặc `NOT_AVAILABLE`.
- Swagger, unit test, integration test và test 400/401/403/200/502.

### Sản phẩm bàn giao của Thắng

- Admin authentication/authorization hoạt động đúng.
- Analytics API đúng contract và không lộ secret.
- Dữ liệu PostgreSQL được lấy qua repository, không viết SQL trong controller.
- Query không đếm trùng payer, không tính payment void/reverse và có fixture chứng minh.
- Kết quả SQL trực tiếp khớp với response của API.
- GA4/Firebase/Meta/Store được tích hợp qua adapter tách biệt.
- Khi nguồn ngoài chưa có quyền, API trả trạng thái trung thực thay vì dữ liệu Demo.
- Swagger và test chính đều pass.

## Người 3 - Tracking và External Data

Nhánh: `feature/analytics-tracking`

- Gắn GA4 và custom event click tải app vào Landing Page.
- Thiết lập quy ước UTM cho từng fanpage/campaign.
- Gắn Firebase Analytics và các app event đã chốt.
- Kiểm tra dữ liệu trên GA4/Firebase DebugView trước khi bàn giao.
- Phối hợp xin Page/Ad Account/token/quyền Meta và quyền Store.
- Bàn giao property/app/page/account ID và danh sách metric cho Thắng; không commit credential.

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

