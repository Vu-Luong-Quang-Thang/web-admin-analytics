# Kế hoạch toàn bộ công việc

## Cơ cấu nhóm

Nhóm gồm ba người kỹ thuật và một người quản lý Facebook Fanpage.

| Vai trò | Người phụ trách | Nhánh chính |
|---|---|---|
| Frontend Web Admin | Thành viên Frontend | `feature/admin-frontend` |
| Backend Analytics + Database | Thắng | `feature/admin-analytics-api` |
| Tracking + Integration + QA/DevOps | Thành viên kỹ thuật còn lại | `feature/analytics-integration` |
| Fanpage + Campaign Operations | Người quản lý Page | `docs/page-operations` |

Người quản lý Page không phải là developer, nhưng phải cung cấp quyền, thông tin campaign và xác nhận số liệu Meta.

## Việc cả nhóm phải chốt

- Danh sách KPI bắt buộc và định nghĩa của từng KPI.
- Payment thành công là trạng thái nào và payment được gán cho user nào.
- Date range và timezone `Asia/Ho_Chi_Minh`.
- App đã publish lên Store hay chỉ phát APK.
- GA4 property, Firebase project, Meta Page/Ad Account và người có quyền truy cập.
- Quy ước UTM cho từng Page/campaign.
- Nguồn chưa có quyền hiển thị `NOT_CONNECTED`/`NOT_AVAILABLE`, không dùng số Demo như số thật.

---

## 1. Frontend Web Admin

Repository: `web-admin-analytics`

### Công việc

- Khởi tạo React + TypeScript + Vite; chỉ thêm dependency cần thiết.
- Login/logout, protected routes và xử lý session.
- Layout responsive với Overview, Landing, App, Business, Marketing và Source Status.
- Date filter `from`, `to`, `timezone`.
- KPI cards và biểu đồ/bảng đã chốt.
- Hiển thị source, `updatedAt`, loading, zero, empty, stale, not connected và error.
- 401 chuyển về login; 403 hiển thị không có quyền.
- Không truy cập PostgreSQL trực tiếp và không giữ service credential.
- Viết component tests, lint/typecheck/build và README frontend.

### Bàn giao

- Giao diện responsive kết nối API thật.
- Không còn KPI hard-code trong bản bàn giao.
- Test loading/error/401/403/zero/source-status pass.
- Production build pass.

---

## 2. Backend Analytics + Database - Thắng

Repository: `TroOi-Project`

Nhánh: `feature/admin-analytics-api`. Backend/database được clone hoặc checkout riêng; không copy `src` vào `web-admin-analytics`.

### Authentication và authorization

- Khảo sát luồng identity hiện tại.
- Xác minh Google ID token thật, ánh xạ sang `user_id` và gắn user vào request.
- Tạo `AdminGuard`/policy; MVP có thể dùng `ADMIN_USER_IDS`.
- Trả 401 cho token thiếu/sai/hết hạn và 403 cho user không phải System Admin.

### Database

- Lập mapping KPI → table → column → filter → giới hạn.
- Chốt payment → user và `verification` thành công cùng nhóm.
- Viết query/repository cho `totalAccounts`, `payingUsers`, `successfulPayments`, `conversionRate` và revenue nếu được chốt.
- Aggregate tại PostgreSQL; không load toàn bộ row vào memory để đếm.
- Không đếm trùng payer và không tính payment void/reverse.
- Fixtures: database rỗng, chưa thanh toán, nhiều payment, void/reverse, nhiều participant, payer không xác định.
- Chỉ thêm migration/index/snapshot/cache/sync-log khi có nhu cầu được xác minh.

### Analytics API

- Duy trì endpoint hiện có `GET /api/v1/admin/analytics/overview` theo `statistics-api-contract.md`.
- Validate date range, timezone và giới hạn khoảng truy vấn.
- Tạo endpoint Overview, Landing, App, Users/Revenue, Marketing và Sources khi dữ liệu sẵn sàng.
- Viết adapter phía server cho GA4, Firebase, Meta và Store; secret chỉ ở Backend.
- Nhận property/app/page/account ID và metric mapping từ người Tracking/Page.
- Timeout, cache và error isolation để một nguồn lỗi không làm mất toàn dashboard.
- Trả `CONNECTED`, `STALE`, `ERROR`, `NOT_CONNECTED` hoặc `NOT_AVAILABLE`.
- Không log token/credential/PII hoặc trả stack trace ra client.
- Swagger, unit tests và integration tests PostgreSQL/API.

### Bàn giao của Thắng

- Admin authentication/authorization hoạt động đúng.
- Data mapping, query/repository, fixtures và migration thực sự cần.
- Analytics API đúng contract và có Swagger.
- GA4/Firebase/Meta/Store adapters tách biệt.
- SQL trực tiếp khớp API trên dataset đối soát.
- Test 400/401/403/200, database rỗng, external timeout/error và partial data pass.

---

## 3. Tracking + Integration + QA/DevOps

Repositories: Landing Page, Mobile App, `web-admin-analytics` và `TroOi-Project`.

### Tracking và số liệu

- Chốt tên, ý nghĩa, công thức, source và giới hạn của từng KPI.
- Phối hợp với Thắng chốt payment thành công và payer mapping.
- Tạo/cấu hình GA4 property/data stream; gắn page tracking và custom event click tải app.
- Tạo/cấu hình Firebase project/app; gắn app events đã chốt.
- Kiểm tra GA4 Realtime/DebugView và Firebase DebugView.
- Xác minh Store access; nếu chỉ phát APK thì tách `downloadClicks` và `firstOpens`.
- Cùng người quản lý Page thiết lập UTM, Page/Ad Account access và Meta metrics.
- Bàn giao tracking plan, IDs và metric mapping cho Thắng; không commit credential.

### Integration, QA và DevOps

- Chuẩn hóa `.env.example`, Docker/PostgreSQL, migration, seed và hướng dẫn local.
- Kiểm tra CORS và cấu hình môi trường.
- Thiết lập CI: install, lint, typecheck, test và build frontend/backend.
- E2E: 401, 403, 200, date/timezone sai, database rỗng, source unavailable và partial failure.
- Test payment void/reverse, payer trùng, token hết hạn, quota, timeout và stale cache.
- Đối soát PostgreSQL/GA4/Firebase/Meta/Store ↔ API ↔ Frontend trong cùng date range/timezone.
- Quét secret, token logging, raw SQL từ input và PII không cần thiết.
- Chuẩn bị test report, deployment checklist, rollback note và demo script.

### Bàn giao

- Tracking plan và event/UTM verification.
- CI workflow và E2E tests.
- Test report và biên bản đối soát từng nguồn.
- README chạy local/deploy và demo script.

---

## 4. Fanpage + Campaign Operations

Vai trò này không cần viết code.

### Công việc

- Xác nhận danh sách Facebook Page, Page ID, Ad Account và campaign cần theo dõi.
- Cấp hoặc phối hợp cấp quyền read-only cần thiết cho tích hợp; không gửi token trong chat/repository.
- Tạo link Landing Page đúng quy ước UTM do người Tracking cung cấp.
- Dùng link UTM đúng cho từng bài đăng/campaign; không tái sử dụng sai nguồn.
- Ghi lại ngày chạy, Page, campaign, ngân sách và mục tiêu để đối soát.
- Xác nhận reach, impressions, clicks và spend trên Meta Business Suite/Ads Manager.
- So sánh số Meta gốc với Admin Page trong cùng date range/timezone.
- Báo ngay khi token/quyền/Page/campaign thay đổi.
- Tham gia nghiệm thu Marketing dashboard và demo.

### Bàn giao

- Danh sách Page/Ad Account/campaign được duyệt.
- Bảng quy ước UTM đang sử dụng.
- Quyền truy cập đọc dữ liệu hoặc xác nhận `NOT_CONNECTED` nếu chưa được cấp.
- Số liệu gốc/biên bản đối soát cho demo.

---

## Trách nhiệm test không tách thành người thứ tư

- Frontend tự chịu trách nhiệm component tests và production build.
- Thắng tự chịu trách nhiệm unit/integration tests Backend + Database.
- Người Tracking/Integration chịu trách nhiệm E2E, CI và đối soát liên hệ thống.
- Người quản lý Page nghiệm thu số liệu Meta/UTM, không nghiệm thu code.

## Thứ tự thực hiện

### Giai đoạn 1 - Chốt yêu cầu

- Cả nhóm chốt KPI, payer mapping, timezone, source và API contract.
- Page Manager chốt Page/campaign và quyền.
- Frontend dựng giao diện theo contract.
- Thắng khảo sát auth/schema và tạo Analytics module.
- Tracking thiết lập GA4/Firebase/UTM và test plan.

### Giai đoạn 2 - Business data và tracking

- Thắng hoàn thành auth, database queries và Business API.
- Frontend kết nối Business API.
- Tracking xác nhận event thật GA4/Firebase.
- Page Manager dùng link UTM test.
- Integration đối soát SQL ↔ API ↔ UI và chạy CI.

### Giai đoạn 3 - External analytics

- Thắng kết nối GA4/Firebase, sau đó Meta/Store khi có quyền.
- Frontend hoàn thiện Landing/App/Marketing và source status.
- Tracking/Page Manager đối chiếu dashboard nguồn.
- Integration test timeout, quota, token và partial failure.

### Giai đoạn 4 - Hoàn thiện

- Sửa lỗi, hoàn thiện Swagger/README/test report.
- Kiểm tra secret và Definition of Done.
- Merge qua PR khi reviewer khác duyệt và CI pass.
- Deploy và demo trên dữ liệu thật.

## Phụ thuộc

```text
KPI + payer mapping + Page/campaign access
                    ↓
          API contract + tracking plan
                    ↓
   Database queries + real tracking events
                    ↓
      Backend adapters + Analytics API
                    ↓
          Frontend integration
                    ↓
        E2E + source reconciliation
                    ↓
               Deploy + demo
```

## Definition of Done

- KPI dùng dữ liệu thật hoặc hiển thị trung thực trạng thái chưa kết nối.
- Mỗi KPI có định nghĩa, source, date range/timezone và cách đối soát.
- Frontend không truy cập database hoặc giữ service secret.
- Authentication, authorization, validation và user-facing error handling đầy đủ.
- Build, lint, typecheck, unit/integration/E2E tests pass.
- Không có secret trong repository hoặc log.
- Tài liệu local/deploy và demo script đầy đủ.
- Mỗi PR có reviewer khác; không code trực tiếp trên `main`.
