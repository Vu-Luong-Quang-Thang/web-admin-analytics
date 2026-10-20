import assert from 'node:assert/strict';
import test from 'node:test';
import { ValidationError, validateEntry, validateFilters, validateSummaryPeriod } from '../src/validation.js';

const valid = {
  metricKey: 'META_REACH',
  source: 'META_BUSINESS_SUITE',
  scopeKey: 'fanpage-main',
  value: 1250,
  unit: 'COUNT',
  periodStart: '2026-10-01',
  periodEnd: '2026-10-07',
  timezone: 'Asia/Ho_Chi_Minh',
  verification: 'MANUAL_VERIFIED',
  note: 'Checked against Meta Business Suite',
};

test('accepts a valid manual statistics entry', () => {
  assert.deepEqual(validateEntry(valid), valid);
});

test('accepts organic social and attributed registration metrics', () => {
  assert.equal(validateEntry({ ...valid, metricKey: 'SOCIAL_ORGANIC_REACH', source: 'FACEBOOK_INSIGHTS' }).metricKey, 'SOCIAL_ORGANIC_REACH');
  assert.equal(validateEntry({ ...valid, metricKey: 'ATTRIBUTED_APP_REGISTRATIONS', source: 'TROOI_DATABASE', scopeKey: 'facebook' }).source, 'TROOI_DATABASE');
});

test('accepts manually entered app revenue metrics', () => {
  assert.equal(validateEntry({ ...valid, metricKey: 'APP_TRANSACTIONS', source: 'TROOI_DATABASE' }).metricKey, 'APP_TRANSACTIONS');
  assert.equal(validateEntry({ ...valid, metricKey: 'APP_PAYING_USERS', source: 'TROOI_DATABASE' }).metricKey, 'APP_PAYING_USERS');
  assert.equal(validateEntry({ ...valid, metricKey: 'APP_REVENUE', source: 'TROOI_DATABASE', unit: 'CURRENCY' }).unit, 'CURRENCY');
  assert.throws(() => validateEntry({ ...valid, metricKey: 'APP_REVENUE', source: 'TROOI_DATABASE', unit: 'COUNT' }), ValidationError);
  assert.throws(() => validateEntry({ ...valid, metricKey: 'APP_TRANSACTIONS', source: 'TROOI_DATABASE', unit: 'CURRENCY' }), ValidationError);
});

test('accepts manually entered TikTok profile metrics', () => {
  for (const metricKey of ['TIKTOK_FOLLOWERS', 'TIKTOK_LIKES', 'TIKTOK_VIDEO_VIEWS'] as const) {
    assert.equal(validateEntry({ ...valid, metricKey, source: 'TIKTOK_ANALYTICS' }).source, 'TIKTOK_ANALYTICS');
    assert.throws(() => validateEntry({ ...valid, metricKey, source: 'TIKTOK_ANALYTICS', unit: 'CURRENCY' }), ValidationError);
  }
});

test('validates filters and pagination', () => {
  assert.deepEqual(validateFilters(new URLSearchParams('metricKey=META_REACH&limit=20&offset=10')), {
    metricKey: 'META_REACH', limit: 20, offset: 10,
  });
  assert.throws(() => validateFilters(new URLSearchParams('limit=0')), ValidationError);
  assert.throws(() => validateFilters(new URLSearchParams('source=UNKNOWN')), ValidationError);
});

test('requires an exact valid summary period', () => {
  assert.deepEqual(validateSummaryPeriod(new URLSearchParams('from=2026-10-01&to=2026-10-07')), {
    from: '2026-10-01', to: '2026-10-07', includeDemo: false,
  });
  assert.throws(() => validateSummaryPeriod(new URLSearchParams('from=2026-10-08&to=2026-10-07')), ValidationError);
});

test('rejects negative values, reversed dates and unknown enums', () => {
  for (const body of [
    { ...valid, value: -1 },
    { ...valid, periodStart: '2026-10-08' },
    { ...valid, metricKey: 'FAKE_METRIC' },
  ]) {
    assert.throws(() => validateEntry(body), ValidationError);
  }
});
