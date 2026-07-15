// src/components/shared/ReportButton.tsx

import { useState, useEffect, useRef } from 'react';
import { showToast } from '../../lib/toast';

interface ReportButtonProps {
  targetType: 'shop' | 'deal';
  targetId: string;
  className?: string;
}

const REPORT_REASONS = {
  spam: { label: 'สแปม', description: 'เนื้อหาซ้ำ หรือไม่เกี่ยวข้อง' },
  fake: { label: 'ข้อมูลเท็จ', description: 'ดีลหรือข้อมูลร้านไม่จริง' },
  offensive: { label: 'เนื้อหาไม่เหมาะสม', description: 'คำหยาบ หรือเนื้อหาล่วงละเมิด' },
  scam: { label: 'หลอกลวง', description: 'ดูเหมือนการหลอกลวง' },
  expired: { label: 'หมดอายุ', description: 'ดีลหมดอายุแล้วแต่ยังแสดงอยู่' },
  incorrect: { label: 'ข้อมูลผิด', description: 'ข้อมูลไม่ถูกต้อง' },
  other: { label: 'อื่นๆ', description: 'เหตุผลอื่น' },
} as const;

type ReportReason = keyof typeof REPORT_REASONS;

export default function ReportButton({ targetType, targetId, className = '' }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      
      // Focus the modal
      modalRef.current?.focus();
      
      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscape);
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!reason) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          description: description || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'เกิดข้อผิดพลาด');
      }

      setSubmitted(true);
      showToast('ขอบคุณสำหรับรายงาน', 'success');
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setReason('');
        setDescription('');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      showToast('ไม่สามารถส่งรายงานได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`text-xs text-text-tertiary hover:text-red-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${className}`}
        aria-label={`Report ${targetType}`}
        title="ส่งรายงานให้ทีมผู้ดูแล DealDoor ตรวจสอบ"
      >
        รายงาน
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setIsOpen(false)}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-modal-title"
            className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-bg sm:rounded-2xl"
            onClick={e => e.stopPropagation()}
            tabIndex={-1}
          >
            {submitted ? (
              <div className="p-6 text-center">
                <span className="text-4xl">✅</span>
                <h3 id="report-modal-title" className="mt-4 text-lg font-semibold text-secondary">
                  ขอบคุณสำหรับรายงาน
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  เราจะตรวจสอบและดำเนินการโดยเร็ว
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h3 id="report-modal-title" className="text-lg font-semibold text-secondary">
                    รายงาน{targetType === 'shop' ? 'ร้านค้า' : 'ดีล'}
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-2 text-text-tertiary hover:bg-bg-secondary min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="ปิด"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-28">
                  {error && (
                    <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600" role="alert">
                      {error}
                    </div>
                  )}

                  <div className="mb-4 rounded-2xl border border-primary/15 bg-primary/5 p-3">
                    <p className="text-sm font-bold leading-6 text-text-secondary">
                      รายงานนี้จะถูกส่งเข้าคิวตรวจสอบของทีมผู้ดูแล DealDoor ที่หน้า /admin/moderation
                    </p>
                  </div>

                  {/* Reasons */}
                  <fieldset>
                    <legend className="text-sm font-medium text-secondary mb-2">
                      เหตุผลในการรายงาน
                    </legend>
                    <div className="space-y-2">
                      {Object.entries(REPORT_REASONS).map(([key, { label, description }]) => (
                        <label 
                          key={key} 
                          className={`flex items-start gap-3 cursor-pointer rounded-lg border p-3 transition-colors ${
                            reason === key ? 'border-primary bg-primary-light' : 'border-border hover:bg-bg-secondary'
                          }`}
                        >
                          <input
                            type="radio"
                            name="reason"
                            value={key}
                            checked={reason === key}
                            onChange={(e) => setReason(e.target.value as ReportReason)}
                            className="mt-0.5 text-primary"
                          />
                          <div>
                            <span className="text-sm font-medium text-secondary">{label}</span>
                            <p className="text-xs text-text-tertiary">{description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {/* Description */}
                  <div className="mt-4">
                    <label htmlFor="report-description" className="block text-sm font-medium text-secondary mb-1">
                      รายละเอียดเพิ่มเติม (ถ้ามี)
                    </label>
                    <textarea
                      id="report-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="อธิบายปัญหาเพิ่มเติม..."
                      className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm focus:border-primary focus:outline-none min-h-[80px]"
                      rows={3}
                    />
                  </div>

                </div>

                {/* Sticky actions */}
                <div className="sticky bottom-0 flex gap-3 border-t border-border bg-bg/95 p-4 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="min-h-[44px] flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium text-text-secondary hover:bg-bg-secondary"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!reason || loading}
                    className="min-h-[44px] flex-1 rounded-lg bg-red-500 px-4 py-3 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? 'กำลังส่ง...' : 'ส่งรายงาน'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
