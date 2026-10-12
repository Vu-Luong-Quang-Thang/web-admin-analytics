export const metricKeys = [
  'LANDING_USERS', 'LANDING_SESSIONS', 'LANDING_PAGE_VIEWS', 'DOWNLOAD_CLICKS',
  'APP_FIRST_OPENS', 'APP_ACTIVE_USERS', 'STORE_DOWNLOADS',
  'META_REACH', 'META_IMPRESSIONS', 'META_CLICKS', 'META_SPEND',
] as const;

export const sources = [
  'GA4_CONSOLE', 'FIREBASE_CONSOLE', 'GOOGLE_PLAY_CONSOLE',
  'APP_STORE_CONNECT', 'META_BUSINESS_SUITE', 'MANUAL_OTHER',
] as const;

export const verifications = ['MANUAL_VERIFIED', 'MANUAL_UNVERIFIED', 'DEMO'] as const;
export const units = ['COUNT', 'CURRENCY'] as const;

export type ManualEntryInput = {
  metricKey: (typeof metricKeys)[number];
  source: (typeof sources)[number];
  scopeKey: string | null;
  value: number;
  unit: (typeof units)[number];
  periodStart: string;
  periodEnd: string;
  timezone: string;
  verification: (typeof verifications)[number];
  note: string | null;
};
