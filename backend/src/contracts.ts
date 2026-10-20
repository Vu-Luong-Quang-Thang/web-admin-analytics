export const metricKeys = [
  'LANDING_USERS', 'LANDING_SESSIONS', 'LANDING_PAGE_VIEWS', 'DOWNLOAD_CLICKS',
  'APP_FIRST_OPENS', 'APP_ACTIVE_USERS', 'STORE_DOWNLOADS',
  'SOCIAL_ORGANIC_REACH', 'SOCIAL_ORGANIC_VIEWS',
  'TIKTOK_FOLLOWERS', 'TIKTOK_LIKES', 'TIKTOK_VIDEO_VIEWS',
  'APP_REGISTRATIONS', 'ATTRIBUTED_STORE_INSTALLS', 'ATTRIBUTED_APP_REGISTRATIONS',
  'APP_TRANSACTIONS', 'APP_PAYING_USERS', 'APP_REVENUE',
  'META_REACH', 'META_IMPRESSIONS', 'META_CLICKS', 'META_SPEND',
] as const;

export const sources = [
  'GA4_CONSOLE', 'FIREBASE_CONSOLE', 'GOOGLE_PLAY_CONSOLE',
  'APP_STORE_CONNECT', 'FACEBOOK_INSIGHTS', 'TIKTOK_ANALYTICS',
  'TROOI_DATABASE', 'META_BUSINESS_SUITE', 'MANUAL_OTHER',
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

export type ManualEntry = ManualEntryInput & {
  entryId: string;
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type EntryFilters = {
  metricKey?: ManualEntryInput['metricKey'];
  source?: ManualEntryInput['source'];
  verification?: ManualEntryInput['verification'];
  from?: string;
  to?: string;
  limit: number;
  offset: number;
};
