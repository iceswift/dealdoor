// src/components/dashboard/LivePreview.tsx

import { SHOP_CATEGORY_LABELS } from '../../lib/constants';
import type { ShopCategory } from '../../lib/constants';

interface LivePreviewProps {
  data: {
    name: string;
    category: ShopCategory;
    description: string;
    address: string;
    phone: string;
    lineId: string;
    facebookUrl: string;
    instagramUrl: string;
    websiteUrl: string;
    coverImage: string;
    logoImage: string;
  };
}

export default function LivePreview({ data }: LivePreviewProps) {
  const categoryLabel = SHOP_CATEGORY_LABELS[data.category] || data.category;
  
  return (
    <div className="relative mx-auto w-full max-w-[290px] md:max-w-[310px]">
      
      {/* 1. CSS Smartphone Shell Frame */}
      <div className="relative border-[9px] border-slate-900 rounded-[38px] bg-slate-900 shadow-2xl overflow-hidden aspect-[9/18.5] flex flex-col">
        {/* Phone Speaker Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-slate-900 rounded-b-2xl z-30 flex items-center justify-center gap-2">
          <span className="w-8 h-[2px] rounded-full bg-slate-800" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
        </div>

        {/* 2. Device screen area */}
        <div className="flex-1 w-full bg-bg overflow-y-auto scrollbar-hide pt-5 flex flex-col justify-between text-left text-xs select-none">
          <div>
            {/* Cover Banner Mockup */}
            <div className="h-28 w-full bg-gradient-to-br from-primary-light via-orange-100/50 to-primary/20 relative overflow-hidden flex items-center justify-center">
              {data.coverImage ? (
                <img src={data.coverImage} alt="Cover preview" className="h-full w-full object-cover" />
              ) : (
                <svg className="h-8 w-8 text-primary/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            </div>

            {/* Logo overlapping banner */}
            <div className="flex items-end justify-between px-3 -mt-6 relative z-10">
              <div className="h-16 w-16 rounded-xl border-2 border-card-bg bg-card-bg shadow-md overflow-hidden flex items-center justify-center">
                {data.logoImage ? (
                  <img src={data.logoImage} alt="Logo preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary to-orange-400 text-lg font-bold text-white uppercase">
                    {data.name ? data.name.charAt(0) : 'D'}
                  </div>
                )}
              </div>
              <span className="rounded-full bg-emerald-500/10 text-[9px] font-extrabold text-emerald-600 px-2 py-0.5 border border-emerald-500/5">
                ● เปิดอยู่
              </span>
            </div>

            {/* Store title & details */}
            <div className="px-3.5 mt-3 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <h4 className="font-extrabold text-sm text-secondary truncate max-w-[170px]">
                  {data.name || 'ชื่อร้านค้าของคุณ'}
                </h4>
                <span className="rounded-md bg-secondary/5 dark:bg-white/10 text-[8px] font-extrabold text-text-secondary px-1.5 py-0.5">
                  {categoryLabel}
                </span>
              </div>

              <p className="text-[10px] text-text-secondary leading-relaxed line-clamp-3">
                {data.description || 'สโลแกนหรือข้อมูลแนะนำร้านค้าของคุณที่นี่...'}
              </p>

              {data.address && (
                <div className="flex items-start gap-1 text-[9px] text-text-tertiary mt-2">
                  <svg className="h-3 w-3 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="line-clamp-2 leading-snug">{data.address}</span>
                </div>
              )}
            </div>

            {/* Contact Pills Mockup */}
            <div className="px-3.5 mt-4 pt-3 border-t border-border/30">
              <p className="text-[9px] font-bold text-secondary uppercase tracking-wider mb-2">ช่องทางติดต่อ</p>
              <div className="grid grid-cols-2 gap-1.5">
                {data.phone && (
                  <div className="rounded-lg bg-bg-secondary border border-border/30 p-1.5 flex items-center gap-1.5 text-[9px] font-bold text-text-secondary">
                    <span className="text-[#3B82F6]">📞</span>
                    <span className="truncate">โทรออก</span>
                  </div>
                )}
                {data.lineId && (
                  <div className="rounded-lg bg-bg-secondary border border-border/30 p-1.5 flex items-center gap-1.5 text-[9px] font-bold text-text-secondary">
                    <span className="text-[#06C755]">💬</span>
                    <span className="truncate">LINE Chat</span>
                  </div>
                )}
                {data.facebookUrl && (
                  <div className="rounded-lg bg-bg-secondary border border-border/30 p-1.5 flex items-center gap-1.5 text-[9px] font-bold text-text-secondary">
                    <span className="text-[#1877F2]">👥</span>
                    <span className="truncate">Facebook</span>
                  </div>
                )}
                {data.instagramUrl && (
                  <div className="rounded-lg bg-bg-secondary border border-border/30 p-1.5 flex items-center gap-1.5 text-[9px] font-bold text-text-secondary">
                    <span className="text-[#E1306C]">📸</span>
                    <span className="truncate">Instagram</span>
                  </div>
                )}
              </div>
            </div>

            {/* Expiring deal preview mock */}
            <div className="px-3.5 mt-4 pt-3 border-t border-border/30">
              <p className="text-[9px] font-bold text-secondary uppercase tracking-wider mb-2">โปรโมชันของร้าน</p>
              <div className="rounded-xl border border-border/40 bg-card-bg p-3 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-primary-light px-2 py-0.5 text-[8px] font-extrabold text-primary border border-primary/5">
                    ดีลร้านค้า
                  </span>
                  <span className="text-[8px] text-amber-500 font-bold">⏱️ เหลือ 3 วัน</span>
                </div>
                <h5 className="font-extrabold text-[10px] text-secondary mt-1.5 truncate">
                  ส่วนลดสิทธิพิเศษต้อนรับสมาชิกใหม่
                </h5>
                <div className="mt-2 text-[8px] text-text-tertiary">
                  *สิทธิ์พิเศษเฉพาะหน้าร้านเท่านั้น
                </div>
              </div>
            </div>
          </div>

          {/* Device footer copyright */}
          <div className="mt-6 p-3 bg-bg-secondary border-t border-border/20 text-center text-[8px] text-text-tertiary">
            Powered by DealDoor
          </div>
        </div>
      </div>
    </div>
  );
}
