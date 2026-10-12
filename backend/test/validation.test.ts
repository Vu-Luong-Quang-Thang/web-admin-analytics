import assert from 'node:assert/strict';
import test from 'node:test';
import { ValidationError, validateEntry } from '../src/validation.js';

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

test('rejects negative values, reversed dates and unknown enums', () => {
  for (const body of [
    { ...valid, value: -1 },
    { ...valid, periodStart: '2026-10-08' },
    { ...valid, metricKey: 'FAKE_METRIC' },
  ]) {
    assert.throws(() => validateEntry(body), ValidationError);
  }
});
