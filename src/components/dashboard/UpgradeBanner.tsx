// src/components/dashboard/UpgradeBanner.tsx

import { useState } from 'react';
import type { Tier } from '../../lib/tiers';
import { getTierLimits, PRICING_PLANS } from '../../lib/tiers';

interface UpgradeBannerProps {
  currentTier: Tier;
}

export default function UpgradeBanner({ currentTier }: UpgradeBannerProps) {
  const [showModal, setShowModal] = useState(false);

  if (currentTier === 'pro') return null;

  const limits = getTierLimits('pro');
  const proPlan = PRICING_PLANS.find(p => p.id === 'pro');

  return (
    <>
      <div className="rounded-3xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-orange-500 to-primary bg-[length:200%_100%] animate-gradient-x opacity-90"></div>
        <div className="absolute inset-[1px] bg-gradient-to-br from-primary/95 via-orange-500/95 to-primary/95 rounded-3xl"></div>
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
        <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-white/5 blur-xl pointer-events-none"></div>

        <div className="relative p-5 sm:p-6 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg shadow-inner">
                  👑
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-wide">
                    อัปเกรดเป็น DealDoor Pro
                  </h3>
                  <p className="text-xs text-white/70 font-bold">ปลดล็อกฟีเจอร์ทั้งหมด</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs font-black px-3 py-1.5 rounded-lg bg-white/15 text-white/90 backdrop-blur-sm border border-white/10">
                  {limits.maxActiveDeals} ดีล
                </span>
                <span className="text-xs font-black px-3 py-1.5 rounded-lg bg-white/15 text-white/90 backdrop-blur-sm border border-white/10">
                  Analytics
                </span>
                <span className="text-xs font-black px-3 py-1.5 rounded-lg bg-white/15 text-white/90 backdrop-blur-sm border border-white/10">
                  แบรนด์เอง
                </span>
                <span className="text-xs font-black px-3 py-1.5 rounded-lg bg-white/15 text-white/90 backdrop-blur-sm border border-white/10">
                  ตั้งเวลาดีล
                </span>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 border-t border-white/15 pt-4 sm:border-t-0 sm:pt-0">
              <div className="text-center sm:text-right">
                <p className="text-2xl font-black text-white">
                  ฿{proPlan?.priceMonthly}
                  <span className="text-sm font-bold text-white/60">/เดือน</span>
                </p>
                <p className="text-xs text-white/50 font-bold">ยกเลิกได้ตลอดเวลา</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="px-5 py-2.5 text-sm font-black rounded-xl bg-white text-primary hover:bg-white/95 shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                อัปเกรดทันที
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-bg shadow-xl border border-border" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-xl font-bold text-secondary">อัปเกรดเป็น Pro</h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-text-tertiary hover:bg-bg-secondary hover:text-text-primary transition-colors"
                aria-label="ปิด"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="rounded-xl bg-bg-secondary p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-text-secondary">ราคา</span>
                  <span className="text-2xl font-bold text-primary">฿{proPlan?.priceMonthly}/เดือน</span>
                </div>
              </div>

              <ul className="mt-4 space-y-3">
                {proPlan?.featuresTh.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success-bg">
                      <svg className="h-3 w-3 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    alert('ระบบชำระเงินจะเปิดให้บริการเร็วๆ นี้\nกรุณาติดต่อ support@dealdoor.co');
                    setShowModal(false);
                  }}
                  className="btn btn-primary flex-1"
                >
                  ดำเนินการชำระเงิน
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  ยกเลิก
                </button>
              </div>

              <p className="mt-4 text-center text-xs text-text-tertiary">
                ยกเลิกเมื่อไรก็ได้ ไม่มีข้อผูกมัด
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
