# Trọ Ơi Web Admin Analytics

Web Admin Analytics là trang quản trị tập trung dành cho dự án **Trọ Ơi**. Hệ thống giúp nhóm thu thập, kiểm tra và trực quan hóa số liệu từ mạng xã hội, Landing Page, cửa hàng ứng dụng và app Trọ Ơi trên một dashboard thống nhất.

Ở phiên bản hiện tại, quản trị viên nhập số liệu đã đối soát từ các nguồn chính thức. Kiến trúc được thiết kế để có thể thay dần việc nhập tay bằng đồng bộ API định kỳ hoặc gần thời gian thực mà không phải xây lại dashboard.

## Bản đang hoạt động

- Web Admin: [https://web-admin-analytics.onrender.com](https://web-admin-analytics.onrender.com)
- API health: [https://web-admin-analytics-api.onrender.com/api/v1/health](https://web-admin-analytics-api.onrender.com/api/v1/health)
- Nhánh triển khai chính: `main`
- Hạ tầng: Render Static Site, Render Web Service và PostgreSQL

Tài khoản và mật khẩu quản trị không được lưu trong repository. Người được phân quyền nhận thông tin đăng nhập qua kênh riêng.

## Mục tiêu dự án

Dự án hướng tới bốn mục tiêu chính:

1. **Tập trung số liệu:** thay vì xem rời rạc trong GA4, Facebook, TikTok, Firebase và Store Console, nhóm có một trang tổng hợp duy nhất.
2. **Theo dõi hành trình người dùng:** biểu diễn funnel từ tiếp cận trên mạng xã hội đến truy cập Landing Page, bấm tải, cài app và đăng ký tài khoản.
3. **Minh bạch nguồn dữ liệu:** mỗi bản ghi phải có nguồn, phạm vi, kỳ báo cáo, trạng thái xác minh và người cập nhật.
4. **Sẵn sàng tự động hóa:** giữ API và mô hình dữ liệu ổn định để sau này tích hợp đồng bộ GA4, Meta, TikTok, Firebase, Google Play và dữ liệu app.

## Funnel chính

```text
Facebook / TikTok organic reach
                |
                v
      Người truy cập Landing Page
                |
                v
          Lượt bấm tải app
                |
                v
          Lượt cài đặt app
                |
                v
         Tài khoản đăng ký
```

Dashboard hiển thị số lượng của từng bước và tỷ lệ so với bước trước khi có đủ dữ liệu cho cùng kỳ báo cáo.

## Chức năng hiện có

### Quản trị và bảo mật

- Đăng nhập bằng username/password được hash bằng `scrypt`.
- Hỗ trợ liên kết Google identity của app Trọ Ơi khi cấu hình OAuth.
- Session token có thời hạn và chỉ lưu bản hash trong database.
- Giới hạn số lần đăng nhập sai theo địa chỉ truy cập.
- Phân quyền theo role:
  - `SUPER_ADMIN`: toàn quyền quản trị.
  - `EDITOR`: xem và cập nhật số liệu.
  - `VIEWER`: chỉ xem dashboard.
  - `SYNC_MANAGER`: quản lý đồng bộ trong giai đoạn sau.

### Nhập và quản lý số liệu

- Nhập số liệu thủ công theo chỉ số, nguồn và khoảng thời gian.
- Ghi kênh, fanpage hoặc chiến dịch bằng `scopeKey`.
- Kiểm tra dữ liệu ở cả frontend, backend và database.
- Ngăn bản ghi trùng cùng chỉ số, nguồn, phạm vi và kỳ báo cáo.
- Lưu người tạo, người cập nhật và thời điểm thay đổi.
- Xem lịch sử các bản ghi gần nhất.

### Dashboard

- KPI theo đúng kỳ báo cáo được chọn.
- Funnel Facebook/TikTok → Landing → App.
- Biểu đồ cột và đường theo thời gian.
- Biểu đồ phân bổ theo nguồn dữ liệu.
- Không đưa dữ liệu `DEMO` vào biểu đồ phân tích chính.

## Các nhóm số liệu

### Mạng xã hội organic

- Tiếp cận tự nhiên.
- Lượt xem nội dung tự nhiên.
- Nguồn Facebook Insights hoặc TikTok Analytics.

### Landing Page

- Người truy cập.
- Phiên truy cập.
- Lượt xem trang.
- Lượt bấm tải ứng dụng.

### Ứng dụng

- Lượt cài đặt từ cửa hàng.
- Lượt mở app lần đầu.
- Người dùng hoạt động.
- Tài khoản đăng ký.
- Lượt cài đặt và đăng ký xác định được nguồn.

Các metric quảng cáo trả phí cũ vẫn được database giữ để tương thích dữ liệu, nhưng không nằm trong form organic hiện tại. Payment và doanh thu chưa thuộc phạm vi dashboard hiện hành.

## Trạng thái xác minh

- `MANUAL_VERIFIED`: số liệu nhập tay đã được đối chiếu với nguồn chính thức.
- `MANUAL_UNVERIFIED`: số liệu nhập tay chưa được đối chiếu hoàn tất.
- `DEMO`: dữ liệu mẫu phục vụ phát triển hoặc trình diễn.

Không sử dụng `DEMO` hoặc `MANUAL_UNVERIFIED` để khẳng định kết quả thực tế của dự án.

## Kiến trúc

```text
React/Vite frontend
        |
        | HTTPS + Bearer token
        v
Node.js/TypeScript API
        |
        | validation + authorization + audit
        v
PostgreSQL
```

Frontend không kết nối trực tiếp PostgreSQL. Backend là ranh giới kiểm tra quyền và dữ liệu trước khi ghi xuống database.

Repository này độc lập với `TroOi-Project`. Web Admin không sửa mã nguồn hoặc ghi trực tiếp vào database của app Trọ Ơi. Khi tích hợp trong tương lai, dữ liệu app phải được cung cấp qua API, read replica hoặc kết nối chỉ đọc được phê duyệt.

## Công nghệ

- Frontend: React 19, TypeScript, Vite.
- Backend: Node.js 22, TypeScript, HTTP API.
- Database: PostgreSQL và migration SQL có version.
- Authentication: password `scrypt`, session token và Google ID token tùy chọn.
- Deployment: Render Blueprint qua `render.yaml`.
- Biểu đồ: SVG và CSS native, không phụ thuộc thư viện chart bên ngoài.

## Cấu trúc repository

```text
backend/                 API, authentication, authorization và validation
database/migrations/     Migration PostgreSQL
frontend/                Dashboard React/Vite
docs/                    Scope, contract, định nghĩa KPI và hướng dẫn
compose.yml              PostgreSQL local bằng Docker
render.yaml              Blueprint deploy production
```

## Chạy trên máy local

### Yêu cầu

- Node.js 22 trở lên.
- npm.
- Docker Desktop.

### 1. Khởi động PostgreSQL

Tại thư mục gốc repository:

```powershell
docker compose up -d
```

Không chạy `docker compose down -v` nếu muốn giữ dữ liệu local. `-v` sẽ xóa volume PostgreSQL.

### 2. Chạy backend

```powershell
cd backend
Copy-Item .env.example .env
npm ci
npm run build
npm start
```

Backend mặc định chạy tại `http://127.0.0.1:3200`.

### 3. Chạy frontend

Mở terminal khác:

```powershell
cd frontend
Copy-Item .env.example .env
npm ci
npm run dev
```

Frontend mặc định chạy tại `http://127.0.0.1:5173`.

### 4. Tạo admin local

Sau khi migration hoàn tất:

```powershell
cd backend
npm run create-local-admin -- admin
```

Mật khẩu được sinh ngẫu nhiên và chỉ hiển thị một lần. Không commit `.env`, mật khẩu, token hoặc database URL.

## API chính

```http
GET   /api/v1/health
POST  /api/v1/auth/login
GET   /api/v1/auth/me

POST  /api/v1/admin/statistics/entries
GET   /api/v1/admin/statistics/entries
GET   /api/v1/admin/statistics/entries/:id
PATCH /api/v1/admin/statistics/entries/:id
GET   /api/v1/admin/statistics/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
```

Chi tiết request/response nằm trong `backend/openapi.yaml` và `docs/statistics-api-contract.md`.

## Kiểm thử

```powershell
cd backend
npm run typecheck
npm test
npm run build

cd ..\frontend
npm run typecheck
npm run build
```

Integration test PostgreSQL cần biến `TEST_DATABASE_URL` trỏ đến database test đã chạy migration.

## Deploy

`render.yaml` tạo ba tài nguyên:

- Static Site cho frontend.
- Node Web Service cho backend.
- PostgreSQL cho dữ liệu và tài khoản quản trị.

Các biến bắt buộc khi deploy:

```text
Frontend:
  VITE_API_URL
  VITE_GOOGLE_CLIENT_ID         tùy chọn

Backend:
  DATABASE_URL                  được Blueprint liên kết tự động
  CORS_ORIGIN
  GOOGLE_CLIENT_ID              tùy chọn
```

Gói PostgreSQL miễn phí của Render có thời hạn. Trước ngày hết hạn phải nâng cấp hoặc chuyển/sao lưu dữ liệu nếu muốn duy trì tài khoản và số liệu lâu dài.

## Hướng phát triển

### Giai đoạn 1 — hiện tại

- Nhập và đối soát dữ liệu thủ công.
- Dashboard funnel và biểu đồ tổng hợp.
- Database Admin độc lập.

### Giai đoạn 2 — đồng bộ định kỳ

- GA4 Data API cho Landing Page.
- Meta Page Insights cho Facebook.
- TikTok Analytics API khi được cấp quyền.
- Firebase/Google Play cho dữ liệu app.
- Cron job, refresh token, retry và nhật ký đồng bộ.

### Giai đoạn 3 — gần thời gian thực

- Event/webhook cho những nguồn có hỗ trợ.
- API hoặc read replica chỉ đọc từ app Trọ Ơi.
- Upsert idempotent và giám sát trạng thái đồng bộ.
- Phân biệt rõ dữ liệu `MANUAL`, `SYNCED` và `DEMO`.

Facebook, TikTok, GA4 và Store có thể có độ trễ hoặc giới hạn API, vì vậy “thời gian thực” phụ thuộc vào khả năng của từng nền tảng.

## Nguyên tắc dữ liệu

- Không commit secret hoặc dữ liệu người dùng nhạy cảm.
- Không trình bày dữ liệu mẫu là dữ liệu thật.
- Không suy đoán attribution khi chưa có UTM/Install Referrer xuyên suốt.
- Không ghi ngược vào database app Trọ Ơi từ dashboard analytics.
- Mọi số liệu phải có nguồn và kỳ báo cáo để có thể đối soát.

## Tài liệu liên quan

- `docs/mvp-scope.md`: phạm vi MVP.
- `docs/statistics-definitions.md`: định nghĩa KPI và funnel.
- `docs/statistics-api-contract.md`: hợp đồng API.
- `docs/data-sources.md`: nguồn và cách xác minh số liệu.
- `docs/manual-entry-design.md`: thiết kế luồng nhập tay.
- `docs/local-development.md`: hướng dẫn môi trường local.
- `docs/future-automatic-sync.md`: lộ trình đồng bộ tự động.
- `docs/team-plan.md`: phân chia công việc và tiêu chí nghiệm thu.
