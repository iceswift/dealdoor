// src/components/dashboard/StatCards.tsx

import { useMemo, useState } from 'react';

interface DailyPoint {
  date: string;
  views: number;
  shares: number;
  clicks: number;
}

interface StatCardsProps {
  /** Continuous daily series, ascending by date, ~60 days ending today. */
  daily: DailyPoint[];
}

type WindowKey = 1 | 7 | 30;
type MetricKey = 'views' | 'shares' | 'clicks';

const WINDOWS: { key: WindowKey; label: string }[] = [
  { key: 1, label: 'วันนี้' },
  { key: 7, label: '7 วัน' },
  { key: 30, label: '30 วัน' },
];

const METRICS: {
  key: MetricKey;
  label: string;
  unit: string;
  accent: 'success' | 'info' | 'primary';
  icon: JSX.Element;
}[] = [
  {
    key: 'views',
    label: 'ผู้เข้าชม',
    unit: 'ครั้ง',
    accent: 'success',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  {
    key: 'clicks',
    label: 'คลิกดีล',
    unit: 'ครั้ง',
    accent: 'info',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
  },
  {
    key: 'shares',
    label: 'แชร์',
    unit: 'ครั้ง',
    accent: 'primary',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
  },
];

const ACCENT: Record<string, { chip: string; line: string; fill: string }> = {
  success: { chip: 'bg-success-bg text-success', line: 'var(--color-success, #10b981)', fill: 'rgba(16,185,129,0.12)' },
  info: { chip: 'bg-info-bg text-info', line: 'var(--color-info, #3b82f6)', fill: 'rgba(59,130,246,0.12)' },
  primary: { chip: 'bg-primary-light text-primary', line: 'var(--color-primary, #f97316)', fill: 'rgba(249,115,22,0.12)' },
};

function sumRange(daily: DailyPoint[], metric: MetricKey, from: number, to: number): number {
  let total = 0;
  for (let i = from; i < to; i++) {
    if (daily[i]) total += daily[i][metric] || 0;
  }
  return total;
}

function Sparkline({ values, line, fill }: { values: number[]; line: string; fill: string }) {
  const w = 100;
  const h = 30;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const pts = values.map((v, i) => {
    const x = i * step;
    const y = h - (v / max) * (h - 4) - 2;
    return [x, y] as const;
  });
  const linePath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-8 overflow-visible">
      <path d={areaPath} fill={fill} stroke="none" />
      <path d={linePath} fill="none" stroke={line} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {last && <circle cx={last[0]} cy={last[1]} r={2.2} fill={line} />}
    </svg>
  );
}

export default function StatCards({ daily }: StatCardsProps) {
  const [win, setWin] = useState<WindowKey>(7);

  const computed = useMemo(() => {
    const n = daily.length;
    return METRICS.map(m => {
      const current = sumRange(daily, m.key, n - win, n);
      const previous = sumRange(daily, m.key, n - win * 2, n - win);
      let changePct: number | null;
      if (previous > 0) changePct = Math.round(((current - previous) / previous) * 100);
      else changePct = current > 0 ? 100 : null;
      // Trailing 14-day sparkline for visual context regardless of window.
      const spark = daily.slice(Math.max(0, n - 14)).map(d => d[m.key] || 0);
      return { ...m, current, changePct, spark };
    });
  }, [daily, win]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-text-tertiary uppercase tracking-wider">ภาพรวมสถิติ</h2>
        <div className="flex gap-1 bg-bg-secondary/60 rounded-xl p-1 border border-border/20">
          {WINDOWS.map(wd => (
            <button
              key={wd.key}
              onClick={() => setWin(wd.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer ${
                win === wd.key
                  ? 'bg-card-bg text-primary shadow-sm border border-border/20'
                  : 'text-text-tertiary hover:text-text-secondary border border-transparent'
              }`}
            >
              {wd.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {computed.map(m => {
          const accent = ACCENT[m.accent];
          const up = m.changePct !== null && m.changePct > 0;
          const down = m.changePct !== null && m.changePct < 0;
          return (
            <div
              key={m.key}
              className="rounded-2xl border border-border/20 bg-card-bg/70 backdrop-blur-md p-5 shadow-sm hover:border-primary/15 hover:shadow-md transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-black text-text-tertiary uppercase tracking-wider flex items-center gap-2">
                    <span className={`h-7 w-7 rounded-lg flex items-center justify-center ${accent.chip}`}>
                      <span className="h-4 w-4">{m.icon}</span>
                    </span>
                    {m.label}
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-secondary tracking-tight mt-2">
                    {m.current.toLocaleString('th-TH')}
                    <span className="text-xs font-bold text-text-tertiary ml-1">{m.unit}</span>
                  </p>
                </div>
                {m.changePct !== null && (
                  <span
                    className={`inline-flex items-center gap-0.5 text-[11px] font-black px-2 py-1 rounded-lg flex-shrink-0 ${
                      up ? 'bg-success-bg text-success' : down ? 'bg-danger-bg/60 text-danger' : 'bg-bg-secondary text-text-tertiary'
                    }`}
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      {down ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      )}
                    </svg>
                    {Math.abs(m.changePct)}%
                  </span>
                )}
              </div>
              <div className="mt-3 -mx-1">
                <Sparkline values={m.spark} line={accent.line} fill={accent.fill} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
