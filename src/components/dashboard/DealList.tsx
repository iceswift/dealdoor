// src/components/dashboard/DealList.tsx

import { useMemo, useState } from 'react';
import type { Deal } from '../../lib/db-schema';
import { showToast } from '../../lib/toast';
import { DEAL_CATEGORY_COLORS, type DealCategory } from '../../lib/constants';

interface DealStat {
  views: number;
  clicks: number;
}

interface DealListProps {
  initialDeals: Deal[];
  maxDeals: number;
  dealStats?: Record<string, DealStat>;
}

type Filter = 'all' | 'active' | 'scheduled' | 'paused' | 'expired';

const stateMeta: Record<Filter, { label: string; badge: string }> = {
  all: { label: 'ทั้งหมด', badge: '' },
  active: { label: 'กำลังใช้งาน', badge: 'bg-emerald-50 text-emerald-700' },
  scheduled: { label: 'รอเริ่ม', badge: 'bg-blue-50 text-blue-700' },
  paused: { label: 'พักไว้', badge: 'bg-amber-50 text-amber-700' },
  expired: { label: 'หมดอายุ', badge: 'bg-bg-secondary text-text-tertiary' },
};

function lifeRemainingPercent(startDate: Date | string | null, endDate: Date | string) {
  const start = startDate ? new Date(startDate).getTime() : null;
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const from = start && start < now ? start : now - 1000 * 60 * 60 * 24 * 30;
  const total = end - from;
  if (total <= 0) return 0;
  const remaining = ((end - now) / total) * 100;
  return Math.max(0, Math.min(100, Math.round(remaining)));
}

function daysUntil(endDate: Date | string) {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function parseDiscountPercent(discountText: string | null) {
  if (!discountText) return null;
  const match = discountText.match(/฿([\d,]+)\s*\(ปกติ\s*฿([\d,]+)\)/);
  if (!match) return null;
  const promo = parseInt(match[1].replace(/,/g, ''));
  const original = parseInt(match[2].replace(/,/g, ''));
  if (!original) return null;
  return Math.round(((original - promo) / original) * 100);
}

const urgencyRingCircumference = 2 * Math.PI * 15;

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

export default function DealList({ initialDeals, maxDeals, dealStats = {} }: DealListProps) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

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
    setMenuOpenId(null);
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
    } finally {
      setMenuOpenId(null);
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredDeals.map((deal) => {
            const state = getDealState(deal);
            const isBusy = busyId === deal.id;
            const stats = dealStats[deal.id];
            const meta = stateMeta[state];
            const lifePercent = lifeRemainingPercent(deal.startDate, deal.endDate);
            const menuOpen = menuOpenId === deal.id;
            const discountPercent = parseDiscountPercent(deal.discountText);
            const daysLeft = daysUntil(deal.endDate);
            const showUrgencyRing = state === 'active' && daysLeft <= 7;
            const urgencyRingPercent = Math.max(0, Math.min(100, (daysLeft / 7) * 100));
            const urgencyRingOffset = urgencyRingCircumference * (1 - urgencyRingPercent / 100);
            const categoryColor = DEAL_CATEGORY_COLORS[deal.category as DealCategory] || '#6B7280';

            return (
              <article key={deal.id} className="overflow-hidden rounded-3xl border border-border/40 bg-card-bg shadow-sm">
                <div className="group relative aspect-[16/9] overflow-hidden bg-bg-secondary">
                  {deal.imageUrl ? (
                    <img src={deal.imageUrl} alt={deal.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-black text-text-tertiary">
                      ไม่มีรูป
                    </div>
                  )}

                  {discountPercent !== null && discountPercent > 0 && (
                    <div className="absolute -left-9 top-3 w-32 -rotate-45 bg-gradient-to-r from-danger to-primary py-1 text-center shadow-md z-10">
                      <span className="text-[10px] font-black tracking-wider text-white">-{discountPercent}%</span>
                    </div>
                  )}

                  <span className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-black backdrop-blur-md ${meta.badge}`}>
                    {meta.label}
                  </span>

                  {showUrgencyRing && (
                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-full bg-black/50 py-1 pl-1 pr-2 backdrop-blur-md">
                      <svg viewBox="0 0 36 36" className="h-6 w-6 -rotate-90">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={3} />
                        <circle
                          cx="18" cy="18" r="15" fill="none" stroke="#EF4444" strokeWidth={3}
                          strokeLinecap="round"
                          strokeDasharray={urgencyRingCircumference}
                          strokeDashoffset={urgencyRingOffset}
                        />
                      </svg>
                      <span className="text-[9px] font-black text-white">เหลือ {daysLeft} วัน</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-black"
                      style={{ backgroundColor: `${categoryColor}26`, color: categoryColor }}
                    >
                      {categoryLabels[deal.category] || deal.category}
                    </span>
                    {stats && (
                      <span className="flex items-center gap-2 text-[11px] font-black text-text-tertiary">
                        <span>👁 {stats.views}</span>
                        <span>🔗 {stats.clicks}</span>
                      </span>
                    )}
                  </div>
                  <h3 className="truncate text-base font-black text-secondary">{deal.title}</h3>
                  <p className="text-sm font-bold text-primary">{deal.discountText}</p>
                  <div className="space-y-1">
                    <div className="h-1.5 overflow-hidden rounded-full bg-bg-tertiary">
                      <div
                        className={`h-full rounded-full ${state === 'expired' ? 'bg-text-tertiary' : lifePercent <= 15 ? 'bg-warning' : 'bg-primary'}`}
                        style={{ width: `${lifePercent}%` }}
                      />
                    </div>
                    <p className="text-xs font-bold text-text-tertiary">หมดอายุ {formatDate(deal.endDate)}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <a href={`/dashboard/deals/edit?id=${encodeURIComponent(deal.id)}`} className="flex min-h-[38px] flex-1 items-center justify-center rounded-xl bg-bg-secondary text-xs font-black text-secondary transition-colors hover:bg-bg-tertiary">
                      แก้ไข
                    </a>
                    <button type="button" onClick={() => toggleDeal(deal)} disabled={isBusy} className="min-h-[38px] flex-1 rounded-xl bg-primary text-xs font-black text-white disabled:opacity-50">
                      {deal.isActive ? 'พักดีล' : 'เปิดดีล'}
                    </button>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMenuOpenId(menuOpen ? null : deal.id)}
                        aria-label="ตัวเลือกเพิ่มเติม"
                        className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-border/50 text-text-secondary hover:bg-bg-secondary"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                          <circle cx="12" cy="5" r="1.8" />
                          <circle cx="12" cy="12" r="1.8" />
                          <circle cx="12" cy="19" r="1.8" />
                        </svg>
                      </button>
                      {menuOpen && (
                        <div className="absolute right-0 bottom-full z-20 mb-1 w-40 overflow-hidden rounded-xl border border-border/40 bg-card-bg shadow-lg">
                          <button type="button" onClick={() => copyPublicLink(deal)} className="block w-full px-4 py-2.5 text-left text-xs font-black text-text-secondary hover:bg-bg-secondary">
                            คัดลอกลิงก์
                          </button>
                          <button type="button" onClick={() => deleteDeal(deal)} disabled={isBusy} className="block w-full px-4 py-2.5 text-left text-xs font-black text-danger hover:bg-danger-bg disabled:opacity-50">
                            ลบ
                          </button>
                        </div>
                      )}
                    </div>
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
