import {
  metricKeys, sources, units, verifications,
  type EntryFilters, type ManualEntryInput,
} from './contracts.js';

export class ValidationError extends Error {}

function enumValue<T extends readonly string[]>(name: string, value: unknown, allowed: T): T[number] {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new ValidationError(`${name} is invalid`);
  }
  return value as T[number];
}

function isoDate(name: string, value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError(`${name} must use YYYY-MM-DD`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    throw new ValidationError(`${name} is not a valid date`);
  }
  return value;
}

function integer(name: string, value: string | null, fallback: number, min: number, max: number): number {
  if (value === null) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new ValidationError(`${name} must be an integer from ${min} to ${max}`);
  }
  return parsed;
}

export function validateFilters(params: URLSearchParams): EntryFilters {
  const metricKey = params.get('metricKey');
  const source = params.get('source');
  const verification = params.get('verification');
  const from = params.get('from');
  const to = params.get('to');
  const filters: EntryFilters = {
    limit: integer('limit', params.get('limit'), 50, 1, 100),
    offset: integer('offset', params.get('offset'), 0, 0, 1_000_000),
  };
  if (metricKey !== null) filters.metricKey = enumValue('metricKey', metricKey, metricKeys);
  if (source !== null) filters.source = enumValue('source', source, sources);
  if (verification !== null) filters.verification = enumValue('verification', verification, verifications);
  if (from !== null) filters.from = isoDate('from', from);
  if (to !== null) filters.to = isoDate('to', to);
  if (filters.from && filters.to && filters.from > filters.to) {
    throw new ValidationError('from must not be after to');
  }
  return filters;
}

export function validateSummaryPeriod(params: URLSearchParams) {
  const from = isoDate('from', params.get('from'));
  const to = isoDate('to', params.get('to'));
  if (from > to) throw new ValidationError('from must not be after to');
  return { from, to, includeDemo: params.get('includeDemo') === 'true' };
}

export function validateEntry(value: unknown): ManualEntryInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError('body must be an object');
  }
  const body = value as Record<string, unknown>;
  const periodStart = isoDate('periodStart', body.periodStart);
  const periodEnd = isoDate('periodEnd', body.periodEnd);
  if (periodStart > periodEnd) throw new ValidationError('periodStart must not be after periodEnd');
  if (typeof body.value !== 'number' || !Number.isFinite(body.value) || body.value < 0) {
    throw new ValidationError('value must be a finite non-negative number');
  }
  const scopeKey = body.scopeKey == null ? null : String(body.scopeKey).trim();
  if (scopeKey !== null && (scopeKey.length === 0 || scopeKey.length > 120)) {
    throw new ValidationError('scopeKey must contain 1 to 120 characters');
  }
  const note = body.note == null ? null : String(body.note).trim();
  if (note !== null && note.length > 500) throw new ValidationError('note must not exceed 500 characters');
  const timezone = body.timezone ?? 'Asia/Ho_Chi_Minh';
  if (timezone !== 'Asia/Ho_Chi_Minh') throw new ValidationError('timezone is not supported');
  return {
    metricKey: enumValue('metricKey', body.metricKey, metricKeys),
    source: enumValue('source', body.source, sources),
    scopeKey,
    value: body.value,
    unit: enumValue('unit', body.unit, units),
    periodStart,
    periodEnd,
    timezone,
    verification: enumValue('verification', body.verification, verifications),
    note,
  };
}
