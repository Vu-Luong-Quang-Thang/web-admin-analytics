import type { ManualEntry } from './contracts.js';

const automaticMetricKeys = new Set(['APP_ACTIVE_USERS', 'APP_PAYING_USERS', 'APP_REVENUE']);

type FinancePayload = {
  activeUsers: number;
  payingUsers: number;
  revenue: string;
  currency: 'VND';
  generatedAt: string;
};

type LiveEntry = Omit<ManualEntry, 'verification'> & { verification: 'LIVE_API' };

function nonNegativeNumber(name: string, value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Finance API returned invalid ${name}`);
  return parsed;
}

export function withoutAutomaticManualEntries(entries: ManualEntry[]): ManualEntry[] {
  return entries.filter((entry) => !automaticMetricKeys.has(entry.metricKey));
}

export async function financeEntries(from: string, to: string): Promise<LiveEntry[]> {
  const baseUrl = process.env.TROOI_FINANCE_API_URL?.trim().replace(/\/$/, '');
  const token = process.env.TROOI_FINANCE_API_TOKEN?.trim();
  if (!baseUrl || !token) throw new Error('Finance API integration is not configured');
  const url = `${baseUrl}/api/v1/admin/statistics/revenue?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  const response = await fetch(url, {
    headers: { 'x-admin-analytics-token': token },
    signal: AbortSignal.timeout(8_000),
  });
  const body = await response.json().catch(() => ({})) as { data?: FinancePayload; message?: string };
  if (!response.ok || !body.data) throw new Error(body.message || `Finance API request failed (${response.status})`);
  const generatedAt = String(body.data.generatedAt || new Date().toISOString());
  const common = {
    source: 'TROOI_DATABASE' as const,
    scopeKey: null,
    periodStart: from,
    periodEnd: to,
    timezone: 'Asia/Ho_Chi_Minh',
    verification: 'LIVE_API' as const,
    note: 'Tự động tổng hợp qua API finance-backend',
    createdByUserId: 'finance-api',
    updatedByUserId: 'finance-api',
    createdAt: generatedAt,
    updatedAt: generatedAt,
  };
  return [
    { ...common, entryId: `live:APP_ACTIVE_USERS:${from}:${to}`, metricKey: 'APP_ACTIVE_USERS', value: nonNegativeNumber('activeUsers', body.data.activeUsers), unit: 'COUNT' },
    { ...common, entryId: `live:APP_PAYING_USERS:${from}:${to}`, metricKey: 'APP_PAYING_USERS', value: nonNegativeNumber('payingUsers', body.data.payingUsers), unit: 'COUNT' },
    { ...common, entryId: `live:APP_REVENUE:${from}:${to}`, metricKey: 'APP_REVENUE', value: nonNegativeNumber('revenue', body.data.revenue), unit: 'CURRENCY' },
  ];
}
