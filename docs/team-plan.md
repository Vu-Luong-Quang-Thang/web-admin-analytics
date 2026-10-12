# Kế hoạch nhóm — MVP nhập số liệu thủ công

## Cơ cấu

Nhóm gồm ba người kỹ thuật và một người quản lý Facebook Page.

| Vai trò | Nhánh | Repository |
|---|---|---|
| Frontend Web Admin | `feature/admin-frontend` | `web-admin-analytics` |
| Backend + Database — Thắng | `feature/admin-backend-database` | `web-admin-analytics` |
| Data + Integration + QA/DevOps | `feature/analytics-integration` | Các repo liên quan |
| Page Operations | `docs/page-operations` | `web-admin-analytics` |

## Quyết định chung phải chốt trước khi code

- Danh sách `metricKey` và đơn vị của từng KPI.
- Nguồn nào được phép cho từng KPI.
- Nhập theo ngày, tuần hay khoảng tùy chọn.
- Quy tắc bản ghi trùng: từ chối, sửa bản cũ hay tạo version mới.
- Ai được quyền xác nhận `MANUAL_VERIFIED`.
- Dữ liệu nào được phép xuất hiện trong tổng hợp chính.
- Quy tắc payer; trong lúc chưa chốt, `payingUsers` và `conversionRate` là `null`.

---

## 1. Frontend Web Admin

### Mục tiêu

Tạo giao diện để Admin nhập, kiểm tra và xem số liệu mà không cần thao tác trực tiếp với database.

### Công việc

- Khởi tạo/duy trì React + TypeScript + Vite với dependency tối thiểu.
- Tạo login/logout và protected routes.
- Viết API client sử dụng `VITE_API_BASE_URL` và Bearer token.
- Tạo form nhập:
  - KPI;
  - nguồn;
  - giá trị;
  - ngày bắt đầu/kết thúc;
  - trạng thái đối soát;
  - ghi chú.
- Hiển thị validation cạnh field và thông báo lỗi dễ hiểu.
- Tạo danh sách/lịch sử bản ghi, bộ lọc và trang sửa.
- Tạo dashboard KPI/biểu đồ theo contract đã chốt.
- Hiển thị source, period, verification, người cập nhật và `updatedAt`.
- Gắn nhãn nổi bật cho `DEMO` và `MANUAL_UNVERIFIED`.
- Với `payingUsers: null`, hiển thị **Chưa xác định**, không hiển thị `0`.
- Xử lý loading, empty, zero, network error, `401` và `403`.
- Không hard-code số liệu, không gọi PostgreSQL và không giữ service credential.

### Tests

- Form hợp lệ gửi đúng payload.
- Field sai hiển thị lỗi.
- `401` yêu cầu đăng nhập lại; `403` hiển thị không có quyền.
- Trạng thái demo/unverified hiển thị đúng.
- Loading, empty, zero và API failure.

### Bàn giao

- Form nhập/sửa và danh sách hoạt động với API thật.
- Dashboard responsive.
- Component tests, lint, typecheck và production build pass.
- README frontend ghi biến môi trường và lệnh chạy.

---

## 2. Backend + Database — Thắng

### Mục tiêu

Lưu số liệu thủ công an toàn, có validation/audit và cung cấp API cho frontend.

### Database

- Thiết kế bảng manual statistic entries theo `manual-entry-design.md`.
- Tạo migration có rollback phù hợp với quy ước repo.
- Dùng allowlist/constraint cho `metric_key`, `source` và `verification` nếu schema hiện tại hỗ trợ hợp lý.
- Lưu `created_by_user_id`, `created_at`, `updated_by_user_id`, `updated_at`.
- Chốt unique rule để ngăn bản ghi trùng.
- Chỉ thêm index phục vụ query đã có nhu cầu.
- Tạo fixtures: rỗng, hợp lệ, trùng, zero, demo, unverified và nhiều period.

### Backend API

- Duy trì CRUD API manual entries trong repo Admin.
- Xây CRUD API cho manual entries theo contract.
- Backend tự lấy actor từ authenticated principal; không tin `createdBy` do client gửi.
- Validate số không âm, ngày, allowlist, độ dài note và duplicate rule.
- Trả `400` cho payload sai, `401` cho token sai/thiếu, `403` cho non-admin và `404` cho entry không tồn tại.
- Xây summary aggregate tại PostgreSQL sau khi chốt quy tắc period; không tải toàn bộ row lên memory để đếm.
- Chỉ dùng bản ghi được phép trong summary; không trộn `DEMO` vào số liệu thật.
- Không log token, credential hoặc PII không cần thiết.
- Cập nhật Swagger/OpenAPI cùng lúc với code.

### Tests

- Unit tests validation/service.
- PostgreSQL integration tests cho migration, CRUD, duplicate và aggregate.
- HTTP tests cho 400/401/403/404/200/201.
- Test actor spoofing, date đảo ngược, value âm và enum sai.
- Test `DEMO` không bị trình bày như verified data.

### Bàn giao

- Migration + rollback và schema documentation.
- CRUD/summary API có Swagger.
- Unit/integration/HTTP tests pass.
- SQL/API khớp trên dataset đối soát.
- README backend ghi cách chạy và giới hạn.

---

## 3. Data + Integration + QA/DevOps

### Mục tiêu

Định nghĩa KPI, chuẩn bị dữ liệu và chứng minh số trên dashboard khớp nguồn.

### Công việc dữ liệu

- Lập KPI catalog: key, tên hiển thị, đơn vị, nguồn, cách lấy và giới hạn.
- Chốt period/timezone và duplicate rule cùng Backend.
- Chuẩn bị dataset có số thật nếu có quyền; nếu không, gắn `DEMO`.
- Không sửa trực tiếp PostgreSQL; nhập qua form/API.
- Đối soát dashboard nguồn → entry API → dashboard Admin.
- Lưu bằng chứng an toàn; không commit screenshot/token nhạy cảm.

### QA/DevOps

- Thiết lập CI: install, lint, typecheck, test và build.
- E2E cho login, thêm, sửa, xem danh sách, filter và dashboard.
- Kiểm tra validation, duplicate, permission và audit fields.
- Kiểm tra CORS, `.env.example` và cấu hình local/deploy.
- Quét secret/token logging và PII.
- Chuẩn bị test report, deployment checklist, rollback note và demo script.

### Bàn giao

- KPI catalog và dataset nghiệm thu.
- Biên bản đối soát từng KPI.
- CI/E2E pass.
- Test report và demo script.

---

## 4. Page Operations

Vai trò này không cần code.

### Công việc

- Chốt Page, campaign và khoảng thời gian cần báo cáo.
- Đọc reach, impressions, clicks và spend từ Meta Business Suite/Ads Manager.
- Ghi đúng Page/campaign/source/period.
- Nhập qua Admin Page hoặc bàn giao phiếu số liệu cho Data/QA.
- Đánh dấu verified chỉ sau khi so sánh lại với Meta.
- Báo khi số bị chỉnh sửa hoặc phạm vi campaign thay đổi.
- Không gửi/commit Meta access token.

### Bàn giao

- Page/campaign inventory.
- Phiếu số liệu theo period.
- Xác nhận đối soát cho demo/nghiệm thu.

---

## Thứ tự thực hiện

1. Cả nhóm chốt KPI catalog, trạng thái và duplicate rule.
2. Backend tạo migration + CRUD contract; Frontend dựng form theo contract.
3. Data/QA chuẩn bị dataset; Page Manager cung cấp số Meta.
4. Frontend kết nối API thật; Backend hoàn thiện summary.
5. QA đối soát nguồn → API → UI và chạy CI/E2E.
6. Mỗi phần mở PR, reviewer khác duyệt, CI pass rồi mới merge.

## Phụ thuộc

```text
KPI catalog + duplicate rule
             |
             v
Database schema + API contract
             |
       +-----+-----+
       v           v
Backend CRUD   Frontend form
       +-----+-----+
             v
 Dataset + đối soát
             v
 Dashboard + E2E + demo
```

## Definition of Done toàn dự án

- Có thể thêm/sửa/xem số liệu qua UI, không sửa database thủ công.
- Mỗi số có source, period, verification và audit fields.
- Dữ liệu demo được nhận biết rõ.
- Auth, validation và error handling đầy đủ.
- API, PostgreSQL và UI khớp dataset nghiệm thu.
- Lint, typecheck, unit/integration/E2E và build pass.
- Không có secret trong code, repository hoặc log.
- Docs local/deploy/demo đầy đủ và mỗi PR có reviewer khác.
