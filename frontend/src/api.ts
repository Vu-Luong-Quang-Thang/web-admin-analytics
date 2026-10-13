export type Entry = {
  entryId: string;
  metricKey: string;
  source: string;
  scopeKey: string | null;
  value: number;
  unit: 'COUNT' | 'CURRENCY';
  periodStart: string;
  periodEnd: string;
  verification: string;
  note: string | null;
  updatedAt: string;
};

export type EntryInput = Omit<Entry, 'entryId' | 'updatedAt'> & { timezone: string };
export type AdminPrincipal = { userId: string; email?: string; name?: string; roles: string[]; permissions: string[] };

const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3200').replace(/\/$/, '');

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...init?.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Yêu cầu thất bại (${response.status})`);
  return body;
}

export const api = {
  login: (username: string, password: string) => request<{ data: AdminPrincipal; token: string; expiresInSeconds: number }>('/api/v1/auth/login', '', {
    method: 'POST', body: JSON.stringify({ username, password }), headers: { authorization: '' },
  }),
  me: (token: string) => request<{ data: AdminPrincipal }>('/api/v1/auth/me', token),
  list: (token: string) => request<{ data: Entry[] }>('/api/v1/admin/statistics/entries?limit=100', token),
  summary: (token: string, from: string, to: string) => request<{ data: Entry[] }>(
    `/api/v1/admin/statistics/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, token,
  ),
  create: (token: string, entry: EntryInput) => request<{ data: Entry }>('/api/v1/admin/statistics/entries', token, {
    method: 'POST', body: JSON.stringify(entry),
  }),
};
