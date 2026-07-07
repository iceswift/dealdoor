// src/components/dashboard/DealList.tsx

import { useMemo, useState } from 'react';
import type { Deal } from '../../../db/schema';
import { showToast } from '../../lib/toast';

interface DealListProps {
  initialDeals: Deal[];
  maxDeals: number;
}

type Filter = 'all' | 'active' | 'scheduled' | 'paused' | 'expired';

const categoryLabels: Record<string, string> = {
  birthday: 'วันเกิด',
  monthly: 'รายเดือน',
  festival: 'เทศกาล',
  special_day: 'วันพิเศษ',
  senior: 'ผู้สูงอายุ',
  kids: 'เด็ก',
  student: 'นักเรียน/นักศึกษา',
  flash: 'Flash Deal',
  custom: 'ทั่วไป',
};

function getDealState(deal: Deal): Filter {
  const now = new Date();
  const startsAt = deal.startDate ? new Date(deal.startDate) : null;
  const endsAt = new Date(deal.endDate);

  if (!deal.isActive) return 'paused';
  if (startsAt && startsAt > now) return 'scheduled';
  if (endsAt < now) return 'expired';
  return 'active';
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

export default function DealList({ initialDeals, maxDeals }: DealListProps) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const activeCount = deals.filter((deal) => getDealState(deal) === 'active').length;

  const filteredDeals = useMemo(() => {
    const q = query.trim().toLowerCase();
    return deals.filter((deal) => {
      const state = getDealState(deal);
      if (filter !== 'all' && state !== filter) return false;
      if (!q) return true;
      return [
        deal.title,
        deal.shortDescription,
        deal.discountText,
        categoryLabels[deal.category] || deal.category,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [deals, filter, query]);

  async function refreshDeals() {
    const response = await fetch('/api/deals', { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error?.message || 'โหลดรายการดีลไม่สำเร็จ');
    }
    setDeals(payload.data || []);
  }

  async function toggleDeal(deal: Deal) {
    setBusyId(deal.id);
    try {
      const response = await fetch(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !deal.isActive }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || 'อัปเดตสถานะดีลไม่สำเร็จ');

      await refreshDeals();
      showToast(!deal.isActive ? 'เปิดใช้งานดีลแล้ว' : 'พักดีลแล้ว', 'success');
    } catch (error: any) {
      showToast(error.message || 'อัปเดตสถานะดีลไม่สำเร็จ', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function deleteDeal(deal: Deal) {
    if (!window.confirm(`ลบดีล "${deal.title}" ใช่ไหม?`)) return;

    setBusyId(deal.id);
    try {
      const response = await fetch(`/api/deals/${deal.id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || 'ลบดีลไม่สำเร็จ');

      await refreshDeals();
      showToast('ลบดีลสำเร็จ', 'success');
    } catch (error: any) {
      showToast(error.message || 'ลบดีลไม่สำเร็จ', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function copyPublicLink(deal: Deal) {
    try {
      await copyToClipboard(`${window.location.origin}/deal/${deal.id}`);
      showToast('คัดลอกลิงก์ดีลแล้ว', 'success');
    } catch {
      showToast('คัดลอกลิงก์ไม่สำเร็จ', 'error');
    }
  }

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'ทั้งหมด', count: deals.length },
    { id: 'active', label: 'กำลังใช้', count: deals.filter((deal) => getDealState(deal) === 'active').length },
    { id: 'scheduled', label: 'รอเริ่ม', count: deals.filter((deal) => getDealState(deal) === 'scheduled').length },
    { id: 'paused', label: 'พักไว้', count: deals.filter((deal) => getDealState(deal) === 'paused').length },
    { id: 'expired', label: 'หมดอายุ', count: deals.filter((deal) => getDealState(deal) === 'expired').length },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border/40 bg-bg-secondary/40 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-secondary">โควตาดีลที่เปิดใช้งาน</p>
            <p className="text-xs font-bold text-text-tertiary">นับเฉพาะดีลที่เปิดอยู่และยังไม่หมดอายุ</p>
          </div>
          <div className="w-full sm:w-64">
            <div className="mb-1 flex justify-between text-xs font-black text-text-secondary">
              <span>{activeCount} / {maxDeals} ดีล</span>
              <span>{Math.round((activeCount / Math.max(1, maxDeals)) * 100)}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-bg-tertiary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (activeCount / Math.max(1, maxDeals)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`min-h-[40px] rounded-full border px-4 text-xs font-black transition-colors ${
                filter === item.id
                  ? 'border-primary bg-primary text-white'
                  : 'border-border/50 bg-card-bg text-text-secondary hover:border-primary/40 hover:text-primary'
              }`}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>

        <label className="relative block w-full lg:w-80">
          <span className="sr-only">ค้นหาดีล</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาชื่อดีล หมวดหมู่ หรือส่วนลด"
            className="h-11 w-full rounded-2xl border border-border/40 bg-card-bg px-4 text-sm font-bold text-secondary outline-none transition focus:border-primary"
          />
        </label>
      </div>

      {filteredDeals.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-border/50 bg-card-bg/60 p-10 text-center">
          <p className="text-base font-black text-secondary">ยังไม่มีดีลในมุมมองนี้</p>
          <p className="mt-1 text-sm font-bold text-text-tertiary">สร้างดีลใหม่หรือปรับตัวกรองเพื่อดูรายการอื่น</p>
          <a href="/dashboard/deals/new" className="mt-5 inline-flex min-h-[44px] items-center rounded-2xl bg-primary px-5 text-sm font-black text-white">
            สร้างดีลใหม่
          </a>
        </section>
      ) : (
        <div className="grid gap-4">
          {filteredDeals.map((deal) => {
            const state = getDealState(deal);
            const isBusy = busyId === deal.id;

            return (
              <article key={deal.id} className="overflow-hidden rounded-3xl border border-border/40 bg-card-bg shadow-sm">
                <div className="grid gap-4 p-4 md:grid-cols-[160px_1fr_auto] md:items-center">
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-bg-secondary">
                    {deal.imageUrl ? (
                      <img src={deal.imageUrl} alt={deal.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-black text-text-tertiary">
                        ไม่มีรูป
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                        state === 'active' ? 'bg-emerald-50 text-emerald-700' :
                        state === 'scheduled' ? 'bg-blue-50 text-blue-700' :
                        state === 'paused' ? 'bg-amber-50 text-amber-700' :
                        'bg-bg-secondary text-text-tertiary'
                      }`}>
                        {state === 'active' ? 'กำลังใช้งาน' : state === 'scheduled' ? 'รอเริ่ม' : state === 'paused' ? 'พักไว้' : 'หมดอายุ'}
                      </span>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-black text-primary">
                        {categoryLabels[deal.category] || deal.category}
                      </span>
                    </div>
                    <h3 className="truncate text-base font-black text-secondary">{deal.title}</h3>
                    <p className="text-sm font-bold text-primary">{deal.discountText}</p>
                    <p className="line-clamp-2 text-sm font-bold text-text-secondary">
                      {deal.shortDescription || deal.description || 'ยังไม่มีรายละเอียดสั้น'}
                    </p>
                    <p className="text-xs font-bold text-text-tertiary">
                      หมดอายุ {formatDate(deal.endDate)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:w-40 md:grid-cols-1">
                    <a href={`/dashboard/deals/edit?id=${encodeURIComponent(deal.id)}`} className="flex min-h-[40px] items-center justify-center rounded-xl bg-bg-secondary px-3 text-xs font-black text-secondary transition-colors hover:bg-bg-tertiary">
                      แก้ไข
                    </a>
                    <button type="button" onClick={() => toggleDeal(deal)} disabled={isBusy} className="min-h-[40px] rounded-xl bg-primary px-3 text-xs font-black text-white disabled:opacity-50">
                      {deal.isActive ? 'พักดีล' : 'เปิดดีล'}
                    </button>
                    <button type="button" onClick={() => copyPublicLink(deal)} className="min-h-[40px] rounded-xl border border-border/50 px-3 text-xs font-black text-text-secondary">
                      คัดลอกลิงก์
                    </button>
                    <button type="button" onClick={() => deleteDeal(deal)} disabled={isBusy} className="min-h-[40px] rounded-xl border border-danger/20 px-3 text-xs font-black text-danger disabled:opacity-50">
                      ลบ
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
