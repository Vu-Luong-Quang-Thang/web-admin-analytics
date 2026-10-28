import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { api, type AdminPrincipal, type Entry, type EntryInput } from './api';
import Charts from './Charts';
import Funnel from './Funnel';
import { metricLabel, metrics, sourceLabel, sources } from './catalog';
const today = new Date().toISOString().slice(0, 10);
const initial: EntryInput = {
  metricKey: 'LANDING_USERS', source: 'GA4_CONSOLE', scopeKey: null, value: 0, unit: 'COUNT',
  periodStart: today, periodEnd: today, timezone: 'Asia/Ho_Chi_Minh',
  verification: 'MANUAL_VERIFIED', note: null,
};
const currencyMetrics = new Set(['APP_REVENUE']);
const tiktokMetrics = new Set(['TIKTOK_FOLLOWERS', 'TIKTOK_LIKES', 'TIKTOK_VIDEO_VIEWS']);
const landingMetrics = new Set(['LANDING_USERS', 'LANDING_SESSIONS', 'LANDING_PAGE_VIEWS']);
const automaticMetrics = new Set(['APP_ACTIVE_USERS', 'APP_PAYING_USERS', 'APP_REVENUE']);
const revenueMetrics = new Set(['APP_ACTIVE_USERS', 'APP_TRANSACTIONS', 'APP_PAYING_USERS', 'APP_REVENUE']);
const facebookMetrics = new Set(['SOCIAL_ORGANIC_REACH', 'SOCIAL_ORGANIC_VIEWS', 'META_REACH', 'META_IMPRESSIONS', 'META_CLICKS', 'META_SPEND']);
const kpiGroups = [
  ['landing', 'Landing Page'],
  ['facebook', 'Facebook'],
  ['tiktok', 'TikTok'],
  ['app', 'Ứng dụng'],
  ['revenue', 'Doanh thu'],
] as const;

function kpiGroup(entry: Entry) {
  if (revenueMetrics.has(entry.metricKey)) return 'revenue';
  if (entry.metricKey === 'DOWNLOAD_CLICKS') return entry.scopeKey?.toLowerCase().includes('landing') ? 'landing' : 'app';
  if (landingMetrics.has(entry.metricKey)) return 'landing';
  if (tiktokMetrics.has(entry.metricKey) || entry.source === 'TIKTOK_ANALYTICS') return 'tiktok';
  if (facebookMetrics.has(entry.metricKey) || entry.source === 'FACEBOOK_INSIGHTS' || entry.source === 'META_BUSINESS_SUITE') return 'facebook';
  return 'app';
}

function formatValue(entry: Entry) {
  return entry.unit === 'CURRENCY'
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(entry.value)
    : new Intl.NumberFormat('vi-VN').format(entry.value);
}

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('admin-token') ?? '');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState<Entry[]>([]);
  const [form, setForm] = useState<EntryInput>(initial);
  const [period, setPeriod] = useState({ from: today, to: today });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [principal, setPrincipal] = useState<AdminPrincipal | null>(null);
  const [loginError, setLoginError] = useState('');
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  const load = useCallback(async () => {
    if (!token) return;
    setBusy(true); setMessage('');
    try {
      const [me, list, cards] = await Promise.all([api.me(token), api.list(token), api.summary(token, period.from, period.to)]);
      setPrincipal(me.data); setEntries(list.data); setSummary(cards.data);
      if (cards.live.status === 'unavailable') setMessage(`Dữ liệu tự động tạm thời không khả dụng: ${cards.live.message}`);
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }, [token, period]);

  useEffect(() => { void load(); }, [load]);
  const totals = useMemo(() => summary.map((entry) => ({ ...entry, title: metricLabel(entry.metricKey) })), [summary]);

  async function passwordLogin(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setLoginError('');
    try {
      const result = await api.login(credentials.username, credentials.password);
      sessionStorage.setItem('admin-token', result.token);
      setPrincipal(result.data); setToken(result.token);
    } catch (error) { setLoginError((error as Error).message); }
    finally { setBusy(false); }
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
          const me = await api.me(credential);
          setPrincipal(me.data);
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
    <div className="login-divider"><span>hoặc</span></div>
    <form onSubmit={passwordLogin}>
      <label>Tên đăng nhập<input autoComplete="username" value={credentials.username} onChange={(e) => setCredentials({ ...credentials, username: e.target.value })} required /></label>
      <label>Mật khẩu<input type="password" autoComplete="current-password" value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} required /></label>
      <button disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập quản trị'}</button>
    </form>
  </section></main>;

  return <div className="app-shell">
    <header><div><span className="eyebrow">TRỌ ƠI · ADMIN ANALYTICS</span><h1>Tổng quan số liệu</h1></div>
      <div className="account-box"><div><strong>{principal?.name || principal?.email || 'Admin'}</strong><small>{principal?.roles.join(' · ')}</small></div><button className="secondary" onClick={() => { sessionStorage.removeItem('admin-token'); setToken(''); setPrincipal(null); }}>Đăng xuất</button></div></header>
    {message && <div className={message.startsWith('Đã') ? 'notice success' : 'notice error'} role="status">{message}</div>}
    <section className="period-bar"><div><h2>Kỳ báo cáo</h2><p>Chọn đúng kỳ đã nhập để xem KPI, không cộng kỳ chồng lấn.</p></div>
      <label>Từ ngày<input type="date" value={period.from} onChange={(e) => setPeriod({ ...period, from: e.target.value })} /></label>
      <label>Đến ngày<input type="date" value={period.to} onChange={(e) => setPeriod({ ...period, to: e.target.value })} /></label></section>
    <section className="kpi-report" aria-label="KPI theo kỳ">{totals.length ? kpiGroups.map(([key, title]) => {
      const items = totals.filter((item) => kpiGroup(item) === key);
      return items.length ? <section className={`kpi-group ${key}`} key={key} aria-labelledby={`kpi-${key}`}>
        <h2 id={`kpi-${key}`}>{title}</h2>
        <div className="cards">{items.map((item) => <article className="kpi" key={item.entryId}>
          <span>{item.title}</span><strong>{formatValue(item)}</strong><small>{item.scopeKey || sourceLabel(item.source)}</small>
        </article>)}</div>
      </section> : null;
    }) : <div className="empty">Chưa có số liệu cho đúng kỳ này.</div>}</section>
    <Funnel entries={summary} />
    <Charts entries={entries.filter((entry) => entry.verification !== 'DEMO')} />
    <div className="content-grid">
      {principal?.permissions.includes('analytics:write') ? <section className="panel"><h2>Nhập số liệu thủ công</h2><p className="muted">Lấy số từ nguồn chính thức rồi ghi rõ nguồn, phạm vi và kỳ báo cáo. Người dùng, người dùng trả phí và thu nhập được lấy tự động qua API.</p>
        <form className="entry-form" onSubmit={submit}>
          <label>Chỉ số<select value={form.metricKey} onChange={(e) => setForm({ ...form, metricKey: e.target.value, source: tiktokMetrics.has(e.target.value) ? 'TIKTOK_ANALYTICS' : form.source, unit: currencyMetrics.has(e.target.value) ? 'CURRENCY' : 'COUNT' })}>{metrics.filter(([key]) => !automaticMetrics.has(key)).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
          <label>Nguồn<select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>{sources.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
          <label>Kênh / fanpage / chiến dịch<input value={form.scopeKey ?? ''} maxLength={120} placeholder="Ví dụ: facebook, tiktok, fb_trooi" onChange={(e) => setForm({ ...form, scopeKey: e.target.value || null })} /></label>
          <div className="row"><label>Giá trị<input type="number" min="0" step="0.0001" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} required /></label>
            <label>Đơn vị<select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value as EntryInput['unit'] })}><option value="COUNT">Số lượng</option><option value="CURRENCY">VND</option></select></label></div>
          <div className="row"><label>Từ ngày<input type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} required /></label>
            <label>Đến ngày<input type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} required /></label></div>
          <label>Xác minh<select value={form.verification} onChange={(e) => setForm({ ...form, verification: e.target.value })}><option>MANUAL_VERIFIED</option><option>MANUAL_UNVERIFIED</option><option>DEMO</option></select></label>
          <label>Ghi chú<textarea maxLength={500} value={form.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value || null })} /></label>
          <button disabled={busy}>{busy ? 'Đang xử lý…' : 'Lưu số liệu'}</button>
        </form></section> : <section className="panel readonly"><h2>Chế độ chỉ xem</h2><p>Tài khoản của bạn có thể xem báo cáo nhưng không có quyền cập nhật số liệu.</p></section>}
      <section className="panel history"><div className="panel-title"><div><h2>Lịch sử nhập</h2><p className="muted">{entries.length} bản ghi gần nhất</p></div><button className="secondary" onClick={() => void load()} disabled={busy}>Làm mới</button></div>
        <div className="table-wrap"><table><thead><tr><th>Chỉ số</th><th>Giá trị</th><th>Kỳ</th><th>Nguồn</th><th>Xác minh</th></tr></thead>
          <tbody>{entries.map((entry) => <tr key={entry.entryId}><td><strong>{metricLabel(entry.metricKey)}</strong><small>{entry.scopeKey}</small></td><td>{formatValue(entry)}</td><td>{entry.periodStart}<br />→ {entry.periodEnd}</td><td>{sourceLabel(entry.source)}</td><td><span className={`badge ${entry.verification.toLowerCase()}`}>{entry.verification}</span></td></tr>)}</tbody></table></div>
      </section>
    </div>
  </div>;
}
