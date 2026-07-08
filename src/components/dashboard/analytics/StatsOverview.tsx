// src/components/dashboard/analytics/StatsOverview.tsx

import { useEffect, useMemo, useState } from 'react';

interface StatsOverviewProps {
  days?: number;
}

type Totals = {
  pageViews: number;
  dealViews: number;
  dealClicks: number;
  shares: number;
  contactClicks: number;
};

type DailyStat = Totals & {
  date: string;
  uniqueVisitors?: number;
};

type ChartPoint = DailyStat & {
  total: number;
  x: number;
  y: number;
};

const emptyTotals: Totals = {
  pageViews: 0,
  dealViews: 0,
  dealClicks: 0,
  shares: 0,
  contactClicks: 0,
};

function activityTotal(day: Partial<Totals>) {
  return (
    (day.pageViews || 0) +
    (day.dealViews || 0) +
    (day.dealClicks || 0) +
    (day.shares || 0) +
    (day.contactClicks || 0)
  );
}

function shortDate(dateText: string) {
  return new Date(dateText).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
  });
}

function formatNumber(value: number) {
  return value.toLocaleString('th-TH');
}

export default function StatsOverview({ days = 30 }: StatsOverviewProps) {
  const [totals, setTotals] = useState<Totals>(emptyTotals);
  const [history, setHistory] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(`/api/analytics/stats?days=${days}`, { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error?.message || 'โหลดสถิติไม่สำเร็จ');
        }

        setTotals(payload.data.totals || emptyTotals);
        setHistory(payload.data.stats || []);
      } catch (err: any) {
        setError(err.message || 'โหลดสถิติไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [days]);

  const chartData = useMemo(() => {
    return history.map((day) => ({
      ...day,
      total: activityTotal(day),
    }));
  }, [history]);

  const maxActivity = Math.max(1, ...chartData.map((day) => day.total));
  const totalActivity = activityTotal(totals);
  const hasActivity = totalActivity > 0 || chartData.some((day) => day.total > 0);
  const activeDays = chartData.filter((day) => day.total > 0).length;
  const peakDay = chartData.reduce((best, day) => (day.total > best.total ? day : best), chartData[0] || null);

  const chart = useMemo(() => {
    const width = 1000;
    const height = 260;
    const paddingX = 34;
    const top = 26;
    const bottom = 198;
    const chartHeight = bottom - top;
    const count = Math.max(1, chartData.length - 1);

    const points: ChartPoint[] = chartData.map((day, index) => {
      const x = paddingX + (index / count) * (width - paddingX * 2);
      const ratio = day.total / maxActivity;
      const y = bottom - ratio * chartHeight;
      return { ...day, x, y };
    });

    // Spline curve paths
    let splineLine = '';
    let splineArea = '';
    if (points.length > 0) {
      splineLine = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cp1x = p0.x + (p1.x - p0.x) / 3;
        const cp1y = p0.y;
        const cp2x = p1.x - (p1.x - p0.x) / 3;
        const cp2y = p1.y;
        splineLine += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
      }
      splineArea = `${splineLine} L ${points[points.length - 1].x.toFixed(1)},${bottom} L ${points[0].x.toFixed(1)},${bottom} Z`;
    }

    const step = (width - paddingX * 2) / count;

    return { width, height, paddingX, top, bottom, points, splineLine, splineArea, step };
  }, [chartData, maxActivity]);

  const cards = [
    { label: 'เข้าชมหน้าร้าน', value: totals.pageViews, accent: 'bg-[#ff5a3c]' },
    { label: 'ดูดีล', value: totals.dealViews, accent: 'bg-[#3b82f6]' },
    { label: 'คลิกดีล', value: totals.dealClicks, accent: 'bg-[#10b981]' },
    { label: 'แชร์', value: totals.shares, accent: 'bg-[#14b8a6]' },
    { label: 'คลิกติดต่อ', value: totals.contactClicks, accent: 'bg-[#f59e0b]' },
  ];

  if (loading) {
    return (
      <section className="rounded-3xl border border-border/40 bg-card-bg p-6 shadow-sm">
        <p className="text-sm font-black text-secondary">กำลังโหลดสถิติ...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-danger/20 bg-danger-bg/15 p-6 shadow-sm">
        <p className="text-sm font-black text-danger">{error}</p>
      </section>
    );
  }

  return (
    <section className="space-y-5 rounded-3xl border border-border/40 bg-card-bg p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-primary">Analytics</p>
          <h2 className="text-xl font-black text-secondary">ภาพรวม {days} วันล่าสุด</h2>
        </div>
        <p className="text-xs font-bold text-text-tertiary">
          แนวโน้มกิจกรรมรวมจากการเข้าชม ดูดีล คลิก แชร์ และติดต่อ
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-border/40 bg-bg p-4">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${card.accent}`} />
              <p className="text-xs font-black text-text-tertiary">{card.label}</p>
            </div>
            <p className="mt-2 text-2xl font-black text-secondary">{formatNumber(card.value)}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/40 bg-bg shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border/30 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black text-secondary">แนวโน้มกิจกรรมรายวัน</p>
            <p className="mt-1 text-xs font-bold text-text-tertiary">
              เส้นหลักคือกิจกรรมรวม ส่วนแถบด้านล่างช่วยบอกว่าวันไหนมีความเคลื่อนไหว
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-right">
            <div className="rounded-2xl bg-bg-secondary px-3 py-2">
              <p className="text-[10px] font-black uppercase text-text-tertiary">Events</p>
              <p className="text-sm font-black text-primary">{formatNumber(totalActivity)}</p>
            </div>
            <div className="rounded-2xl bg-bg-secondary px-3 py-2">
              <p className="text-[10px] font-black uppercase text-text-tertiary">Active Days</p>
              <p className="text-sm font-black text-secondary">{activeDays}</p>
            </div>
            <div className="rounded-2xl bg-bg-secondary px-3 py-2">
              <p className="text-[10px] font-black uppercase text-text-tertiary">Peak</p>
              <p className="text-sm font-black text-secondary">{peakDay ? formatNumber(peakDay.total) : '0'}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-b from-bg-secondary/40 to-bg p-4">
          {!hasActivity ? (
            <div className="flex h-72 w-full items-center justify-center rounded-2xl bg-card-bg text-sm font-black text-text-tertiary">
              ยังไม่มีข้อมูลสถิติ
            </div>
          ) : (
            <div className="w-full overflow-x-auto scrollbar-hide">
              <div className="relative min-w-[760px] w-full overflow-y-visible">
                <svg
                  viewBox={`0 0 ${chart.width} ${chart.height}`}
                  className="h-72 w-full overflow-visible"
                  role="img"
                  aria-label="กราฟแนวโน้มกิจกรรมรายวัน"
                >
                  <defs>
                    <linearGradient id="dealdoorAnalyticsAreaMinimal" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.06" />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Minimal horizontal grid lines with values */}
                  {[0.25, 0.5, 0.75].map((ratio) => {
                    const y = chart.top + (chart.bottom - chart.top) * ratio;
                    return (
                      <g key={ratio}>
                        <line
                          x1={chart.paddingX}
                          y1={y}
                          x2={chart.width - chart.paddingX}
                          y2={y}
                          stroke="rgba(100,116,139,0.05)"
                          strokeWidth="1"
                        />
                        <text
                          x={chart.paddingX + 6}
                          y={y - 6}
                          className="fill-current text-[10px] font-bold text-text-tertiary/40"
                        >
                          {formatNumber(Math.round(maxActivity * (1 - ratio)))}
                        </text>
                      </g>
                    );
                  })}

                  <line
                    x1={chart.paddingX}
                    y1={chart.bottom}
                    x2={chart.width - chart.paddingX}
                    y2={chart.bottom}
                    stroke="rgba(100,116,139,0.1)"
                    strokeWidth="1"
                  />
                  <text
                    x={chart.paddingX + 6}
                    y={chart.bottom - 6}
                    className="fill-current text-[10px] font-bold text-text-tertiary/30"
                  >
                    0
                  </text>

                  {/* Clean spline curve and subtle background area */}
                  <path d={chart.splineArea} fill="url(#dealdoorAnalyticsAreaMinimal)" />
                  <path
                    d={chart.splineLine}
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Minimal barcode-like bottom heatmap capsule indicators */}
                  {chart.points.map((point, index) => {
                    const barHeight = point.total > 0 ? Math.max(3, (point.total / maxActivity) * 16) : 2;
                    const isHovered = hoveredIndex === index;
                    return (
                      <rect
                        key={`bar-${point.date}`}
                        x={point.x - 2}
                        y={230 - barHeight}
                        width="4"
                        height={barHeight}
                        rx="2"
                        fill={isHovered ? 'var(--color-primary)' : point.total > 0 ? 'var(--color-text-tertiary)' : 'var(--color-border)'}
                        opacity={isHovered ? 1 : point.total > 0 ? 0.35 : 0.2}
                        className="transition-all duration-150"
                      />
                    );
                  })}

                  {/* Bottom Date Labels */}
                  {chart.points.map((point, index) => {
                    const shouldShowLabel = index === 0 || index === chart.points.length - 1 || index % 7 === 0;
                    if (!shouldShowLabel) return null;
                    return (
                      <text
                        key={`lbl-${point.date}`}
                        x={point.x}
                        y="254"
                        textAnchor="middle"
                        className="fill-current text-[11px] font-bold text-text-tertiary/50"
                      >
                        {shortDate(point.date)}
                      </text>
                    );
                  })}

                  {/* Snapping vertical cursor and point marker shown on hover */}
                  {hoveredIndex !== null && chart.points[hoveredIndex] && (
                    <g>
                      <line
                        x1={chart.points[hoveredIndex].x}
                        y1={chart.top}
                        x2={chart.points[hoveredIndex].x}
                        y2={chart.bottom}
                        stroke="rgba(100,116,139,0.15)"
                        strokeWidth="1.5"
                        pointerEvents="none"
                      />
                      <circle
                        cx={chart.points[hoveredIndex].x}
                        cy={chart.points[hoveredIndex].y}
                        r="6"
                        fill="#ffffff"
                        stroke="var(--color-primary)"
                        strokeWidth="3.5"
                        pointerEvents="none"
                      />
                    </g>
                  )}

                  {/* Invisible mouse capture hit areas */}
                  {chart.points.map((point, index) => (
                    <rect
                      key={`hit-${point.date}`}
                      x={point.x - chart.step / 2}
                      y={0}
                      width={chart.step}
                      height={chart.height}
                      fill="transparent"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="cursor-pointer"
                    />
                  ))}
                </svg>

                {/* Floating Minimal Tooltip Card */}
                {hoveredIndex !== null && chart.points[hoveredIndex] && (
                  <div
                    className="absolute pointer-events-none z-10 w-48 rounded-xl border border-border/30 bg-card-bg/90 p-2.5 shadow-md backdrop-blur-sm transition-all duration-100 ease-out animate-fade-in"
                    style={{
                      left: `${(chart.points[hoveredIndex].x / chart.width) * 100}%`,
                      top: `${(chart.points[hoveredIndex].y / chart.height) * 100 - 15}%`,
                      transform: `translate(${chart.points[hoveredIndex].x > chart.width / 2 ? '-112%' : '12%'}, -50%)`,
                    }}
                  >
                    <div className="flex items-center justify-between border-b border-border/10 pb-1.5 mb-1.5">
                      <p className="text-[10px] font-bold text-text-primary">
                        {shortDate(chart.points[hoveredIndex].date)}
                      </p>
                      <span className="text-[10px] font-extrabold text-primary">
                        รวม {formatNumber(chart.points[hoveredIndex].total)}
                      </span>
                    </div>

                    <div className="space-y-1 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-text-tertiary">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#ff5a3c]" />
                          เข้าชมหน้าร้าน
                        </span>
                        <span className="font-bold text-text-secondary">
                          {formatNumber(chart.points[hoveredIndex].pageViews || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-text-tertiary">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#3b82f6]" />
                          ดูดีล
                        </span>
                        <span className="font-bold text-text-secondary">
                          {formatNumber(chart.points[hoveredIndex].dealViews || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-text-tertiary">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                          คลิกดีล
                        </span>
                        <span className="font-bold text-text-secondary">
                          {formatNumber(chart.points[hoveredIndex].dealClicks || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-text-tertiary">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6]" />
                          แชร์
                        </span>
                        <span className="font-bold text-text-secondary">
                          {formatNumber(chart.points[hoveredIndex].shares || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-text-tertiary">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                          คลิกติดต่อ
                        </span>
                        <span className="font-bold text-text-secondary">
                          {formatNumber(chart.points[hoveredIndex].contactClicks || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
