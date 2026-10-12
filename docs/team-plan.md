# Kế hoạch nhóm 4 người

## Việc chung trước khi code

- Chốt mapping payment → user.
- Chốt các giá trị `verification` được xem là thành công.
- Review và duyệt API contract.
- Chỉ bắt đầu query `payingUsers` sau khi hai quyết định trên được ghi vào `statistics-definitions.md`.

## Người 1 - Frontend

Nhánh: `feature/admin-frontend`

- Khởi tạo React + TypeScript + Vite.
- Login/logout theo luồng Backend hiện có.
- Protected Overview với bốn KPI.
- Dùng native `fetch`; chưa cần chart library.
- Loading, empty, 401, 403 và API-error state.
- Unit/component tests và README frontend.

## Người 2 - Authentication và API

Nhánh: `feature/admin-statistics-api`

- Xác minh Google ID token thật và gắn user vào request.
- Tạo `AdminGuard` dùng `ADMIN_USER_IDS` cho MVP.
- Tạo Admin Statistics module và Summary endpoint.
- Swagger, unit tests và test 401/403/200.

## Người 3 - Data

Nhánh: `feature/statistics-data`

- Lập data mapping KPI → table → column → filter.
- Chốt payer mapping với nhóm.
- Viết query count tại PostgreSQL, không load tất cả record vào memory.
- Fixtures: database rỗng, chưa trả, nhiều payment, void/reverse, nhiều participant.
- Đối soát kết quả bằng tay.

## Người 4 - Integration và QA

Nhánh: `feature/admin-integration-qa`

- Docker/PostgreSQL, migration và seed reproducible.
- E2E cho 401, 403, 200 và dataset biên.
- Đối soát database ↔ API ↔ frontend.
- CI: lint, typecheck, test và build cho frontend/backend.
- Kiểm tra secret, CORS, token logging và dữ liệu cá nhân.
- Demo script và checklist bàn giao.

## Thứ tự merge

```text
root/docs
  → statistics-data
  → admin-statistics-api
  → admin-frontend
  → admin-integration-qa
```

Mỗi PR phải có reviewer khác và CI pass. Không code trực tiếp trên `main`.

