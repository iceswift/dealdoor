// src/components/dashboard/analytics/AnalyticsDashboard.tsx

import { useEffect, useMemo, useState, Fragment } from 'react';
import { DEAL_CATEGORY_COLORS, DEAL_CATEGORY_LABELS, type DealCategory } from '../../../lib/constants';

type Totals = {
  pageViews: number;
  dealViews: number;
  dealClicks: number;
  claimStarts: number;
  couponCopies: number;
  contactStarts: number;
  redemptions: number;
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

type DealStat = {
  dealId: string;
  title: string | null;
  category: string | null;
  views: number;
  clicks: number;
  redemptions: number;
  shares: number;
};

type CategoryStat = {
  category: string;
  views: number;
  clicks: number;
};

type DealQuotaSummary = {
  limitedDealCount: number;
  unlimitedDealCount: number;
  limitedCapacity: number;
  redeemedCapacity: number;
  remainingCapacity: number;
  fillRate: number | null;
  lowStockDealCount: number;
  exhaustedDealCount: number;
};

type QuotaAnalytics = {
  deals: DealQuotaStat[];
  summary: DealQuotaSummary;
};

type DealQuotaStat = {
  dealId: string;
  title: string;
  maxRedemptions: number | null;
  redemptions: number;
  remaining: number | null;
  fillRate: number | null;
  status: 'unlimited' | 'available' | 'low_stock' | 'exhausted';
};

const emptyTotals: Totals = {
  pageViews: 0,
  dealViews: 0,
  dealClicks: 0,
  claimStarts: 0,
  couponCopies: 0,
  contactStarts: 0,
  redemptions: 0,
  shares: 0,
  contactClicks: 0,
};

const emptyQuota: QuotaAnalytics = {
  deals: [],
  summary: {
    limitedDealCount: 0,
    unlimitedDealCount: 0,
    limitedCapacity: 0,
    redeemedCapacity: 0,
    remainingCapacity: 0,
    fillRate: null,
    lowStockDealCount: 0,
    exhaustedDealCount: 0,
  },
};

const RANGE_OPTIONS = [
  { value: 7, label: '7 วัน' },
  { value: 30, label: '30 วัน' },
  { value: 90, label: '90 วัน' },
];

const WEEKDAY_LABELS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function activityTotal(day: Partial<Totals>) {
  return (
    (day.pageViews || 0) +
    (day.dealViews || 0) +
    (day.dealClicks || 0) +
    (day.claimStarts || 0) +
    (day.couponCopies || 0) +
    (day.contactStarts || 0) +
    (day.redemptions || 0) +
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

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

const Icons = {
  eye: (className?: string) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ),
  deal: (className?: string) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 0 0 3.181 0l4.318-4.318a2.25 2.25 0 0 0 0-3.181l-9.58-9.581A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  ),
  click: (className?: string) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12.5 15.5L19 22M4.5 4.5l5.5 15.5 2.5-4.5 4.5-2.5L4.5 4.5Z" />
    </svg>
  ),
  share: (className?: string) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
    </svg>
  ),
  phone: (className?: string) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 0 1-7.108-7.108c-.155-.44.01-.928.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  )
};

const cardConfigs: Record<string, {
  label: string;
  icon: keyof typeof Icons;
  colorClass: string;
  bgClass: string;
}> = {
  pageViews: { label: 'เข้าชมหน้าร้าน', icon: 'eye', colorClass: 'text-primary', bgClass: 'bg-primary/10' },
  dealViews: { label: 'ดูดีล', icon: 'deal', colorClass: 'text-info', bgClass: 'bg-info/10' },
  dealClicks: { label: 'คลิกดีล', icon: 'click', colorClass: 'text-success', bgClass: 'bg-success/10' },
  claimStarts: { label: 'เริ่มรับสิทธิ์', icon: 'click', colorClass: 'text-primary', bgClass: 'bg-primary/10' },
  shares: { label: 'แชร์', icon: 'share', colorClass: 'text-accent', bgClass: 'bg-accent/10' },
  contactClicks: { label: 'คลิกติดต่อ', icon: 'phone', colorClass: 'text-warning', bgClass: 'bg-warning/10' },
};

export default function AnalyticsDashboard() {
  const [days, setDays] = useState(30);
  const [totals, setTotals] = useState<Totals>(emptyTotals);
  const [previousTotals, setPreviousTotals] = useState<Totals>(emptyTotals);
  const [history, setHistory] = useState<DailyStat[]>([]);
  const [topDeals, setTopDeals] = useState<DealStat[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryStat[]>([]);
  const [quota, setQuota] = useState<QuotaAnalytics>(emptyQuota);
  const [performanceSort, setPerformanceSort] = useState<'views' | 'redemptions' | 'fillRate'>('views');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [funnelGrown, setFunnelGrown] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics/stats?days=${days}`, { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error?.message || 'โหลดสถิติไม่สำเร็จ');
        }
        if (cancelled) return;

        setTotals(payload.data.totals || emptyTotals);
        setPreviousTotals(payload.data.previousTotals || emptyTotals);
        setHistory(payload.data.stats || []);
        setTopDeals(payload.data.topDeals || []);
        setCategoryBreakdown(payload.data.categoryBreakdown || []);
        setQuota(payload.data.quota || emptyQuota);
        setError('');
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'โหลดสถิติไม่สำเร็จ');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, [days]);

  // Replay the funnel's fill-in animation whenever fresh totals arrive.
  useEffect(() => {
    if (loading) {
      setFunnelGrown(false);
      return;
    }
    const frame = requestAnimationFrame(() => setFunnelGrown(true));
    return () => cancelAnimationFrame(frame);
  }, [loading, totals]);

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

  // Calendar heatmap: bucket days into weekday columns/rows
  const heatmapWeeks = useMemo(() => {
    if (chartData.length === 0) return [];
    const weeks: (ChartPoint | null)[][] = [];
    let currentWeek: (ChartPoint | null)[] = new Array(7).fill(null);

    chartData.forEach((day) => {
      const weekday = new Date(day.date).getDay();
      currentWeek[weekday] = { ...day, total: activityTotal(day), x: 0, y: 0 };
      if (weekday === 6) {
        weeks.push(currentWeek);
        currentWeek = new Array(7).fill(null);
      }
    });
    if (currentWeek.some((d) => d !== null)) weeks.push(currentWeek);
    return weeks;
  }, [chartData]);

  const maxHeatmapValue = Math.max(1, ...chartData.map((d) => activityTotal(d)));

  const heatColor = (value: number) => {
    if (value === 0) return 'var(--color-bg-tertiary)';
    const ratio = value / maxHeatmapValue;
    if (ratio > 0.75) return 'var(--color-primary)';
    if (ratio > 0.5) return 'color-mix(in srgb, var(--color-primary) 70%, transparent)';
    if (ratio > 0.25) return 'color-mix(in srgb, var(--color-primary) 40%, transparent)';
    return 'color-mix(in srgb, var(--color-primary) 20%, transparent)';
  };

  const cards = [
    { key: 'pageViews', label: 'เข้าชมหน้าร้าน', value: totals.pageViews, prev: previousTotals.pageViews, accent: 'bg-[#ff5a3c]' },
    { key: 'dealViews', label: 'ดูดีล', value: totals.dealViews, prev: previousTotals.dealViews, accent: 'bg-[#3b82f6]' },
    { key: 'dealClicks', label: 'คลิกดีล', value: totals.dealClicks, prev: previousTotals.dealClicks, accent: 'bg-[#10b981]' },
    { key: 'claimStarts', label: 'เริ่มรับสิทธิ์', value: totals.claimStarts, prev: previousTotals.claimStarts, accent: 'bg-[#ff5a3c]' },
    { key: 'shares', label: 'แชร์', value: totals.shares, prev: previousTotals.shares, accent: 'bg-[#14b8a6]' },
    { key: 'contactClicks', label: 'คลิกติดต่อ', value: totals.contactClicks, prev: previousTotals.contactClicks, accent: 'bg-[#f59e0b]' },
  ];

  const funnelStages = [
    { key: 'dealViews', label: 'ดูดีล', value: totals.dealViews },
    { key: 'claimStarts', label: 'เริ่มรับสิทธิ์', value: totals.claimStarts },
    { key: 'redemptions', label: 'ยืนยันใช้สิทธิ์', value: totals.redemptions },
  ];
  const funnelMax = Math.max(1, funnelStages[0].value);

  const funnelDropRates = funnelStages.map((stage, index) => {
    if (index === 0) return null;
    const prev = funnelStages[index - 1];
    if (prev.value <= 0) return null;
    return Math.round((1 - stage.value / prev.value) * 100);
  });
  const worstDropIndex = funnelDropRates.reduce((worst, rate, index) => {
    if (rate === null) return worst;
    if (worst === -1 || rate > (funnelDropRates[worst] ?? -Infinity)) return index;
    return worst;
  }, -1);
  const overallConversion = funnelStages[0].value > 0
    ? Math.round((funnelStages[funnelStages.length - 1].value / funnelStages[0].value) * 100)
    : null;

  const maxCategoryValue = Math.max(1, ...categoryBreakdown.map((c) => c.views));
  const quotaSummary = quota.summary || emptyQuota.summary;
  const hasLimitedDeals = quotaSummary.limitedDealCount > 0;
  const performanceDeals = useMemo(() => {
    const eventMetrics = new Map(topDeals.map((deal) => [deal.dealId, deal]));
    const rows = quota.deals.map((deal) => {
      const metrics = eventMetrics.get(deal.dealId);
      return {
        ...deal,
        category: metrics?.category || null,
        views: metrics?.views || 0,
        clicks: metrics?.clicks || 0,
        shares: metrics?.shares || 0,
        periodRedemptions: metrics?.redemptions || 0,
      };
    });

    for (const metrics of topDeals) {
      if (rows.some((deal) => deal.dealId === metrics.dealId)) continue;
      rows.push({
        dealId: metrics.dealId,
        title: metrics.title || 'ไม่มีชื่อดีล',
        maxRedemptions: null,
        redemptions: metrics.redemptions || 0,
        remaining: null,
        fillRate: null,
        status: 'unlimited',
        category: metrics.category,
        views: metrics.views || 0,
        clicks: metrics.clicks || 0,
        shares: metrics.shares || 0,
        periodRedemptions: metrics.redemptions || 0,
      });
    }

    return rows.sort((a, b) => {
      if (performanceSort === 'redemptions') return b.redemptions - a.redemptions || b.views - a.views;
      if (performanceSort === 'fillRate') return (b.fillRate ?? -1) - (a.fillRate ?? -1) || b.redemptions - a.redemptions;
      return b.views - a.views || b.redemptions - a.redemptions;
    });
  }, [quota.deals, topDeals, performanceSort]);

  if (loading && !hasActivity && history.length === 0) {
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
    <div className="space-y-6">
      <section className="space-y-5 rounded-2xl border border-border/40 bg-card-bg p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-primary">Analytics</p>
            <h2 className="text-xl font-black text-secondary">ภาพรวมสถิติล่าสุดในรอบ {days} วัน</h2>
            <p className="mt-1 text-xs font-bold text-text-tertiary">
              กิจกรรมรวมจากหน้าร้าน ดีล การแชร์ และการคลิกติดต่อ
            </p>
          </div>

          <div className="flex shrink-0 gap-1 rounded-xl border border-border/40 bg-bg p-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDays(option.value)}
                className={`min-h-[36px] rounded-lg px-4 text-xs font-black transition-colors ${
                  days === option.value
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-primary'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <section className="rounded-2xl border border-border/40 bg-card-bg p-5" aria-labelledby="quota-overview-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-primary">Deal capacity</p>
              <h3 id="quota-overview-title" className="mt-1 text-base font-black text-secondary">ภาพรวมสิทธิ์ของดีล</h3>
              <p className="mt-1 text-xs font-bold text-text-tertiary">นับจากยอดที่ร้านยืนยันใช้สิทธิ์สะสม ไม่ขึ้นกับช่วงวันที่ของกราฟ</p>
            </div>
            <span className="self-start rounded-full bg-bg-secondary px-3 py-1.5 text-[10px] font-black text-text-secondary">ตลอดอายุดีล</span>
          </div>

          {!hasLimitedDeals ? (
            <div className="mt-5 rounded-xl border border-dashed border-border/50 bg-bg-secondary/45 p-4">
              <p className="text-sm font-black text-secondary">ยังไม่มีดีลที่กำหนดจำนวนสิทธิ์</p>
              <p className="mt-1 text-xs font-bold leading-relaxed text-text-tertiary">ดีลไม่จำกัดจำนวนจะไม่ถูกนำมาคำนวณโควตาหรือ fill rate</p>
              <a href="/dashboard/deals" className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-primary px-4 text-xs font-black text-white">จัดการดีล</a>
            </div>
          ) : (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-border/30 bg-bg-secondary/55 p-3.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">โควตารวม</p>
                  <p className="mt-1 text-xl font-black text-secondary">{formatNumber(quotaSummary.limitedCapacity)} <span className="text-xs text-text-tertiary">สิทธิ์</span></p>
                </div>
                <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">ยืนยันใช้แล้ว</p>
                  <p className="mt-1 text-xl font-black text-secondary">{formatNumber(quotaSummary.redeemedCapacity)} <span className="text-xs text-text-tertiary">สิทธิ์</span></p>
                </div>
                <div className="rounded-xl border border-info/15 bg-info/5 p-3.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-info">เหลืออยู่</p>
                  <p className="mt-1 text-xl font-black text-secondary">{formatNumber(quotaSummary.remainingCapacity)} <span className="text-xs text-text-tertiary">สิทธิ์</span></p>
                </div>
                <div className="rounded-xl border border-primary/15 bg-primary/5 p-3.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-primary">Fill rate</p>
                  <p className="mt-1 text-xl font-black text-secondary">{quotaSummary.fillRate ?? 0}<span className="text-xs text-text-tertiary">%</span></p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between gap-3 text-[11px] font-black text-text-tertiary">
                  <span>ใช้สิทธิ์แล้ว {formatNumber(quotaSummary.redeemedCapacity)} จาก {formatNumber(quotaSummary.limitedCapacity)}</span>
                  <span>{quotaSummary.fillRate ?? 0}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-tertiary">
                  <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${quotaSummary.fillRate ?? 0}%` }} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black">
                {quotaSummary.lowStockDealCount > 0 && <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-amber-700 dark:text-amber-300">ใกล้ครบ {quotaSummary.lowStockDealCount} ดีล</span>}
                {quotaSummary.exhaustedDealCount > 0 && <span className="rounded-full bg-rose-500/10 px-3 py-1.5 text-rose-700 dark:text-rose-300">ครบสิทธิ์แล้ว {quotaSummary.exhaustedDealCount} ดีล</span>}
                {quotaSummary.unlimitedDealCount > 0 && <span className="rounded-full bg-bg-secondary px-3 py-1.5 text-text-secondary">ไม่จำกัด {quotaSummary.unlimitedDealCount} ดีล</span>}
              </div>
            </>
          )}
        </section>

        {!hasActivity ? (
          <div className="rounded-2xl border border-dashed border-border/50 p-8 text-center">
            <p className="text-sm font-black text-secondary">ยังไม่มีข้อมูลสถิติบันทึกไว้สำหรับช่วงนี้</p>
            <p className="mt-1 text-xs font-bold text-text-tertiary">
              เพื่อเริ่มต้นการเก็บตัวชี้วัดกรุณาแชร์พิกัดหน้าร้านค้าของคุณให้กับกลุ่มลูกค้า
            </p>
            <a
              href="/dashboard"
              className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-primary px-5 text-sm font-black text-white"
            >
              ไปหน้าแชร์ร้านค้า
            </a>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              {cards.map((card) => {
                const change = percentChange(card.value, card.prev);
                const conf = cardConfigs[card.key];
                return (
                  <div key={card.key} className="rounded-2xl border border-border/40 bg-card-bg p-4">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">{conf.label}</p>
                        <p className="text-2xl font-black text-secondary tracking-tight">{formatNumber(card.value)}</p>
                      </div>
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${conf.bgClass} ${conf.colorClass}`}>
                        {Icons[conf.icon]('h-4.5 w-4.5')}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border/20 pt-2 text-[10px] font-bold text-text-tertiary">
                      <span>เทียบกับช่วงก่อนหน้า</span>
                      {change !== null ? (
                        <span className={change > 0 ? 'font-black text-success' : change < 0 ? 'font-black text-danger' : 'font-black text-text-tertiary'}>
                          {change > 0 ? '+' : ''}{change}%
                        </span>
                      ) : (
                        <span className="text-[9px] text-text-tertiary">ไม่มีประวัติ</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Conversion funnel */}
            <div className="rounded-2xl border border-border/40 bg-card-bg p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-black text-secondary">ช่องทางการเปลี่ยนเป็นลูกค้า</p>
                    <p className="mt-0.5 text-xs font-bold text-text-tertiary">อัตราการหลุดออกในแต่ละขั้นตอน</p>
                  </div>
                </div>
                {overallConversion !== null && (
                  <p className="text-xs font-bold text-text-tertiary">
                    Overall <span className="text-sm font-black text-primary">{overallConversion}%</span>
                  </p>
                )}
              </div>

              <div className="mt-5 space-y-3">
                {funnelStages.map((stage, index) => {
                  const widthPercent = Math.max(6, (stage.value / funnelMax) * 100);
                  const isWorstDrop = index === worstDropIndex;
                  const dropRate = funnelDropRates[index];

                  return (
                    <div key={stage.key} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 truncate text-xs font-bold text-text-tertiary">{stage.label}</span>
                      <div className="h-7 flex-1 overflow-hidden rounded-lg bg-bg-tertiary">
                        <div
                          className="flex h-full items-center rounded-lg bg-primary px-2.5 text-xs font-black text-white transition-[width] duration-500 ease-out"
                          style={{ width: `${funnelGrown ? widthPercent : 0}%`, opacity: 1 - index * 0.18 }}
                        >
                          {formatNumber(stage.value)}
                        </div>
                      </div>
                      <span className={`w-20 shrink-0 text-right text-[11px] font-bold ${isWorstDrop && dropRate ? 'text-danger' : 'text-text-tertiary'}`}>
                        {dropRate !== null && dropRate > 0 ? `-${dropRate}%` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 grid gap-3 border-t border-border/25 pt-4 sm:grid-cols-3">
                <div className="rounded-xl bg-bg-secondary/70 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">Coupon copied</p>
                  <p className="mt-1 text-lg font-black text-secondary">{formatNumber(totals.couponCopies)}</p>
                </div>
                <div className="rounded-xl bg-bg-secondary/70 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">Contact started</p>
                  <p className="mt-1 text-lg font-black text-secondary">{formatNumber(totals.contactStarts)}</p>
                </div>
                <div className="rounded-xl bg-emerald-500/10 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Redeemed</p>
                  <p className="mt-1 text-lg font-black text-secondary">{formatNumber(totals.redemptions)}</p>
                </div>
              </div>
              <p className="mt-3 text-[10px] font-bold leading-relaxed text-text-tertiary">
                Redeemed คือยอดที่ร้านกดยืนยันเองหลังลูกค้าใช้สิทธิ์ ส่วน Coupon copied และ Contact started คือความตั้งใจรับสิทธิ์จากหน้าเว็บ
              </p>
            </div>

            <div className="rounded-2xl border border-border/40 bg-card-bg">
              <div className="flex flex-col gap-4 border-b border-border/30 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-black text-secondary">แนวโน้มกิจกรรมรายวัน</p>
                    <p className="mt-1 text-xs font-bold text-text-tertiary">
                      เส้นสถิติหลักคือกิจกรรมรวม ส่วนแถบแท่งช่วยชี้วัดความถี่และระดับกิจกรรมที่พุ่งสูงในแต่ละวัน
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  <div className="flex items-center gap-2 rounded-xl bg-bg-secondary p-2.5 sm:p-3.5 shadow-sm border border-border/20">
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <svg className="h-4 w-4 sm:h-4.5 sm:w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-text-tertiary leading-none">Events</p>
                      <p className="mt-1 text-xs sm:text-sm font-black text-primary leading-none">{formatNumber(totalActivity)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl bg-bg-secondary p-2.5 sm:p-3.5 shadow-sm border border-border/20">
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                      <svg className="h-4 w-4 sm:h-4.5 sm:w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-text-tertiary leading-none">Active Days</p>
                      <p className="mt-1 text-xs sm:text-sm font-black text-secondary leading-none">{activeDays}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl bg-bg-secondary p-2.5 sm:p-3.5 shadow-sm border border-border/20">
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <svg className="h-4 w-4 sm:h-4.5 sm:w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-text-tertiary leading-none">Peak</p>
                      <p className="mt-1 text-xs sm:text-sm font-black text-secondary leading-none">{peakDay ? formatNumber(peakDay.total) : '0'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4">
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
                          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                        </linearGradient>
                      </defs>

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

                      <path d={chart.splineArea} fill="url(#dealdoorAnalyticsAreaMinimal)" />
                      <path
                        d={chart.splineLine}
                        fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

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

                      {chart.points.map((point, index) => {
                        const labelStep = days <= 7 ? 1 : days <= 30 ? 7 : 14;
                        const shouldShowLabel = index === 0 || index === chart.points.length - 1 || index % labelStep === 0;
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
                            r="5"
                            fill="#ffffff"
                            stroke="var(--color-primary)"
                            strokeWidth="3"
                            pointerEvents="none"
                          />
                        </g>
                      )}

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

                    {hoveredIndex !== null && chart.points[hoveredIndex] && (
                      <div
                        className="absolute pointer-events-none z-20 w-52 rounded-xl border border-border/40 bg-card-bg p-3 shadow-md"
                        style={{
                          left: `${(chart.points[hoveredIndex].x / chart.width) * 100}%`,
                          top: `${(chart.points[hoveredIndex].y / chart.height) * 100 - 15}%`,
                          transform: `translate(${chart.points[hoveredIndex].x > chart.width / 2 ? '-112%' : '12%'}, -50%)`,
                        }}
                      >
                        <div className="flex items-center justify-between border-b border-border/10 pb-2 mb-2">
                          <p className="text-[11px] font-black text-secondary">
                            {shortDate(chart.points[hoveredIndex].date)}
                          </p>
                          <span className="text-[11px] font-black text-primary">
                            รวม {formatNumber(chart.points[hoveredIndex].total)}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-[10px] font-bold">
                          {cards.slice(0, 5).map((card) => {
                            const conf = cardConfigs[card.key];
                            return (
                              <div key={card.key} className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-text-tertiary">
                                  <span className={`h-1.5 w-1.5 rounded-full ${conf.colorClass.replace('text-', 'bg-')}`} />
                                  {conf.label}
                                </span>
                                <span className="font-black text-secondary">
                                  {formatNumber((chart.points[hoveredIndex] as any)[card.key] || 0)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Activity heatmap + category breakdown */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/40 bg-card-bg p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-black text-secondary">ปฏิทินกิจกรรม</p>
                    <p className="mt-0.5 text-xs font-bold text-text-tertiary">ความเข้มข้นของกิจกรรมแต่ละวันในรอบสัปดาห์</p>
                  </div>
                </div>
                <div className="mt-5 overflow-x-auto scrollbar-hide">
                  <div className="inline-flex gap-1.5">
                    <div className="flex flex-col gap-1 pr-1.5">
                      {WEEKDAY_LABELS.map((label) => (
                        <span key={label} className="flex h-3.5 w-6 items-center text-[9px] font-black text-text-tertiary">
                          {label}
                        </span>
                      ))}
                    </div>
                    {heatmapWeeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col gap-1">
                        {week.map((day, dayIndex) => (
                          <div
                            key={dayIndex}
                            title={day ? `${shortDate(day.date)}: ${formatNumber(day.total)} กิจกรรม` : ''}
                            className="h-3.5 w-3.5 rounded-[3px]"
                            style={{ backgroundColor: day ? heatColor(day.total) : 'transparent' }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/40 bg-card-bg p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-black text-secondary">แยกตามหมวดหมู่ดีล</p>
                    <p className="mt-0.5 text-xs font-bold text-text-tertiary">หมวดหมู่ดีลที่ได้รับสถิติการเข้าดูสูงสุด</p>
                  </div>
                </div>
                {categoryBreakdown.length === 0 ? (
                  <p className="mt-5 text-xs font-bold text-text-tertiary">ยังไม่มีข้อมูลตามหมวดหมู่</p>
                ) : (
                  <div className="mt-5 space-y-2.5">
                    {categoryBreakdown.slice(0, 6).map((cat) => {
                      const color = DEAL_CATEGORY_COLORS[cat.category as DealCategory] || '#6B7280';
                      const label = DEAL_CATEGORY_LABELS[cat.category as DealCategory] || cat.category;
                      const widthPercent = Math.max(4, (cat.views / maxCategoryValue) * 100);
                      return (
                        <div key={cat.category} className="flex items-center gap-3">
                          <span className="w-16 shrink-0 truncate text-[11px] font-bold text-text-secondary">{label}</span>
                          <div className="h-5 flex-1 overflow-hidden rounded-md bg-bg-tertiary">
                            <div
                              className="h-full rounded-md transition-[width] duration-500"
                              style={{ width: `${widthPercent}%`, backgroundColor: color }}
                            />
                          </div>
                          <span className="w-8 shrink-0 text-right text-[11px] font-bold text-text-tertiary">{formatNumber(cat.views)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-border/40 bg-card-bg p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.906a1 1 0 00.95-.69l1.519-4.674z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-primary">Deal Performance</p>
            <h2 className="text-xl font-black text-secondary">ดีลยอดนิยม</h2>
            <p className="mt-0.5 text-xs font-bold text-text-tertiary">จัดอันดับตามจำนวนเข้าชมและมีปฏิสัมพันธ์จริง</p>
          </div>
        </div>

        <div className="mb-4 flex rounded-xl border border-border/40 bg-bg p-1">
          {[
            { id: 'views', label: 'ความนิยม' },
            { id: 'redemptions', label: 'ใช้สิทธิ์' },
            { id: 'fillRate', label: 'Fill rate' },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setPerformanceSort(option.id as typeof performanceSort)}
              className={`min-h-9 flex-1 rounded-lg px-3 text-[10px] font-black transition-colors ${performanceSort === option.id ? 'bg-primary text-white' : 'text-text-secondary hover:text-primary'}`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {performanceDeals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/45 p-8 text-center">
            <p className="text-sm font-black text-secondary">ยังไม่มีข้อมูลดีลยอดนิยมในช่วงนี้</p>
            <p className="mt-1 text-xs font-bold text-text-tertiary">สร้างดีลใหม่และแชร์หน้าร้านเพื่อกระตุ้นสถิติแรกของคุณ</p>
            <a
              href="/dashboard/deals/new"
              className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-primary px-5 text-sm font-black text-white"
            >
              สร้างดีลแรกของร้าน
            </a>
          </div>
        ) : (
          <div className="grid gap-2.5">
            {performanceDeals.map((deal, index) => {
              const color = DEAL_CATEGORY_COLORS[deal.category as DealCategory] || '#6B7280';
              const label = DEAL_CATEGORY_LABELS[deal.category as DealCategory] || deal.category || 'ทั่วไป';
              const maxDealViews = Math.max(1, ...performanceDeals.map((d) => d.views));
              const proportion = Math.max(6, (deal.views / maxDealViews) * 100);
              const quotaLabel = deal.maxRedemptions === null
                ? `ใช้แล้ว ${formatNumber(deal.redemptions)} สิทธิ์`
                : `ใช้แล้ว ${formatNumber(deal.redemptions)} / ${formatNumber(deal.maxRedemptions)} สิทธิ์`;
              const statusMeta = deal.status === 'exhausted'
                ? { label: 'ครบสิทธิ์แล้ว', className: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' }
                : deal.status === 'low_stock'
                  ? { label: 'ใกล้ครบ', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' }
                  : deal.status === 'unlimited'
                    ? { label: 'ไม่จำกัด', className: 'bg-bg-secondary text-text-secondary' }
                    : { label: 'ยังรับสิทธิ์ได้', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' };

              return (
                <a
                  key={deal.dealId}
                  href={`/dashboard/deals/edit?id=${deal.dealId}`}
                  className="block rounded-xl border border-border/30 p-4 transition-colors hover:border-primary/30"
                >
                  <div className="grid gap-3 sm:grid-cols-[32px_1fr_auto] sm:items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-tertiary text-xs font-black text-text-secondary">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-black text-secondary">{deal.title || 'ไม่มีชื่อดีล'}</p>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black text-white"
                          style={{ backgroundColor: color }}
                        >
                          {label}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-text-tertiary">
                      <span>{formatNumber(deal.views)} views</span>
                      <span>{formatNumber(deal.clicks)} clicks</span>
                      <span>{formatNumber(deal.shares)} shares</span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-bg-tertiary">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${deal.fillRate ?? proportion}%`,
                            backgroundColor: deal.maxRedemptions === null ? color : 'var(--color-primary)',
                          }}
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] font-black text-text-tertiary">
                        {quotaLabel}{deal.fillRate !== null ? ` · ${deal.fillRate}% fill rate` : ''}
                      </p>
                    </div>
                    <span className={`justify-self-start rounded-full px-2.5 py-1 text-[10px] font-black sm:justify-self-end ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
