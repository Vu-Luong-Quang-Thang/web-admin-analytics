import type { Entry } from './api';

const steps = [
  ['SOCIAL_ORGANIC_REACH', 'Tiếp cận'],
  ['LANDING_USERS', 'Truy cập Landing từ Facebook và TikTok'],
  ['DOWNLOAD_CLICKS', 'Bấm tải'],
  ['STORE_DOWNLOADS', 'Cài app'],
  ['APP_REGISTRATIONS', 'Đăng ký'],
] as const;

export default function Funnel({ entries }: { entries: Entry[] }) {
  const values = steps.map(([metricKey, name]) => ({
    metricKey, name,
    value: entries.filter((entry) => entry.metricKey === metricKey).reduce((sum, entry) => sum + entry.value, 0),
  }));
  const max = Math.max(1, ...values.map((step) => step.value));

  return <section className="panel funnel-panel" aria-labelledby="funnel-title">
    <div className="panel-title"><div><h2 id="funnel-title">Funnel Facebook/TikTok → App</h2>
      <p className="muted">Số liệu đúng kỳ đang chọn; 0 nghĩa là chưa nhập hoặc nguồn chưa cung cấp.</p></div></div>
    <ol className="funnel-list">{values.map((step, index) => {
      const previous = index ? values[index - 1]!.value : 0;
      const rate = previous > 0 ? step.value / previous * 100 : null;
      return <li key={step.metricKey}>
        <div className="funnel-label"><span>{index + 1}</span><strong>{step.name}</strong><b>{step.value.toLocaleString('vi-VN')}</b></div>
        <div className="funnel-track"><i style={{ width: `${step.value ? Math.max(8, step.value / max * 100) : 0}%` }} /></div>
        {rate !== null && <small>{rate.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}% so với bước trước</small>}
      </li>;
    })}</ol>
  </section>;
}
