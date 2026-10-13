# Hướng nâng cấp đồng bộ tự động

MVP hiện tại nhập số liệu thủ công. RBAC đã dành sẵn quyền `sync:manage`, nhưng chưa chạy job
đồng bộ và không kết nối trực tiếp database production của app.

## Nguyên tắc

- Frontend chỉ gọi Backend Admin, không truy cập database nào trực tiếp.
- Admin không ghi vào database Trọ Ơi.
- Ưu tiên API nội bộ hoặc read replica/read-only user; không dùng tài khoản database có quyền ghi.
- Mọi dữ liệu đồng bộ phải có `source`, kỳ, thời điểm lấy, trạng thái và khóa idempotency.
- Job retry không được tạo bản ghi trùng; lỗi đồng bộ phải hiển thị cho người có `sync:manage`.
- Không coi polling là “realtime”. Realtime thật dùng event/outbox/webhook khi app hỗ trợ.

## Các giai đoạn

1. **Manual** — trạng thái hiện tại: người có `analytics:write` nhập và đối soát số liệu.
2. **Scheduled pull** — worker định kỳ đọc GA4/Firebase/Meta/Store hoặc API read-only của Trọ Ơi.
3. **App database projection** — backend app cung cấp API/read model cho accounts, payments và users;
   Admin chỉ đọc projection đó.
4. **Event-driven** — app phát event/outbox, worker Admin xử lý idempotent và cập nhật dashboard gần
   thời gian thực.

## Dữ liệu app

`trooi_user_id` trong `admin_accounts` chỉ là liên kết danh tính/quyền đăng nhập. Các KPI app sau
này phải được lấy qua contract riêng; không join trực tiếp database Admin với bảng nghiệp vụ của
Trọ Ơi và không sửa schema app từ repository này.
