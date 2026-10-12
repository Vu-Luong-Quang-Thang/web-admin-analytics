# Nguồn dữ liệu

| Nhóm | KPI | Nguồn chính | Ghi chú |
|---|---|---|---|
| Landing | users, sessions, page views | GA4 Data API | User count có thể là số ước lượng theo cơ chế của GA4. |
| Landing | click tải app | GA4 custom event | Gắn event cho từng nút/link. |
| Attribution | source/fanpage/campaign | GA4 + UTM | Mỗi fanpage/campaign dùng UTM riêng. |
| App | first opens, active users, events | Firebase Analytics | Không phải download chính thức. |
| Android | installs/downloads | Google Play Console | Chỉ có khi app được phát hành và có quyền. |
| iOS | first-time/total downloads | App Store Connect | Chỉ có khi app được phát hành và có quyền. |
| Business | accounts, payments | PostgreSQL | Nguồn nghiệp vụ chính. |
| Marketing | reach, impressions, clicks, spend | Meta Marketing API | Cần Ad Account, token và quyền phù hợp. |
| Fanpage | page insights | Meta Graph API | Cần Page ID/token/quyền phù hợp. |

## Trường hợp chỉ phát APK

Không có số download chính thức từ Play Console. Dashboard tách:

- `downloadClicks`: số click link APK từ GA4;
- `firstOpens`: số lần app được mở lần đầu theo Firebase.

Hai chỉ số không bằng nhau và không được đổi tên thành `downloads`.

## Bảo mật

- Frontend chỉ gọi Analytics API của Backend.
- Service credential, access token và secret không được gửi xuống trình duyệt hoặc commit.
- Backend dùng quyền read-only tối thiểu cần thiết.
- Log không chứa token; lỗi trả về không lộ secret.

## Trạng thái tích hợp

- `CONNECTED`: truy vấn thành công.
- `STALE`: đang dùng cache cũ.
- `ERROR`: đã cấu hình nhưng truy vấn lỗi.
- `NOT_CONNECTED`: chưa cấu hình token/quyền.
- `NOT_AVAILABLE`: chưa có nguồn, ví dụ app chưa publish.

Không thay `NOT_CONNECTED` hoặc `NOT_AVAILABLE` bằng giá trị 0 hay dữ liệu Demo.
