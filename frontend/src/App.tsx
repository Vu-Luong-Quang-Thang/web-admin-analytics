import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { api, type Entry, type EntryInput } from './api';
import Charts from './Charts';

const metrics = [
  ['LANDING_USERS', 'Người truy cập landing page'], ['LANDING_SESSIONS', 'Phiên truy cập'],
  ['LANDING_PAGE_VIEWS', 'Lượt xem trang'], ['DOWNLOAD_CLICKS', 'Lượt bấm tải app'],
  ['APP_FIRST_OPENS', 'Lượt mở app lần đầu'], ['APP_ACTIVE_USERS', 'Người dùng app'],
  ['STORE_DOWNLOADS', 'Lượt tải từ cửa hàng'], ['META_REACH', 'Tiếp cận quảng cáo'],
  ['META_IMPRESSIONS', 'Lượt hiển thị quảng cáo'], ['META_CLICKS', 'Lượt nhấp quảng cáo'],
  ['META_SPEND', 'Chi phí quảng cáo'],
] as const;

const sources = ['GA4_CONSOLE', 'FIREBASE_CONSOLE', 'GOOGLE_PLAY_CONSOLE', 'APP_STORE_CONNECT', 'META_BUSINESS_SUITE', 'MANUAL_OTHER'];
const today = new Date().toISOString().slice(0, 10);
const initial: EntryInput = {
  metricKey: 'LANDING_USERS', source: 'GA4_CONSOLE', scopeKey: null, value: 0, unit: 'COUNT',
  periodStart: today, periodEnd: today, timezone: 'Asia/Ho_Chi_Minh',
  verification: 'MANUAL_VERIFIED', note: null,
};

function label(key: string) { return metrics.find(([value]) => value === key)?.[1] ?? key; }
function formatValue(entry: Entry) {
  return entry.unit === 'CURRENCY'
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(entry.value)
    : new Intl.NumberFormat('vi-VN').format(entry.value);
}

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('admin-token') ?? '');
  const [draftToken, setDraftToken] = useState(token);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState<Entry[]>([]);
  const [form, setForm] = useState<EntryInput>(initial);
  const [period, setPeriod] = useState({ from: today, to: today });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loginError, setLoginError] = useState('');
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  const load = useCallback(async () => {
    if (!token) return;
    setBusy(true); setMessage('');
    try {
      const [list, cards] = await Promise.all([api.list(token), api.summary(token, period.from, period.to)]);
      setEntries(list.data); setSummary(cards.data);
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }, [token, period]);

  useEffect(() => { void load(); }, [load]);
  const totals = useMemo(() => summary.map((entry) => ({ ...entry, title: label(entry.metricKey) })), [summary]);

  function localLogin(event: FormEvent) {
    event.preventDefault();
    const value = draftToken.trim();
    if (!value) return;
    sessionStorage.setItem('admin-token', value); setToken(value);
  }

  useEffect(() => {
    if (token || !googleClientId) return;
    let cancelled = false;
    const timer = window.setInterval(() => {
      const container = document.getElementById('google-signin');
      if (cancelled || !container || !window.google) return;
      window.clearInterval(timer);
      window.google.accounts.id.initialize({ client_id: googleClientId, callback: async ({ credential }) => {
        setLoginError('');
        try {
          await api.me(credential);
          sessionStorage.setItem('admin-token', credential);
          setToken(credential);
        } catch (error) {
          const detail = (error as Error).message;
          setLoginError(detail === 'Unauthorized' ? 'Tài khoản này không có quyền System Admin.' : detail);
        }
      } });
      window.google.accounts.id.renderButton(container, { theme: 'outline', size: 'large', width: 360, text: 'signin_with' });
    }, 100);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [googleClientId, token]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      await api.create(token, form);
      setPeriod({ from: form.periodStart, to: form.periodEnd });
      setMessage('Đã lưu số liệu thành công.');
      setForm({ ...initial, periodStart: form.periodStart, periodEnd: form.periodEnd });
      await load();
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  if (!token) return <main className="login-shell"><section className="login-card">
    <span className="eyebrow">TRỌ ƠI · ADMIN</span><h1>Đăng nhập trang số liệu</h1>
    <p>Dùng tài khoản Google của app Trọ Ơi đã được cấp quyền System Admin.</p>
    {googleClientId ? <div id="google-signin" className="google-signin" /> : <p className="notice error">Chưa cấu hình Google Client ID cho môi trường này.</p>}
    {loginError && <p className="notice error" role="alert">{loginError}</p>}
    {import.meta.env.DEV && <details><summary>Đăng nhập local dành cho lập trình viên</summary><form onSubmit={localLogin}>
      <label>Local admin token<input type="password" value={draftToken} onChange={(e) => setDraftToken(e.target.value)} required /></label>
      <button>Vào môi trường local</button>
    </form></details>}
  </section></main>;

  return <div className="app-shell">
    <header><div><span className="eyebrow">TRỌ ƠI · ADMIN ANALYTICS</span><h1>Tổng quan số liệu</h1></div>
      <button className="secondary" onClick={() => { sessionStorage.removeItem('admin-token'); setToken(''); }}>Đăng xuất</button></header>
    {message && <div className={message.startsWith('Đã') ? 'notice success' : 'notice error'} role="status">{message}</div>}
    <section className="period-bar"><div><h2>Kỳ báo cáo</h2><p>Chọn đúng kỳ đã nhập để xem KPI, không cộng kỳ chồng lấn.</p></div>
      <label>Từ ngày<input type="date" value={period.from} onChange={(e) => setPeriod({ ...period, from: e.target.value })} /></label>
      <label>Đến ngày<input type="date" value={period.to} onChange={(e) => setPeriod({ ...period, to: e.target.value })} /></label></section>
    <section className="cards" aria-label="KPI theo kỳ">{totals.length ? totals.map((item) => <article className="kpi" key={item.entryId}>
      <span>{item.title}</span><strong>{formatValue(item)}</strong><small>{item.scopeKey || item.source}</small>
    </article>) : <div className="empty">Chưa có số liệu cho đúng kỳ này.</div>}</section>
    <Charts entries={entries.filter((entry) => entry.verification !== 'DEMO')} />
    <div className="content-grid">
      <section className="panel"><h2>Nhập số liệu thủ công</h2><p className="muted">Lấy số từ nguồn chính thức rồi ghi rõ nguồn, phạm vi và kỳ báo cáo.</p>
        <form className="entry-form" onSubmit={submit}>
          <label>Chỉ số<select value={form.metricKey} onChange={(e) => setForm({ ...form, metricKey: e.target.value })}>{metrics.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
          <label>Nguồn<select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>{sources.map((source) => <option key={source}>{source}</option>)}</select></label>
          <label>Phạm vi / fanpage<input value={form.scopeKey ?? ''} maxLength={120} placeholder="Ví dụ: fanpage-main" onChange={(e) => setForm({ ...form, scopeKey: e.target.value || null })} /></label>
          <div className="row"><label>Giá trị<input type="number" min="0" step="0.0001" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} required /></label>
            <label>Đơn vị<select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value as EntryInput['unit'] })}><option>COUNT</option><option>CURRENCY</option></select></label></div>
          <div className="row"><label>Từ ngày<input type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} required /></label>
            <label>Đến ngày<input type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} required /></label></div>
          <label>Xác minh<select value={form.verification} onChange={(e) => setForm({ ...form, verification: e.target.value })}><option>MANUAL_VERIFIED</option><option>MANUAL_UNVERIFIED</option><option>DEMO</option></select></label>
          <label>Ghi chú<textarea maxLength={500} value={form.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value || null })} /></label>
          <button disabled={busy}>{busy ? 'Đang xử lý…' : 'Lưu số liệu'}</button>
        </form></section>
      <section className="panel history"><div className="panel-title"><div><h2>Lịch sử nhập</h2><p className="muted">{entries.length} bản ghi gần nhất</p></div><button className="secondary" onClick={() => void load()} disabled={busy}>Làm mới</button></div>
        <div className="table-wrap"><table><thead><tr><th>Chỉ số</th><th>Giá trị</th><th>Kỳ</th><th>Nguồn</th><th>Xác minh</th></tr></thead>
          <tbody>{entries.map((entry) => <tr key={entry.entryId}><td><strong>{label(entry.metricKey)}</strong><small>{entry.scopeKey}</small></td><td>{formatValue(entry)}</td><td>{entry.periodStart}<br />→ {entry.periodEnd}</td><td>{entry.source}</td><td><span className={`badge ${entry.verification.toLowerCase()}`}>{entry.verification}</span></td></tr>)}</tbody></table></div>
      </section>
    </div>
  </div>;
}
