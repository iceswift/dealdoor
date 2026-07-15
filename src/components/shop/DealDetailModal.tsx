// src/components/shop/DealDetailModal.tsx

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Deal, Shop } from '../../lib/db-schema';
import { getDealViewModel } from '../../lib/deals/view-model';
import { formatDate } from '../../lib/utils';
import ReportButton from '../shared/ReportButton.tsx';
import SaveButton from '../shared/SaveButton.tsx';

interface DealDetailModalProps {
  deal: Deal | null;
  shop: Shop;
  onClose: () => void;
}

export default function DealDetailModal({ deal, shop, onClose }: DealDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!deal) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [deal]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!deal || !mounted) return null;

  const view = getDealViewModel(deal, shop, typeof window !== 'undefined' ? window.location.origin : undefined);
  const isExpired = view.urgency === 'expired';
  const endDate = new Date(deal.endDate);

  const handleCopyCode = async () => {
    if (!view.couponCode) return;
    await navigator.clipboard.writeText(view.couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleShare = async () => {
    const dealUrl = `${window.location.origin}${view.urls.deal || `${window.location.pathname}?deal=${deal.id}`}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${view.title} | ${shop.name}`,
          text: view.shareText,
          url: dealUrl,
        });
        return;
      } catch {
        // Fall through to clipboard.
      }
    }

    await navigator.clipboard.writeText(dealUrl);
    setShared(true);
    setTimeout(() => setShared(false), 1800);
  };

  const primaryAction = () => {
    if (isExpired) {
      return (
        <button className="btn w-full cursor-not-allowed rounded-xl bg-bg-tertiary text-text-tertiary" disabled>
          หมดอายุแล้ว
        </button>
      );
    }

    if (view.claimType === 'copy_code' && view.couponCode) {
      return (
        <button onClick={handleCopyCode} className="btn btn-primary min-h-[48px] w-full rounded-xl font-bold">
          {copied ? 'คัดลอกแล้ว' : `คัดลอกโค้ด ${view.couponCode}`}
        </button>
      );
    }

    if (view.claimType === 'open_line' && view.shop.lineUrl) {
      return (
        <a
          href={view.shop.lineUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn min-h-[48px] w-full rounded-xl border-none bg-[#06C755] font-bold text-white hover:bg-[#05B34C]"
        >
          เปิด LINE เพื่อรับสิทธิ์
        </a>
      );
    }

    if (view.claimType === 'contact_shop') {
      return (
        <a href={view.shop.phoneUrl || view.urls.shop || '#'} className="btn btn-primary min-h-[48px] w-full rounded-xl font-bold">
          ติดต่อร้านเพื่อรับสิทธิ์
        </a>
      );
    }

    return (
      <button className="btn btn-primary min-h-[48px] w-full rounded-xl font-bold">
        แสดงดีลนี้ที่ร้าน
      </button>
    );
  };

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm md:items-center md:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deal-modal-title"
    >
      <div
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-bg shadow-2xl md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <SaveButton
          dealId={deal.id}
          variant="icon"
          className="absolute left-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-xl bg-black/45 text-white shadow-lg backdrop-blur hover:bg-black/60"
        />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-xl bg-black/45 text-white backdrop-blur hover:bg-black/60"
          aria-label="ปิด"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative aspect-[16/10] overflow-hidden bg-bg-secondary">
          {view.imageUrl ? (
            <img src={view.imageUrl} alt={view.imageAlt} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-orange-400/10">
              <span className="text-5xl font-extrabold text-primary">{shop.name.charAt(0)}</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ backgroundColor: `${view.categoryColor}22`, color: 'white' }}
              >
                {view.categoryLabel}
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                {view.expiryLabel}
              </span>
            </div>
            <h2 id="deal-modal-title" className="mt-3 text-2xl font-extrabold leading-tight text-white">
              {view.title}
            </h2>
          </div>
        </div>

        <div className="space-y-6 p-5 pb-28 md:p-7 md:pb-7">
          {view.discountLabel && (
            <section className="rounded-2xl border border-border/40 p-5" style={{ backgroundColor: `${view.categoryColor}10` }}>
              <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">สิทธิพิเศษ</p>
              <p className="mt-1 text-2xl font-extrabold" style={{ color: view.categoryColor }}>
                {view.discountLabel}
              </p>
            </section>
          )}

          <section>
            <h3 className="text-sm font-bold text-secondary">สรุปดีล</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{view.summary}</p>
          </section>

          {view.description && view.description !== view.summary && (
            <section>
              <h3 className="text-sm font-bold text-secondary">รายละเอียด</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary">{view.description}</p>
            </section>
          )}

          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-bg-secondary p-4">
              <p className="text-xs font-bold text-text-tertiary">วิธีรับสิทธิ์</p>
              <p className="mt-1 text-sm font-bold text-secondary">{view.claimLabel}</p>
            </div>
            <div className="rounded-2xl bg-bg-secondary p-4">
              <p className="text-xs font-bold text-text-tertiary">หมดอายุ</p>
              <p className="mt-1 text-sm font-bold text-secondary">{formatDate(endDate)}</p>
            </div>
          </section>

          {view.couponCode && view.claimType === 'copy_code' && (
            <section>
              <h3 className="text-sm font-bold text-secondary">โค้ดคูปอง</h3>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 rounded-xl border border-border bg-bg-secondary px-4 py-3 font-mono text-sm font-bold tracking-wider text-secondary">
                  {view.couponCode}
                </code>
                <button onClick={handleCopyCode} className="btn btn-secondary min-h-[44px] rounded-xl">
                  {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                </button>
              </div>
            </section>
          )}

          {view.conditions && (
            <section>
              <h3 className="text-sm font-bold text-secondary">เงื่อนไข</h3>
              <div className="mt-2 rounded-2xl bg-bg-secondary p-4 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                {view.conditions}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-border/40 bg-bg-secondary/50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">ร้านค้า</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-sm font-extrabold text-primary">
                {view.shop.logoImage ? <img src={view.shop.logoImage} alt={shop.name} className="h-full w-full object-cover" /> : shop.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-secondary">{shop.name}</p>
                <p className="truncate text-xs text-text-tertiary">{view.shop.addressShort || shop.category}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {view.shop.lineUrl && (
                <a href={view.shop.lineUrl} target="_blank" rel="noopener noreferrer" className="btn min-h-[44px] rounded-xl bg-[#06C755] px-2 text-xs font-bold text-white">
                  LINE
                </a>
              )}
              {view.shop.phoneUrl && (
                <a href={view.shop.phoneUrl} className="btn btn-secondary min-h-[44px] rounded-xl px-2 text-xs font-bold">
                  โทร
                </a>
              )}
              {view.shop.mapUrl && (
                <a href={view.shop.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary min-h-[44px] rounded-xl px-2 text-xs font-bold">
                  แผนที่
                </a>
              )}
            </div>
          </section>

          <button onClick={handleShare} className="btn btn-secondary min-h-[48px] w-full rounded-xl font-bold">
            {shared ? 'คัดลอกลิงก์แล้ว' : 'แชร์ดีลนี้'}
          </button>
          <ReportButton
            targetType="deal"
            targetId={deal.id}
            className="w-full rounded-xl border border-danger/15 bg-danger-bg/10 px-3 py-3 text-xs font-black text-danger hover:border-danger/30 hover:bg-danger-bg/20"
          />
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 p-4 backdrop-blur md:absolute md:rounded-b-3xl">
          <div className="mx-auto max-w-2xl">{primaryAction()}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

