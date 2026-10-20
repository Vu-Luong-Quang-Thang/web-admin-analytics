export const metrics = [
  ['SOCIAL_ORGANIC_REACH', 'Tiếp cận tự nhiên'],
  ['SOCIAL_ORGANIC_VIEWS', 'Lượt xem nội dung tự nhiên'],
  ['TIKTOK_FOLLOWERS', 'Người theo dõi TikTok'],
  ['TIKTOK_LIKES', 'Tổng lượt thích TikTok'],
  ['TIKTOK_VIDEO_VIEWS', 'Lượt xem video TikTok'],
  ['LANDING_USERS', 'Người truy cập landing page'],
  ['LANDING_SESSIONS', 'Phiên truy cập landing page'],
  ['LANDING_PAGE_VIEWS', 'Lượt xem landing page'],
  ['DOWNLOAD_CLICKS', 'Lượt bấm tải app'],
  ['STORE_DOWNLOADS', 'Lượt cài đặt từ cửa hàng'],
  ['ATTRIBUTED_STORE_INSTALLS', 'Lượt cài đặt xác định được nguồn'],
  ['APP_FIRST_OPENS', 'Lượt mở app lần đầu'],
  ['APP_ACTIVE_USERS', 'Người dùng app'],
  ['APP_REGISTRATIONS', 'Tài khoản đăng ký'],
  ['ATTRIBUTED_APP_REGISTRATIONS', 'Tài khoản đăng ký xác định được nguồn'],
  ['APP_TRANSACTIONS', 'Số lượng giao dịch từ app'],
  ['APP_PAYING_USERS', 'Người dùng trả phí'],
  ['APP_REVENUE', 'Thu nhập từ app (VND)'],
] as const;

export const legacyPaidMetrics = [
  ['META_REACH', 'Tiếp cận quảng cáo (cũ)'],
  ['META_IMPRESSIONS', 'Hiển thị quảng cáo (cũ)'],
  ['META_CLICKS', 'Nhấp quảng cáo (cũ)'],
  ['META_SPEND', 'Chi phí quảng cáo (cũ)'],
] as const;

export const sources = [
  ['GA4_CONSOLE', 'GA4'],
  ['FACEBOOK_INSIGHTS', 'Facebook Insights'],
  ['TIKTOK_ANALYTICS', 'TikTok Analytics'],
  ['GOOGLE_PLAY_CONSOLE', 'Google Play Console'],
  ['APP_STORE_CONNECT', 'App Store Connect'],
  ['FIREBASE_CONSOLE', 'Firebase'],
  ['TROOI_DATABASE', 'Database Trọ Ơi'],
  ['META_BUSINESS_SUITE', 'Meta Business Suite (cũ)'],
  ['MANUAL_OTHER', 'Nguồn thủ công khác'],
] as const;

export function metricLabel(key: string) {
  return [...metrics, ...legacyPaidMetrics].find(([value]) => value === key)?.[1] ?? key;
}

export function sourceLabel(key: string) {
  return sources.find(([value]) => value === key)?.[1] ?? key;
}
