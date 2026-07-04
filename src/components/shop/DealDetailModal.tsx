// src/components/shop/DealDetailModal.tsx

import { useState, useEffect } from 'react';
import type { Deal } from '../../../db/schema';
import { DEAL_CATEGORY_LABELS, DEAL_CATEGORY_COLORS, CLAIM_TYPE_LABELS } from '../../lib/constants';
import type { DealCategory, ClaimType } from '../../lib/constants';
import { formatDate } from '../../lib/utils';

interface DealDetailModalProps {
  deal: Deal | null;
  shopName: string;
  shopLineId?: string | null;
  onClose: () => void;
}

export default function DealDetailModal({ deal, shopName, shopLineId, onClose }: DealDetailModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (deal) {
      document.body.style.overflow = 'hidden';
    }
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

  if (!deal) return null;

  const endDate = new Date(deal.endDate);
  const now = new Date();
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = !deal.isActive || endDate < now;
  const categoryColor = DEAL_CATEGORY_COLORS[deal.category as DealCategory] || '#6B7280';

  const handleCopyCode = () => {
    if (deal.couponCode) {
      navigator.clipboard.writeText(deal.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}?deal=${deal.id}`;
    if (navigator.share) {
      navigator.share({
        title: `${deal.title} — ${shopName}`,
        text: deal.shortDescription || deal.title,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('คัดลอกลิงก์แล้ว!');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deal-modal-title"
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-bg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Category accent */}
        <div className="h-1 w-full" style={{ backgroundColor: categoryColor }} />
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg/95 backdrop-blur-sm px-5 py-4">
          <h2 id="deal-modal-title" className="text-lg font-semibold text-secondary">
            รายละเอียดดีล
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-tertiary hover:bg-bg-secondary hover:text-text-primary transition-colors"
            aria-label="ปิด"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Category & Status */}
          <div className="flex items-center justify-between">
            <span
              className="badge"
              style={{
                backgroundColor: `${categoryColor}15`,
                color: categoryColor,
              }}
            >
              {DEAL_CATEGORY_LABELS[deal.category as DealCategory] || deal.category}
            </span>
            
            {isExpired ? (
              <span className="badge badge-danger">หมดอายุ</span>
            ) : daysLeft <= 7 ? (
              <span className="badge badge-warning">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                เหลือ {daysLeft} วัน
              </span>
            ) : null}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-secondary">{deal.title}</h3>

          {/* Description */}
          {deal.description && (
            <p className="text-sm text-text-secondary leading-relaxed">{deal.description}</p>
          )}

          {/* Discount */}
          {deal.discountText && (
            <div className="rounded-xl p-4" style={{ backgroundColor: `${categoryColor}10` }}>
              <div className="flex items-center gap-3">
                <svg className="h-6 w-6" style={{ color: categoryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="text-lg font-bold" style={{ color: categoryColor }}>{deal.discountText}</span>
              </div>
            </div>
          )}

          {/* Expiration */}
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <svg className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>หมดอายุ: {formatDate(endDate)}</span>
          </div>

          {/* Conditions */}
          {deal.conditions && (
            <div>
              <h4 className="text-sm font-semibold text-secondary mb-2">เงื่อนไข</h4>
              <div className="rounded-xl bg-bg-secondary p-4 whitespace-pre-line text-sm text-text-secondary">
                {deal.conditions}
              </div>
            </div>
          )}

          {/* Coupon Code */}
          {deal.couponCode && deal.claimType === 'copy_code' && !isExpired && (
            <div>
              <h4 className="text-sm font-semibold text-secondary mb-2">โค้ด</h4>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-xl bg-bg-secondary px-4 py-3 font-mono text-sm tracking-wider text-secondary border border-border">
                  {deal.couponCode}
                </code>
                <button
                  onClick={handleCopyCode}
                  className={`btn ${copied ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {copied ? (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      คัดลอกแล้ว
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      คัดลอก
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleShare}
              className="btn btn-secondary w-full justify-center"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              แชร์ดีลนี้
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
