CREATE TABLE IF NOT EXISTS manual_statistic_entries (
  entry_id uuid PRIMARY KEY,
  metric_key text NOT NULL CHECK (metric_key IN (
    'LANDING_USERS','LANDING_SESSIONS','LANDING_PAGE_VIEWS','DOWNLOAD_CLICKS',
    'APP_FIRST_OPENS','APP_ACTIVE_USERS','STORE_DOWNLOADS',
    'META_REACH','META_IMPRESSIONS','META_CLICKS','META_SPEND'
  )),
  source text NOT NULL CHECK (source IN (
    'GA4_CONSOLE','FIREBASE_CONSOLE','GOOGLE_PLAY_CONSOLE',
    'APP_STORE_CONNECT','META_BUSINESS_SUITE','MANUAL_OTHER'
  )),
  scope_key text,
  value numeric(20,4) NOT NULL CHECK (value >= 0),
  unit text NOT NULL CHECK (unit IN ('COUNT','CURRENCY')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  verification text NOT NULL CHECK (verification IN (
    'MANUAL_VERIFIED','MANUAL_UNVERIFIED','DEMO'
  )),
  note text CHECK (note IS NULL OR char_length(note) <= 500),
  created_by_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by_user_id uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_manual_statistics_period CHECK (period_start <= period_end)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_manual_statistics_scope_period
  ON manual_statistic_entries (
    metric_key,
    source,
    COALESCE(scope_key, ''),
    period_start,
    period_end,
    timezone
  );

CREATE INDEX IF NOT EXISTS ix_manual_statistics_period
  ON manual_statistic_entries (period_start, period_end);
