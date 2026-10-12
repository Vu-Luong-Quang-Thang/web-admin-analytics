# Định nghĩa Statistics

## Landing

- `landingUsers`, `sessions`, `pageViews`: lấy từ GA4 Data API.
- `downloadClicks`: custom event GA4 khi người dùng bấm nút tải app.
- Nguồn fanpage/campaign trên Landing được xác định bằng UTM; mỗi fanpage/campaign phải dùng link UTM riêng.

## App

- `firstTimeDownloads`/`totalDownloads`: Google Play Console hoặc App Store Connect khi app đã phát hành.
- `firstOpens`, `activeUsers`, DAU/MAU và event: Firebase Analytics.
- `first_open` không bằng download; không gộp hai chỉ số.
- Nếu chỉ phát APK, hiển thị `downloadClicks` và `firstOpens` riêng, kèm nhãn proxy.

## Marketing

- `reach`, `impressions`, `clicks`, `spend`: Meta Marketing API theo Ad Account/campaign.
- Số liệu fanpage: Meta Graph API theo Page ID khi token có quyền.
- Khi chưa có access token/quyền, trả `NOT_CONNECTED`; không trả 0 vì 0 có nghĩa là đã kết nối nhưng không có kết quả.

## Total accounts

MVP dùng:

```sql
COUNT(*) FROM users
```

Schema hiện tại chỉ có `users.user_id`, chưa có cờ test/deleted/disabled. Không tuyên bố loại được các loại tài khoản này cho đến khi domain có dữ liệu tương ứng.

## Successful payments

Một payment được tính khi:

- `voided_or_reversed_at IS NULL`; và
- `verification` thuộc nhóm trạng thái thành công do Backend/Data chốt.

Không dùng riêng `confirmed_at IS NOT NULL` vì field này hiện không nullable.

## Paying users

Mỗi user chỉ được đếm một lần và phải liên kết được với ít nhất một successful payment.

### Quyết định bắt buộc trước khi code

Payment chỉ tham chiếu `tenancy_id`, trong khi một tenancy có thể có nhiều participant. Cả nhóm phải chốt một quy tắc:

1. User gửi payment claim dựa trên `payment_claims.submitted_by_user_id` và `resulting_payment_id`; hoặc
2. Participant có role được chỉ định; hoặc
3. Một quan hệ domain khác được bổ sung rõ ràng.

Không được tính tất cả participant của tenancy là paying user. Payment không xác định được user phải được báo cáo riêng, không tự suy diễn.

**Trạng thái:** `BLOCKED - cần nhóm xác nhận quy tắc`.

## Conversion rate

```text
conversionRate = totalAccounts == 0
  ? 0
  : round(payingUsers / totalAccounts * 100, 2)
```

## Thời gian

Múi giờ mặc định khi cần hiển thị: `Asia/Ho_Chi_Minh`.

`users` chưa có `created_at`, do đó MVP không cung cấp xu hướng đăng ký lịch sử. Migration trong tương lai không được gán ngày chạy migration thành ngày đăng ký của user cũ.

