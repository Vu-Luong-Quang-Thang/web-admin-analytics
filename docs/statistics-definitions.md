# Định nghĩa Statistics

## Nguyên tắc MVP

GA4/Firebase/Meta/Store là **nguồn để con người đọc số**, chưa được backend gọi tự động. Mỗi số nhập phải có source, period và verification.

## Landing

- `landingUsers`, `sessions`, `pageViews`: người phụ trách đọc từ GA4 dashboard rồi nhập.
- `downloadClicks`: đọc từ báo cáo GA4 event khi đã gắn event.
- Nguồn fanpage/campaign trên Landing được xác định bằng UTM; mỗi fanpage/campaign phải dùng link UTM riêng.

## App

- `firstTimeDownloads`/`totalDownloads`: đọc từ Google Play Console hoặc App Store Connect khi app đã phát hành.
- `firstOpens`, `activeUsers`, DAU/MAU và event: đọc từ Firebase Console.
- `first_open` không bằng download; không gộp hai chỉ số.
- Nếu chỉ phát APK, hiển thị `downloadClicks` và `firstOpens` riêng, kèm nhãn proxy.

## Marketing

- `SOCIAL_ORGANIC_REACH`: số tài khoản/người được nội dung tiếp cận tự nhiên trong kỳ.
- `SOCIAL_ORGANIC_VIEWS`: lượt xem nội dung tự nhiên trong kỳ.
- Facebook dùng source `FACEBOOK_INSIGHTS`; TikTok dùng `TIKTOK_ANALYTICS`.
- `scopeKey` ghi kênh, fanpage hoặc campaign slug, ví dụ `facebook`, `tiktok`, `fb_trooi_61594440328760`.
- Khi chưa có quyền xem nguồn, không nhập số giả; nếu cần demo phải dùng verification `DEMO`.

Các metric `META_REACH`, `META_IMPRESSIONS`, `META_CLICKS`, `META_SPEND` chỉ được giữ để đọc dữ liệu Ads cũ, không hiển thị trong form nhập organic hiện tại.

## Funnel Facebook/TikTok → App

Dashboard hiển thị năm bước cho đúng kỳ được chọn:

1. `SOCIAL_ORGANIC_REACH`: tiếp cận tự nhiên.
2. `LANDING_USERS`: người truy cập Landing.
3. `DOWNLOAD_CLICKS`: lượt bấm tải app.
4. `STORE_DOWNLOADS`: lượt cài đặt được Store báo cáo.
5. `APP_REGISTRATIONS`: tài khoản đăng ký trong app.

`ATTRIBUTED_STORE_INSTALLS` và `ATTRIBUTED_APP_REGISTRATIONS` chỉ dùng khi hệ thống đã lưu được nguồn qua UTM/Install Referrer. Ghi nguồn marketing trong `scopeKey`; không suy đoán nguồn từ tổng installs hoặc tổng registrations.

Tỷ lệ giữa hai bước chỉ được tính khi bước trước lớn hơn 0. Funnel không chứng minh quan hệ nhân quả nếu dữ liệu chưa có attribution end-to-end.

## Total accounts

MVP dùng:

```sql
COUNT(*) FROM users
```

Khi nhập thủ công số đăng ký mới theo kỳ, dùng `APP_REGISTRATIONS` với source `TROOI_DATABASE`. Đây là số đăng ký trong kỳ, khác với tổng số tài khoản toàn thời gian.

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
payingUsers chưa xác định
  => conversionRate = null
```

Chỉ áp dụng công thức `payingUsers / totalAccounts * 100` sau khi nhóm phê duyệt quy tắc payer canonical. Không biến trạng thái chưa xác định thành `0%`.

## Thời gian

Múi giờ mặc định khi cần hiển thị: `Asia/Ho_Chi_Minh`.

`users` chưa có `created_at`, do đó MVP không cung cấp xu hướng đăng ký lịch sử. Migration trong tương lai không được gán ngày chạy migration thành ngày đăng ký của user cũ.

