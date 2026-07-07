// src/components/dashboard/analytics/StatsOverview.tsx

import { useEffect, useState } from 'react';

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

const emptyTotals: Totals = {
  pageViews: 0,
  dealViews: 0,
  dealClicks: 0,
  shares: 0,
  contactClicks: 0,
};

export default function StatsOverview({ days = 30 }: StatsOverviewProps) {
  const [totals, setTotals] = useState<Totals>(emptyTotals);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(`/api/analytics/stats?days=${days}`, { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message || 'โหลดสถิติไม่สำเร็จ');
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

  const maxViews = Math.max(1, ...history.map((item) => item.pageViews || 0));
  const cards = [
    { label: 'เข้าชมหน้าร้าน', value: totals.pageViews },
    { label: 'ดูดีล', value: totals.dealViews },
    { label: 'คลิกดีล', value: totals.dealClicks },
    { label: 'แชร์', value: totals.shares },
    { label: 'คลิกติดต่อ', value: totals.contactClicks },
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
        <p className="text-xs font-bold text-text-tertiary">ข้อมูลผูกกับร้านของบัญชีที่ login อยู่เท่านั้น</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-border/40 bg-bg p-4">
            <p className="text-xs font-black text-text-tertiary">{card.label}</p>
            <p className="mt-2 text-2xl font-black text-secondary">{card.value.toLocaleString('th-TH')}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/40 bg-bg p-4">
        <div className="flex h-52 items-end gap-1">
          {history.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-sm font-black text-text-tertiary">
              ยังไม่มีข้อมูลสถิติ
            </div>
          ) : (
            history.map((item) => (
              <div key={item.date} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <div
                  className="w-full rounded-t-lg bg-primary/80"
                  style={{ height: `${Math.max(6, ((item.pageViews || 0) / maxViews) * 100)}%` }}
                  title={`${item.date}: ${item.pageViews || 0} views`}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
