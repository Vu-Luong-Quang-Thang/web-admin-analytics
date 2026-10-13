# Admin Analytics Frontend

Giao diện nhập số liệu thủ công và xem KPI theo đúng kỳ báo cáo.

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Đặt `VITE_API_URL` bằng URL backend và `VITE_GOOGLE_CLIENT_ID` bằng Web Client ID dùng chung với
app Trọ Ơi. Production chỉ cho phép tài khoản Google có `userId` liên kết với một
`admin_accounts` đang hoạt động; giao diện tự ẩn chức năng cập nhật nếu role chỉ có quyền xem.
Google ID token chỉ lưu trong `sessionStorage` và mất khi đóng phiên trình duyệt.

Trong chế độ Vite development, mục đăng nhập token local vẫn hiển thị để nhóm kiểm thử khi chưa
cấu hình Google. Mục này không xuất hiện trong production build và backend production không chấp
nhận local token.

Khi deploy frontend, đặt `VITE_API_URL` trước bước build. Đồng thời cập nhật `CORS_ORIGIN` của
backend bằng domain frontend chính xác.
