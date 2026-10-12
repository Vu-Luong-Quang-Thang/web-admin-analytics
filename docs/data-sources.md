# Nguồn dữ liệu và cách nhập thủ công

| Nhóm | KPI | Nơi đọc số | Người chịu trách nhiệm |
|---|---|---|---|
| Landing | users, sessions, page views | GA4 dashboard | Data/QA |
| Landing | download clicks | GA4 event report | Data/QA |
| App | first opens, active users | Firebase Console | Data/QA |
| Android/iOS | downloads | Store Console khi app đã publish | Data/QA |
| Business | accounts, payments | PostgreSQL/API app | Backend |
| Marketing | reach, impressions, clicks, spend | Meta Business Suite/Ads Manager | Page Manager |

## Quy trình nhập

1. Chọn đúng dashboard nguồn và khoảng ngày.
2. Dùng timezone thống nhất `Asia/Ho_Chi_Minh` khi nguồn cho phép.
3. Ghi lại KPI, giá trị, nguồn, phạm vi và ghi chú đối soát.
4. Nhập qua Admin Page; không sửa trực tiếp PostgreSQL.
5. Chọn `MANUAL_VERIFIED` nếu đã đối soát, nếu chưa thì chọn `MANUAL_UNVERIFIED`.
6. Người QA so sánh bản ghi với nguồn trước khi demo/nghiệm thu.

## Giới hạn phải ghi rõ

- `first_open` không phải download chính thức.
- Click tải APK không chứng minh cài đặt thành công.
- GA4 users có thể khác số tài khoản trong app.
- Meta reach và impressions không cùng ý nghĩa.
- Dữ liệu từ các khoảng thời gian/timezone khác nhau không được so sánh trực tiếp.

## Dữ liệu mẫu

Khi chưa có quyền hoặc dữ liệu thật, có thể nhập bản ghi `DEMO`. Giao diện phải gắn nhãn **Dữ liệu mẫu** và không dùng bản ghi đó trong báo cáo được mô tả là số liệu thực tế.

## Bảo mật

- Không upload/commit token, credential hoặc ảnh chụp chứa thông tin nhạy cảm.
- Ghi chú chỉ chứa tham chiếu an toàn, không chứa access token.
- Chỉ Admin được nhập/sửa; người xem không được thay đổi dữ liệu.
