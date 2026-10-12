# TrọƠi Web Admin Analytics

Web Admin nội bộ tổng hợp số liệu Landing Page, Mobile App, tài khoản, thanh toán và marketing của TrọƠi.

Frontend chỉ gọi Analytics API qua HTTPS. Không kết nối trực tiếp PostgreSQL và không lưu Google, Firebase hoặc Meta credential trong trình duyệt/repository.

## Kiến trúc

```text
web-admin-analytics (React Admin UI)
                |
                | Bearer token + HTTPS
                v
TroOi-Project (NestJS Analytics API)
   |          |          |          |
PostgreSQL   GA4      Firebase   Meta/Store
```

- `web-admin-analytics`: giao diện Admin, trạng thái nguồn và API client.
- `TroOi-Project`: authentication, authorization, database query và adapters nguồn ngoài.
- `TroOi-Landing-Page`: GA4, UTM và sự kiện click tải app.

## Nhánh và người phụ trách

| Nhánh | Người phụ trách | Phạm vi |
|---|---|---|
| `root/docs` | Trưởng nhóm/người review | Nguồn tài liệu và contract đã chốt |
| `feature/admin-frontend` | Thành viên Frontend | React Admin UI và kết nối API |
| `feature/analytics-integration` | Thành viên Tracking/Integration | GA4, Firebase, UTM, CI, E2E và đối soát |
| `docs/page-operations` | Người quản lý Page | Page/campaign inventory, UTM và checklist đối soát Meta |
| `feature/admin-analytics-api` trong `TroOi-Project` | Thắng | Backend Analytics + Database |

Các nhánh trong repo này được tạo từ cùng trạng thái `root/docs`. Không code trực tiếp trên `main` hoặc `root/docs`; hoàn thành qua Pull Request và cần ít nhất một reviewer khác.

## 1. Frontend — `feature/admin-frontend`

### Công việc

- Khởi tạo React + TypeScript + Vite với dependency tối thiểu.
- Tạo login/logout, protected routes và API client dùng Bearer token.
- Xây dựng Overview, Landing, App, Business, Marketing và Source Status.
- Thêm date range và timezone `Asia/Ho_Chi_Minh`.
- Hiển thị loading, empty, zero, stale, error, `NOT_CONNECTED` và `NOT_AVAILABLE`.
- Xử lý `401` bằng đăng nhập lại; `403` bằng trang không có quyền.
- Không hard-code KPI, không truy cập database và không chứa service credential.
- Với `payingUsers: null`, hiển thị **Chưa xác định**, không đổi thành `0`.

### Bàn giao

- Giao diện responsive và gọi API thật.
- Component tests cho loading/error/401/403/zero/unavailable.
- Lint, typecheck, test và production build đều pass.
- README frontend ghi rõ biến môi trường và cách chạy.

## 2. Tracking + Integration + QA/DevOps — `feature/analytics-integration`

### Công việc

- Viết tracking plan: tên KPI, event, source, công thức, timezone và cách đối soát.
- Gắn/kiểm tra GA4 page view, session, users, UTM và click tải app trên Landing Page.
- Gắn/kiểm tra Firebase `first_open`, active users và app events đã chốt.
- Phân biệt `downloadClicks`, `firstOpens` và Store downloads; không gọi chúng là cùng một KPI.
- Phối hợp Page Manager kiểm tra Page ID, Ad Account, campaign và UTM.
- Chuẩn hóa `.env.example`, CORS và cấu hình môi trường; không commit secret.
- Thiết lập CI chạy install, lint, typecheck, test và build.
- Viết E2E cho 401/403/200, nguồn chưa kết nối, timeout và partial failure.
- Đối soát nguồn gốc → Backend API → Admin UI trong cùng khoảng ngày/timezone.

### Bàn giao

- Tracking plan, event/UTM verification và metric mapping.
- CI workflow và E2E tests chạy thành công.
- Test report, deployment checklist, rollback note và demo script.
- Mỗi KPI có bằng chứng đối soát hoặc trạng thái chưa kết nối trung thực.

## 3. Page Operations — `docs/page-operations`

Người quản lý Page không cần viết code. Nhánh này chỉ chứa tài liệu vận hành, tuyệt đối không commit access token.

### Công việc

- Ghi danh sách Facebook Page, Page ID, Ad Account và campaign thuộc phạm vi.
- Phối hợp cấp quyền read-only cần thiết cho Meta Graph/Marketing API.
- Dùng link Landing Page đúng quy ước UTM cho từng Page/campaign.
- Ghi ngày chạy, Page, campaign, ngân sách và mục tiêu để đối soát.
- Xác nhận reach, impressions, clicks và spend từ Business Suite/Ads Manager.
- Báo khi token, quyền, Page hoặc campaign thay đổi.
- Nghiệm thu Marketing dashboard theo cùng date range/timezone.

### Bàn giao

- Page/Ad Account/campaign inventory đã xác nhận.
- Bảng UTM đang sử dụng.
- Quyền đọc đã cấp hoặc ghi rõ `NOT_CONNECTED`.
- Biên bản đối soát Meta cho buổi demo.

## 4. Backend + Database — repository `TroOi-Project`

Phần này do Thắng thực hiện trên nhánh `feature/admin-analytics-api`, không merge code backend vào repo frontend.

```http
GET /api/admin/analytics/overview
Authorization: Bearer <google-id-token>
```

`payments` hiện chỉ gắn với tenancy, chưa có quy tắc canonical xác nhận payer. Vì vậy API phải trả:

```json
{
  "totalAccounts": 10,
  "payingUsers": null,
  "successfulPayments": 4,
  "paymentClaimSubmitters": 2,
  "gatewayCheckoutCreators": 1,
  "conversionRate": null,
  "payingUsersStatus": "UNAVAILABLE_POLICY_OPEN",
  "generatedAt": "2026-10-12T04:00:00.000Z"
}
```

`paymentClaimSubmitters` và `gatewayCheckoutCreators` là chỉ số mô tả hành vi, không phải số payer đã xác minh. Nhóm phải chốt quy tắc payer trước khi bật `payingUsers` và `conversionRate`.

## Thứ tự tích hợp

1. Review `root/docs` và chốt KPI/API contract.
2. Mỗi người làm đúng nhánh được giao.
3. Backend cung cấp API và trạng thái nguồn.
4. Frontend tích hợp API; Tracking/Page Manager cung cấp nguồn và bằng chứng.
5. Đối soát PostgreSQL/GA4/Firebase/Meta/Store → API → UI.
6. Mở Pull Request về nhánh tích hợp được nhóm thống nhất; CI và reviewer phải pass trước khi merge.

## Quy tắc dữ liệu và bảo mật

- Dùng số liệu thật hoặc trạng thái chưa kết nối; không dùng số demo như dữ liệu thật.
- Không commit `.env`, token, credential, raw user data hoặc PII không cần thiết.
- `401`: thiếu/sai/hết hạn token. `403`: đã đăng nhập nhưng không có quyền Admin.
- Mỗi KPI phải ghi source, thời điểm cập nhật, date range/timezone và cách đối soát.
- Một nguồn ngoài bị lỗi không được làm mất toàn bộ dashboard nếu API có thể trả partial data.

## Tài liệu chi tiết

- `docs/mvp-scope.md`: phạm vi và tiêu chí nghiệm thu.
- `docs/statistics-definitions.md`: định nghĩa KPI và quyết định cần chốt.
- `docs/statistics-api-contract.md`: contract giữa frontend và backend.
- `docs/team-plan.md`: kế hoạch toàn bộ công việc.
- `docs/data-sources.md`: nguồn dữ liệu và giới hạn.
