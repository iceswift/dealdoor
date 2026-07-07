// src/components/dashboard/DealList.tsx

import { useState, useEffect } from 'react';
import type { Deal } from '../../../db/schema';
import { DEAL_CATEGORY_LABELS, DEAL_CATEGORY_COLORS } from '../../lib/constants';
import type { DealCategory } from '../../lib/constants';
import { getDaysRemaining, formatDate } from '../../lib/utils';
import { showToast } from '../../lib/toast';

interface DealListProps {
  shopId: string;
  maxDeals: number;
}

export default function DealList({ shopId, maxDeals }: DealListProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDeals();
  }, [shopId]);

  const fetchDeals = async () => {
    try {
      const res = await fetch(`/api/deals?shopId=${shopId}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await res.json();
      setDeals(data.data || []);
    } catch (err) {
      console.error('Failed to fetch deals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (dealId: string, isActive: boolean) => {
    try {
      await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      showToast(isActive ? 'เปิดใช้งานดีลแล้ว' : 'ปิดใช้งานดีลแล้ว', 'success');
      fetchDeals();
    } catch (err) {
      console.error('Failed to toggle deal:', err);
      showToast('ไม่สามารถอัปเดตดีลได้', 'error');
    }
  };

  const handleDelete = async (dealId: string) => {
    if (!confirm('ต้องการลบดีลนี้?')) return;

    try {
      await fetch(`/api/deals/${dealId}`, { method: 'DELETE' });
      showToast('ลบดีลสำเร็จ', 'success');
      fetchDeals();
    } catch (err) {
      console.error('Failed to delete deal:', err);
      showToast('ไม่สามารถลบดีลได้', 'error');
    }
  };

  const handleEdit = (deal: Deal) => {
    sessionStorage.setItem('editDeal', JSON.stringify(deal));
    window.location.href = `/dashboard/deals/edit?id=${encodeURIComponent(deal.id)}`;
  };

  const getPublicDealPath = (dealId: string) => `/deal/${dealId}`;

  const handleCopyPublicLink = async (dealId: string) => {
    const url = `${window.location.origin}${getPublicDealPath(dealId)}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('คัดลอกลิงก์ดีลแล้ว', 'success');
    } catch {
      showToast('ไม่สามารถคัดลอกลิงก์ได้', 'error');
    }
  };

  const getCategoryEmoji = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'birthday': return '🎂';
      case 'student': return '🎓';
      case 'monthly': return '📅';
      case 'special_day': return '🎉';
      case 'senior': return '👵';
      case 'kids': return '👶';
      default: return '🏷️';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton h-20 rounded-2xl animate-pulse bg-card-bg/30" />
        ))}
      </div>
    );
  }

  const activeDeals = deals.filter(d => d.isActive && new Date(d.endDate) >= new Date());

  // Filter deals based on active tab and search query
  const filteredDeals = deals.filter(deal => {
    const endDate = new Date(deal.endDate);
    const isCurrentlyActive = deal.isActive && endDate >= new Date();
    
    if (filter === 'active' && !isCurrentlyActive) return false;
    if (filter === 'inactive' && isCurrentlyActive) return false;

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const titleMatch = deal.title.toLowerCase().includes(query);
      const categoryMatch = deal.category && deal.category.toLowerCase().includes(query);
      const labelMatch = DEAL_CATEGORY_LABELS[deal.category as DealCategory]?.toLowerCase().includes(query);
      return titleMatch || categoryMatch || labelMatch;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Quota Progress Meter Card */}
      <div className="rounded-2xl bg-bg/40 border border-border/20 p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-xs font-black text-secondary uppercase tracking-wider">โควต้าการเปิดใช้งานดีล</h4>
          <p className="text-[10px] text-text-tertiary font-bold">
            คุณสามารถเปิดใช้งานโปรโมชันได้สูงสุดตามเงื่อนไขของแพ็กเกจร้านค้าปัจจุบันของคุณ
          </p>
        </div>
        <div className="flex-shrink-0 w-full md:w-56 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-black text-text-secondary">
            <span>ดีลที่ใช้งานอยู่</span>
            <span className="text-primary">{activeDeals.length} / {maxDeals} ดีล</span>
          </div>
          <div className="h-2 w-full bg-bg-secondary rounded-full overflow-hidden border border-border/10">
            <div 
              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                activeDeals.length >= maxDeals ? 'from-danger to-red-500' : 'from-primary to-orange-500'
              }`}
              style={{ width: `${Math.min(100, (activeDeals.length / maxDeals) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Limit Warning */}
      {activeDeals.length >= maxDeals && (
        <div className="flex items-center gap-3 rounded-2xl border border-warning/20 bg-warning-bg/15 p-4">
          <svg className="h-5 w-5 text-warning shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-warning-text font-black">
            ใช้จำนวนดีลครบตามกำหนดแล้ว ปิดใช้งานดีลเก่าก่อน หรือสลับอัปเกรดเป็นระดับ Pro ร้านค้า
          </p>
        </div>
      )}

      {/* Search Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="ค้นหาชื่อดีลหรือประเภทหมวดหมู่โปรโมชัน..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-border/20 bg-bg/25 text-secondary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary/45 focus:border-primary/45 transition-all shadow-sm"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-tertiary hover:text-text-secondary cursor-pointer"
            aria-label="Clear search"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tab Filters */}
      <div className="flex border-b border-border/20 gap-2 mb-4 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setFilter('all')}
          className={`pb-3 px-3 text-xs font-black border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
            filter === 'all' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-text-tertiary hover:text-text-secondary'
          }`}
        >
          ทั้งหมด ({deals.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`pb-3 px-3 text-xs font-black border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
            filter === 'active' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-text-tertiary hover:text-text-secondary'
          }`}
        >
          กำลังใช้งาน ({activeDeals.length})
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`pb-3 px-3 text-xs font-black border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
            filter === 'inactive' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-text-tertiary hover:text-text-secondary'
          }`}
        >
          หมดอายุ/ปิดอยู่ ({deals.length - activeDeals.length})
        </button>
      </div>

      {/* Deals Cards List */}
      <div className="space-y-4">
        {filteredDeals.length === 0 ? (
          <div className="border border-dashed border-border/40 rounded-3xl p-10 text-center bg-bg/10">
            <svg className="h-10 w-10 mx-auto text-text-tertiary mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-xs text-text-secondary font-black">ไม่พบคูปอง/ดีลโปรโมชัน</p>
            <p className="mt-1 text-[10px] text-text-tertiary font-bold">ไม่มีรายการดีลที่ตรงตามตัวกรองนี้</p>
          </div>
        ) : (
          filteredDeals.map((deal) => {
            const endDate = new Date(deal.endDate);
            const isExpired = endDate < new Date() || !deal.isActive;
            const daysLeft = getDaysRemaining(endDate);
            const categoryColor = DEAL_CATEGORY_COLORS[deal.category as DealCategory] || '#6B7280';

            return (
              <div
                key={deal.id}
                className={`rounded-2xl border border-border/25 bg-bg/40 hover:border-primary/20 hover:bg-bg/60 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 relative overflow-hidden group ${
                  isExpired ? 'opacity-65' : ''
                }`}
              >
                {/* Visual Category Left Accent Border */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2"
                  style={{ backgroundColor: categoryColor }}
                />

                <div className="flex items-start sm:items-center gap-4.5 pl-2 min-w-0 flex-1">
                  {/* Category icon with soft background */}
                  <div 
                    className="h-11 w-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm border border-border/10"
                    style={{ backgroundColor: `${categoryColor}12` }}
                  >
                    {getCategoryEmoji(deal.category)}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-black text-secondary truncate">{deal.title}</span>
                      <span
                        className="text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider"
                        style={{ 
                          backgroundColor: `${categoryColor}10`, 
                          color: categoryColor,
                          borderColor: `${categoryColor}25`
                        }}
                      >
                        {DEAL_CATEGORY_LABELS[deal.category as DealCategory] || deal.category}
                      </span>
                    </div>
                    
                    <div className="text-[10px] text-text-tertiary font-bold flex items-center gap-1.5">
                      {isExpired ? (
                        <span className="text-danger flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-danger"></span>
                          หมดอายุหรือไม่ได้ใช้งาน
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                          <span>เหลือ {daysLeft} วัน</span>
                          <span className="text-text-tertiary/40">|</span>
                          <span>หมดอายุ {formatDate(endDate)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side Action Block */}
                <div className="flex items-center justify-end gap-3.5 pl-6 sm:pl-0 flex-shrink-0">
                  {/* Toggle Active status pill button */}
                  <button
                    onClick={() => handleToggleActive(deal.id, !deal.isActive)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wide border cursor-pointer transition-all duration-200 ${
                      deal.isActive && !isExpired
                        ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
                        : 'bg-bg-secondary/60 text-text-tertiary border-border/15 hover:bg-bg-secondary hover:text-text-secondary'
                    }`}
                  >
                    {deal.isActive && !isExpired ? 'Active' : 'Inactive'}
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Public preview link */}
                    <a
                      href={getPublicDealPath(deal.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-bg border border-border/25 text-text-secondary hover:text-primary hover:border-primary/30 transition-all duration-200 cursor-pointer shadow-sm"
                      aria-label="เปิดหน้าดีลสาธารณะ"
                      title="เปิดหน้าดีลสาธารณะ"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H18m0 0v4.5M18 6l-7.5 7.5M6 8.25A2.25 2.25 0 018.25 6h2.25m7.5 7.5v2.25A2.25 2.25 0 0115.75 18h-7.5A2.25 2.25 0 016 15.75v-7.5" />
                      </svg>
                    </a>

                    {/* Copy public link */}
                    <button
                      onClick={() => handleCopyPublicLink(deal.id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-bg border border-border/25 text-text-secondary hover:text-primary hover:border-primary/30 transition-all duration-200 cursor-pointer shadow-sm"
                      aria-label="คัดลอกลิงก์ดีล"
                      title="คัดลอกลิงก์ดีล"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6.75A2.75 2.75 0 014 13.25v-6.5A2.75 2.75 0 016.75 4h6.5A2.75 2.75 0 0116 6.75V8m-5.25 0h6.5A2.75 2.75 0 0120 10.75v6.5A2.75 2.75 0 0117.25 20h-6.5A2.75 2.75 0 018 17.25v-6.5A2.75 2.75 0 0110.75 8z" />
                      </svg>
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => handleEdit(deal)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-bg border border-border/25 text-text-secondary hover:text-primary hover:border-primary/30 transition-all duration-200 cursor-pointer shadow-sm"
                      aria-label="แก้ไขข้อมูลดีล"
                      title="แก้ไขข้อมูลดีล"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(deal.id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-bg border border-border/25 text-danger hover:text-white hover:bg-danger hover:border-danger transition-all duration-200 cursor-pointer shadow-sm"
                      aria-label="ลบดีล"
                      title="ลบดีล"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Copywriting & Marketing Tips Box */}
      <div className="rounded-2xl border border-primary/15 bg-primary/3 p-4.5 flex gap-3.5 relative overflow-hidden group mt-2">
        <div className="absolute -right-4 -bottom-4 h-12 w-12 rounded-full bg-primary/5 blur-md"></div>
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-lg shadow-sm border border-primary/10 select-none">
          💡
        </div>
        <div className="space-y-1">
          <h5 className="text-[11px] font-black text-secondary uppercase tracking-wider">เคล็ดลับการออกแบบโปรโมชันให้ได้ผลดี</h5>
          <p className="text-[10px] text-text-tertiary leading-relaxed font-bold">
            ดีลที่มีชื่อกระชับ ดึงดูด (เช่น "ฟรีบราวนี่", "ลดทันที 50%") และการระบุเงื่อนไขการใช้สิทธิ์ที่ง่าย (เช่น "เมื่อแสดงบัตรนักเรียน") 
            มักจะสร้างอัตราคลิกเก็บคูปองดีลได้สูงขึ้นถึง <strong>2.5 เท่า</strong>! แนะนำให้ระบุประเภทและเงื่อนไขของดีลให้ถูกต้องเพื่อประโยชน์การสแกนค้นหาของลูกค้า
          </p>
        </div>
      </div>
    </div>
  );
}
