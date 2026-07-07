// src/components/dashboard/analytics/TopDeals.tsx

import { useState, useEffect } from 'react';

interface TopDealsProps {
  shopId: string;
}

interface DealStat {
  dealId: string;
  title: string | null;
  category: string | null;
  views: number;
  clicks: number;
  shares: number;
}

export default function TopDeals({ shopId }: TopDealsProps) {
  const [deals, setDeals] = useState<DealStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    fetchTopDeals();
  }, [shopId]);

  const getCategoryLabel = (category: string | null) => {
    if (!category) return '🏷️ ทั่วไป';
    switch (category.toLowerCase()) {
      case 'birthday': return '🎂 เดือนเกิด';
      case 'student': return '🎓 นักเรียน';
      case 'monthly': return '📅 รายเดือน';
      case 'special_day': return '🎉 วันพิเศษ';
      case 'kids': return '👶 ครอบครัว';
      case 'senior': return '👵 ผู้สูงอายุ';
      default: return `🏷️ ${category}`;
    }
  };

  const fetchTopDeals = async () => {
    try {
      const res = await fetch(`/api/analytics/stats?shopId=${shopId}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await res.json();
      if (data.success) {
        const topDeals = data.data.topDeals || [];
        
        // Fallback to mock data if there are no deal stats
        if (topDeals.length === 0) {
          const MOCK_DEALS: DealStat[] = [
            {
              dealId: 'deal-1',
              title: 'ฟรีบราวนี่ 1 ชิ้น เมื่อสั่งเครื่องดื่มใดก็ได้ สำหรับเดือนเกิด',
              category: 'birthday',
              views: 142,
              clicks: 58,
              shares: 12,
            },
            {
              dealId: 'deal-2',
              title: 'ลด 10% สำหรับนักเรียน/นักศึกษา เมื่อแสดงบัตรประชาชน',
              category: 'student',
              views: 95,
              clicks: 38,
              shares: 6,
            },
            {
              dealId: 'deal-3',
              title: 'เซตกาแฟวันหยุดสุดคุ้ม กาแฟ + ขนม ราคาพิเศษ ฿159',
              category: 'monthly',
              views: 76,
              clicks: 22,
              shares: 4,
            }
          ];
          setDeals(MOCK_DEALS);
          setIsDemo(true);
        } else {
          let finalDeals = [...topDeals];
          if (finalDeals.length < 3) {
            const fallbackItems = [
              {
                dealId: 'deal-1',
                title: 'ฟรีบราวนี่ 1 ชิ้น เมื่อสั่งเครื่องดื่มใดก็ได้ สำหรับเดือนเกิด',
                category: 'birthday',
                views: 142,
                clicks: 58,
                shares: 12,
              },
              {
                dealId: 'deal-2',
                title: 'ลด 10% สำหรับนักเรียน/นักศึกษา เมื่อแสดงบัตรประชาชน',
                category: 'student',
                views: 95,
                clicks: 38,
                shares: 6,
              },
              {
                dealId: 'deal-3',
                title: 'เซตกาแฟวันหยุดสุดคุ้ม กาแฟ + ขนม ราคาพิเศษ ฿159',
                category: 'monthly',
                views: 76,
                clicks: 22,
                shares: 4,
              }
            ];
            
            for (const item of fallbackItems) {
              if (finalDeals.length >= 3) break;
              if (!finalDeals.some(d => d.dealId === item.dealId)) {
                finalDeals.push(item);
              }
            }
            setIsDemo(true);
          } else {
            setIsDemo(false);
          }
          setDeals(finalDeals);
        }
      }
    } catch (err) {
      console.error('Failed to fetch top deals:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-border/20 bg-card-bg/60 backdrop-blur-md p-6 shadow-md animate-pulse">
        <div className="h-5 w-28 bg-card-bg/60 rounded-lg mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-card-bg/30 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/20 bg-card-bg/60 backdrop-blur-md p-6 shadow-md relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h3 className="text-sm font-black text-secondary flex items-center gap-2">
            <svg className="h-4.5 w-4.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <span>ดีลยอดนิยม (Top Performing Deals)</span>
          </h3>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Calendar pill for timeframe */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-bg-secondary/80 border border-border/20 text-text-secondary text-[10px] font-black shadow-sm">
            <svg className="h-3.5 w-3.5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>ย้อนหลัง 30 วัน</span>
          </div>

          {isDemo && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black animate-pulse shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
              โหมดจำลอง (Demo Data)
            </div>
          )}
        </div>
      </div>

      {deals.length > 0 ? (
        <div className="space-y-4">
          {deals.map((deal, index) => {
            // Calculate conversion rate
            const conversionRate = deal.views > 0 ? ((deal.clicks / deal.views) * 100).toFixed(1) : '0';
            
            // Premium rank gradient badges
            let rankBadgeClass = "bg-bg-secondary text-text-secondary border border-border/10";
            if (index === 0) rankBadgeClass = "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md shadow-yellow-500/20";
            else if (index === 1) rankBadgeClass = "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-md shadow-slate-400/20";
            else if (index === 2) rankBadgeClass = "bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-md shadow-amber-700/20";

            return (
              <div key={deal.dealId} className="flex items-start gap-4 rounded-2xl border border-border/25 bg-bg/40 hover:border-primary/20 hover:bg-bg/60 p-4.5 transition-all duration-200 group">
                {/* Ranking Number */}
                <div className="flex flex-col items-center justify-center flex-shrink-0 w-12 text-center">
                  {index === 0 && (
                    <span className="text-3xl font-black italic tracking-tighter bg-gradient-to-br from-yellow-400 to-amber-500 bg-clip-text text-transparent select-none pe-2.5">
                      01
                    </span>
                  )}
                  {index === 1 && (
                    <span className="text-3xl font-black italic tracking-tighter bg-gradient-to-br from-slate-300 to-slate-400 bg-clip-text text-transparent select-none pe-2.5">
                      02
                    </span>
                  )}
                  {index === 2 && (
                    <span className="text-3xl font-black italic tracking-tighter bg-gradient-to-br from-amber-600 to-amber-700 bg-clip-text text-transparent select-none pe-2.5">
                      03
                    </span>
                  )}
                  {index >= 3 && (
                    <span className="text-2xl font-black italic tracking-tighter text-text-tertiary select-none pe-2">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold text-text-tertiary bg-bg-secondary px-2 py-0.5 rounded-md border border-border/20 uppercase tracking-wide">
                      {getCategoryLabel(deal.category)}
                    </span>
                  </div>
                  
                  <p className="text-xs font-black text-secondary truncate mb-2 leading-relaxed" title={deal.title || `Deal ID: ${deal.dealId}`}>
                    {deal.title || `Deal ID: ${deal.dealId.slice(0, 8)}...`}
                  </p>
                  
                  {/* Conversion Ratio & Stats */}
                  <div className="space-y-2.5">
                    {/* Progress Bar Container */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-bold text-text-tertiary">
                        <span>อัตราการเก็บสิทธิ์ (Conversion Rate)</span>
                        <span className="text-primary font-black">{conversionRate}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-bg-secondary rounded-full overflow-hidden border border-border/10">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, parseFloat(conversionRate))}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Metrics Row */}
                    <div className="flex gap-4 text-[10px] text-text-tertiary font-bold">
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {deal.views} views
                      </span>
                      <span className="flex items-center gap-1 text-primary">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                        </svg>
                        {deal.clicks} clicks
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                          <circle cx="18" cy="5" r="3" />
                          <circle cx="6" cy="12" r="3" />
                          <circle cx="18" cy="19" r="3" />
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                        {deal.shares} shares
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/40 p-10 text-center bg-bg/20">
          <svg className="mx-auto h-8 w-8 text-text-tertiary mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-xs text-text-secondary font-bold">ยังไม่มีข้อมูลสถิติของแต่ละคูปองในระบบขณะนี้</p>
        </div>
      )}
    </div>
  );
}
