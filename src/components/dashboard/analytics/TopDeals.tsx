// src/components/dashboard/analytics/TopDeals.tsx

import { useEffect, useState } from 'react';

type DealStat = {
  dealId: string;
  title: string | null;
  category: string | null;
  views: number;
  clicks: number;
  shares: number;
};

export default function TopDeals() {
  const [deals, setDeals] = useState<DealStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTopDeals() {
      try {
        const response = await fetch('/api/analytics/stats?days=30', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message || 'โหลดอันดับดีลไม่สำเร็จ');
        setDeals(payload.data.topDeals || []);
      } catch (err: any) {
        setError(err.message || 'โหลดอันดับดีลไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    }

    fetchTopDeals();
  }, []);

  if (loading) {
    return <section className="rounded-3xl border border-border/40 bg-card-bg p-6 text-sm font-black text-secondary">กำลังโหลดอันดับดีล...</section>;
  }

  if (error) {
    return <section className="rounded-3xl border border-danger/20 bg-danger-bg/15 p-6 text-sm font-black text-danger">{error}</section>;
  }

  return (
    <section className="rounded-3xl border border-border/40 bg-card-bg p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-wider text-primary">Top Deals</p>
        <h2 className="text-xl font-black text-secondary">ดีลที่มีคนสนใจมากที่สุด</h2>
      </div>

      {deals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/50 bg-bg-secondary/50 p-8 text-center">
          <p className="text-sm font-black text-secondary">ยังไม่มีข้อมูลดีลยอดนิยม</p>
          <p className="mt-1 text-xs font-bold text-text-tertiary">เมื่อมีการดูหรือคลิกดีล ระบบจะแสดงอันดับที่นี่</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map((deal, index) => (
            <a key={deal.dealId} href={`/dashboard/deals/edit?id=${deal.dealId}`} className="grid gap-3 rounded-2xl border border-border/40 bg-bg p-4 transition hover:border-primary/40 sm:grid-cols-[40px_1fr_auto] sm:items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-black text-primary">
                {index + 1}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-secondary">{deal.title || 'ไม่มีชื่อดีล'}</p>
                <p className="text-xs font-bold text-text-tertiary">{deal.category || 'ทั่วไป'}</p>
              </div>
              <div className="flex gap-3 text-xs font-black text-text-secondary">
                <span>{deal.views || 0} views</span>
                <span>{deal.clicks || 0} clicks</span>
                <span>{deal.shares || 0} shares</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
