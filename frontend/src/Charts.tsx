import { useMemo, useState } from 'react';
import type { Entry } from './api';

const chartMetrics = [
  ['LANDING_USERS', 'Người truy cập'], ['APP_ACTIVE_USERS', 'Người dùng app'],
  ['STORE_DOWNLOADS', 'Lượt tải app'], ['META_REACH', 'Tiếp cận Ads'],
  ['META_CLICKS', 'Nhấp Ads'], ['META_SPEND', 'Chi phí Ads'],
] as const;
const colors = ['#156b4a', '#ef8b45', '#5d8fdd', '#c65e8a', '#9a7ad1', '#d0a33b'];

function shortDate(value: string) { return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(new Date(`${value}T00:00:00Z`)); }

export default function Charts({ entries }: { entries: Entry[] }) {
  const [barMetric, setBarMetric] = useState('META_REACH');
  const [lineMetric, setLineMetric] = useState('META_CLICKS');
  const trend = useMemo(() => {
    const periods = [...new Set(entries.filter((item) => item.metricKey === barMetric || item.metricKey === lineMetric)
      .map((item) => item.periodEnd))].sort().slice(-12);
    return periods.map((period) => ({ period,
      bar: entries.filter((item) => item.metricKey === barMetric && item.periodEnd === period).reduce((sum, item) => sum + item.value, 0),
      line: entries.filter((item) => item.metricKey === lineMetric && item.periodEnd === period).reduce((sum, item) => sum + item.value, 0),
    }));
  }, [barMetric, entries, lineMetric]);
  const maxBar = Math.max(1, ...trend.map((item) => item.bar));
  const maxLine = Math.max(1, ...trend.map((item) => item.line));
  const points = trend.map((item, index) => `${55 + index * (620 / Math.max(trend.length - 1, 1))},${220 - item.line / maxLine * 160}`).join(' ');
  const distribution = useMemo(() => {
    const totals = new Map<string, number>();
    entries.filter((item) => item.metricKey === barMetric).forEach((item) => totals.set(item.source, (totals.get(item.source) ?? 0) + item.value));
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [barMetric, entries]);
  const distributionTotal = distribution.reduce((sum, [, value]) => sum + value, 0);
  let angle = 0;
  const gradient = distributionTotal ? distribution.map(([, value], index) => {
    const start = angle; angle += value / distributionTotal * 360;
    return `${colors[index % colors.length]} ${start}deg ${angle}deg`;
  }).join(',') : '#e8eeeb 0deg 360deg';

  return <section className="charts-grid" aria-label="Biểu đồ phân tích">
    <article className="panel chart-panel"><div className="panel-title"><div><h2>Xu hướng theo thời gian</h2><p className="muted">So sánh hai chỉ số, mỗi chỉ số dùng thang riêng.</p></div></div>
      <div className="chart-controls"><label>Cột<select value={barMetric} onChange={(e) => setBarMetric(e.target.value)}>{chartMetrics.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
        <label>Đường<select value={lineMetric} onChange={(e) => setLineMetric(e.target.value)}>{chartMetrics.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label></div>
      {trend.length ? <div className="svg-wrap"><svg viewBox="0 0 730 270" role="img" aria-label="Biểu đồ cột và đường theo kỳ">
        {[0, 1, 2, 3, 4].map((row) => <line key={row} x1="45" x2="700" y1={40 + row * 45} y2={40 + row * 45} className="grid-line" />)}
        {trend.map((item, index) => { const x = 45 + index * (620 / Math.max(trend.length, 1)); const width = Math.min(42, 540 / Math.max(trend.length, 1)); return <g key={item.period}>
          <rect x={x} y={220 - item.bar / maxBar * 160} width={width} height={item.bar / maxBar * 160} rx="4" className="chart-bar"><title>{item.bar.toLocaleString('vi-VN')}</title></rect>
          <text x={x + width / 2} y="245" textAnchor="middle" className="axis-label">{shortDate(item.period)}</text></g>; })}
        <polyline points={points} className="chart-line" />
        {trend.map((item, index) => <circle key={item.period} cx={55 + index * (620 / Math.max(trend.length - 1, 1))} cy={220 - item.line / maxLine * 160} r="5" className="chart-dot"><title>{item.line.toLocaleString('vi-VN')}</title></circle>)}
      </svg></div> : <div className="empty chart-empty">Nhập ít nhất một kỳ dữ liệu để vẽ xu hướng.</div>}
      <div className="legend"><span><i className="bar-key" />{chartMetrics.find(([key]) => key === barMetric)?.[1]}</span><span><i className="line-key" />{chartMetrics.find(([key]) => key === lineMetric)?.[1]}</span></div>
    </article>
    <article className="panel chart-panel"><h2>Phân bổ theo nguồn</h2><p className="muted">Tỷ trọng của chỉ số cột theo nguồn dữ liệu.</p>
      <div className="donut-layout"><div className="donut" style={{ background: `conic-gradient(${gradient})` }}><div><strong>{distributionTotal.toLocaleString('vi-VN')}</strong><small>Tổng</small></div></div>
        <ul className="source-legend">{distribution.map(([source, value], index) => <li key={source}><i style={{ background: colors[index % colors.length] }} /><span>{source}</span><strong>{value.toLocaleString('vi-VN')}</strong></li>)}</ul></div>
    </article>
  </section>;
}
