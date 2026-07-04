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
      <div className="rounded-3xl border border-border/20 bg-card-bg/60 backdrop-blur-md p-6 shadow-md relative overflow-hidden group">
        <div className="absolute -right-12 -bottom-12 h-24 w-24 rounded-full bg-primary/5 blur-lg group-hover:bg-primary/8 transition-colors"></div>
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg filter drop-shadow-sm select-none">👑</span>
              <h3 className="text-sm font-black text-secondary uppercase tracking-wide">
                อัปเกรดเป็น DealDoor Pro
              </h3>
            </div>
            <p className="text-xs text-text-secondary font-bold leading-relaxed">
              ดีลไม่จำกัด + QR Code พิเศษ + ระบบ Analytics วิเคราะห์สถิติเชิงลึก + ปรับแต่งภาพแบรนด์ร้านค้า
            </p>
            <div className="pt-1 flex flex-wrap gap-2">
              <span className="text-[9px] font-black px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                สูงสุด {limits.maxActiveDeals} ดีล
              </span>
              <span className="text-[9px] font-black px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                สูงสุด {limits.maxMenuItems} เมนู
              </span>
              <span className="text-[9px] font-black px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                Analytics Pro
              </span>
              <span className="text-[9px] font-black px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                QR Code Store
              </span>
            </div>
          </div>
          <div className="text-center sm:text-right flex-shrink-0 flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-4 border-t sm:border-t-0 border-border/20 pt-4 sm:pt-0">
            <div>
              <p className="text-2xl font-black text-primary">
                ฿{proPlan?.priceMonthly}
              </p>
              <p className="text-[9px] text-text-tertiary font-bold mt-0.5">ต่อเดือน (ยกเลิกได้ตลอดเวลา)</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white shadow-md shadow-primary/15 hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              อัปเกรดทันที
            </button>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
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
