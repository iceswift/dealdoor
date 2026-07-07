// src/components/dashboard/DealForm.tsx

import { useMemo, useState } from 'react';
import type { Deal } from '../../../db/schema';
import ImageUpload from '../shared/ImageUpload.tsx';
import { DEAL_CATEGORY_COLORS, type DealCategory } from '../../lib/constants';

interface DealFormProps {
  deal?: Deal | null;
  shopName?: string;
  shopLogoUrl?: string | null;
  shopAddress?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function getAddressShort(address?: string | null) {
  if (!address) return null;
  const parts = address.trim().split(/\s+/);
  return parts.slice(-3).join(' ');
}

const categories = [
  { id: 'birthday', label: 'วันเกิด' },
  { id: 'monthly', label: 'รายเดือน' },
  { id: 'festival', label: 'เทศกาล' },
  { id: 'special_day', label: 'วันพิเศษ' },
  { id: 'senior', label: 'ผู้สูงอายุ' },
  { id: 'kids', label: 'เด็ก' },
  { id: 'student', label: 'นักเรียน/นักศึกษา' },
  { id: 'flash', label: 'Flash Deal' },
  { id: 'custom', label: 'ทั่วไป' },
];

const claimTypes = [
  { id: 'copy_code', label: 'คัดลอกโค้ด' },
  { id: 'show_at_shop', label: 'แสดงที่ร้าน' },
  { id: 'contact_shop', label: 'ติดต่อร้าน' },
  { id: 'open_line', label: 'เปิด LINE' },
];

function toInputDate(value?: Date | string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export default function DealForm({ deal, shopName, shopLogoUrl, shopAddress, onSuccess, onCancel }: DealFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: deal?.title || '',
    category: deal?.category || 'custom',
    description: deal?.description || '',
    shortDescription: deal?.shortDescription || '',
    discountText: deal?.discountText || '',
    conditions: deal?.conditions || '',
    couponCode: deal?.couponCode || '',
    claimType: deal?.claimType || 'copy_code',
    startDate: toInputDate(deal?.startDate),
    endDate: toInputDate(deal?.endDate),
    imageUrl: deal?.imageUrl || '',
  });

  const previewExpiryLabel = useMemo(() => {
    if (!formData.endDate) return 'ยังไม่กำหนดวันหมดอายุ';
    const now = new Date();
    const end = new Date(formData.endDate);
    if (end < now) return 'หมดอายุแล้ว';
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return 'หมดอายุวันนี้';
    if (daysLeft <= 7) return `เหลือ ${daysLeft} วัน`;
    return `ถึง ${end.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}`;
  }, [formData.endDate]);

  const previewDaysLeft = useMemo(() => {
    if (!formData.endDate) return null;
    const diff = new Date(formData.endDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [formData.endDate]);

  const previewIsExpired = previewDaysLeft !== null && previewDaysLeft < 0;
  const previewIsSoon = previewDaysLeft !== null && previewDaysLeft >= 0 && previewDaysLeft <= 7;

  const previewPriceMatch = useMemo(() => {
    const match = formData.discountText.match(/฿([\d,]+)\s*\(ปกติ\s*฿([\d,]+)\)/);
    if (!match) return null;
    const promo = parseInt(match[1].replace(/,/g, ''));
    const original = parseInt(match[2].replace(/,/g, ''));
    if (!original) return null;
    const saving = original - promo;
    return {
      promo: match[1],
      original: match[2],
      saving: saving.toLocaleString(),
      percent: Math.round((saving / original) * 100),
    };
  }, [formData.discountText]);

  const previewCategoryColor = DEAL_CATEGORY_COLORS[formData.category as DealCategory] || '#6B7280';
  const previewCategoryLabel = categories.find((item) => item.id === formData.category)?.label || 'ทั่วไป';
  const previewRingCircumference = 2 * Math.PI * 15;
  const previewRingPercent = previewIsSoon ? Math.max(0, Math.min(100, ((previewDaysLeft as number) / 7) * 100)) : 0;
  const previewRingOffset = previewRingCircumference * (1 - previewRingPercent / 100);
  const previewAddressShort = getAddressShort(shopAddress);

  function updateField(name: string, value: string) {
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.discountText.trim() || !formData.endDate) {
      setError('กรุณากรอกชื่อดีล ส่วนลด และวันหมดอายุ');
      return;
    }

    if (formData.claimType === 'copy_code' && !formData.couponCode.trim()) {
      setError('กรุณากรอกโค้ดคูปองเมื่อเลือกวิธีรับสิทธิ์แบบคัดลอกโค้ด');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(deal ? `/api/deals/${deal.id}` : '/api/deals', {
        method: deal ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error?.message || 'บันทึกดีลไม่สำเร็จ');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = '/dashboard/deals';
      }
    } catch (err: any) {
      setError(err.message || 'บันทึกดีลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        {error && (
          <div className="rounded-2xl border border-danger/20 bg-danger-bg/20 p-4 text-sm font-bold text-danger" role="alert">
            {error}
          </div>
        )}

        <section className="rounded-3xl border border-border/40 bg-card-bg p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-wider text-primary">Step 1</p>
            <h2 className="text-lg font-black text-secondary">ข้อมูลหลักของดีล</h2>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-black text-secondary">รูปดีล</span>
              <ImageUpload
                type="deal"
                currentUrl={formData.imageUrl}
                onUpload={(url) => updateField('imageUrl', url)}
                className="mt-2"
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-secondary">ชื่อดีล</span>
              <input
                value={formData.title}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="เช่น Weekend Coffee Set"
                className="mt-2 h-12 w-full rounded-2xl border border-border/40 bg-bg px-4 text-sm font-bold text-secondary outline-none focus:border-primary"
                required
              />
            </label>

            <div>
              <span className="text-sm font-black text-secondary">หมวดหมู่</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => updateField('category', category.id)}
                    className={`min-h-[40px] rounded-full border px-4 text-xs font-black transition-colors ${
                      formData.category === category.id
                        ? 'border-primary bg-primary text-white'
                        : 'border-border/50 bg-bg text-text-secondary hover:border-primary/40 hover:text-primary'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border/40 bg-card-bg p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-wider text-primary">Step 2</p>
            <h2 className="text-lg font-black text-secondary">รายละเอียดและช่วงเวลา</h2>
          </div>

          <div className="grid gap-4">
            <label className="block">
              <span className="text-sm font-black text-secondary">ส่วนลดหรือประโยชน์ที่ลูกค้าได้รับ</span>
              <input
                value={formData.discountText}
                onChange={(event) => updateField('discountText', event.target.value)}
                placeholder="เช่น ลด 15%, ซื้อ 1 แถม 1, ฿159"
                className="mt-2 h-12 w-full rounded-2xl border border-border/40 bg-bg px-4 text-sm font-bold text-secondary outline-none focus:border-primary"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-secondary">คำอธิบายสั้น</span>
              <input
                value={formData.shortDescription}
                onChange={(event) => updateField('shortDescription', event.target.value)}
                placeholder="ประโยคสั้น ๆ ที่แสดงบนการ์ดดีล"
                className="mt-2 h-12 w-full rounded-2xl border border-border/40 bg-bg px-4 text-sm font-bold text-secondary outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-secondary">รายละเอียดเต็ม</span>
              <textarea
                value={formData.description}
                onChange={(event) => updateField('description', event.target.value)}
                rows={4}
                placeholder="เล่ารายละเอียดแพ็กเกจ สิ่งที่ลูกค้าจะได้รับ หรือวิธีใช้ดีล"
                className="mt-2 w-full rounded-2xl border border-border/40 bg-bg p-4 text-sm font-bold text-secondary outline-none focus:border-primary"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black text-secondary">วันเริ่มต้น</span>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(event) => updateField('startDate', event.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-border/40 bg-bg px-4 text-sm font-bold text-secondary outline-none focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="text-sm font-black text-secondary">วันหมดอายุ</span>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(event) => updateField('endDate', event.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-border/40 bg-bg px-4 text-sm font-bold text-secondary outline-none focus:border-primary"
                  required
                />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border/40 bg-card-bg p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-wider text-primary">Step 3</p>
            <h2 className="text-lg font-black text-secondary">วิธีรับสิทธิ์และเงื่อนไข</h2>
          </div>

          <div className="grid gap-4">
            <label className="block">
              <span className="text-sm font-black text-secondary">วิธีรับสิทธิ์</span>
              <select
                value={formData.claimType}
                onChange={(event) => updateField('claimType', event.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-border/40 bg-bg px-4 text-sm font-bold text-secondary outline-none focus:border-primary"
              >
                {claimTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </label>

            {formData.claimType === 'copy_code' && (
              <label className="block">
                <span className="text-sm font-black text-secondary">โค้ดคูปอง</span>
                <input
                  value={formData.couponCode}
                  onChange={(event) => updateField('couponCode', event.target.value.toUpperCase())}
                  placeholder="เช่น CAFE15"
                  className="mt-2 h-12 w-full rounded-2xl border border-border/40 bg-bg px-4 font-mono text-sm font-black text-secondary tracking-wider outline-none focus:border-primary"
                />
              </label>
            )}

            <label className="block">
              <span className="text-sm font-black text-secondary">เงื่อนไข</span>
              <textarea
                value={formData.conditions}
                onChange={(event) => updateField('conditions', event.target.value)}
                rows={4}
                placeholder="เช่น จำกัด 1 สิทธิ์ต่อคน, ใช้ได้เฉพาะวันธรรมดา"
                className="mt-2 w-full rounded-2xl border border-border/40 bg-bg p-4 text-sm font-bold text-secondary outline-none focus:border-primary"
              />
            </label>
          </div>
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-text-tertiary">ตัวอย่างการ์ดดีล</p>
          <div
            className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-[24px] border border-border/15 bg-card-bg/65 shadow-sm backdrop-blur-md ${previewIsExpired ? 'opacity-65 grayscale-[20%]' : ''}`}
          >
            <div className="relative flex aspect-[4/3] shrink-0 items-center justify-center overflow-hidden bg-bg-secondary">
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="ตัวอย่างรูปดีล" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
              ) : (
                <div className="flex h-full w-full select-none items-center justify-center bg-gradient-to-tr from-primary/10 to-orange-100/50 text-4xl">
                  🏷️
                </div>
              )}

              {previewPriceMatch && previewPriceMatch.percent > 0 && (
                <div className="absolute -left-10 top-4 z-10 w-36 -rotate-45 bg-gradient-to-r from-danger to-primary py-1.5 text-center shadow-md">
                  <span className="text-sm font-black tracking-wider text-white">-{previewPriceMatch.percent}%</span>
                </div>
              )}

              <span
                className="absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-sm"
                style={{ backgroundColor: previewCategoryColor }}
              >
                {previewCategoryLabel}
              </span>

              {previewIsSoon ? (
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/50 py-1 pl-1 pr-2 shadow-sm backdrop-blur-md">
                  <svg viewBox="0 0 36 36" className="h-6 w-6 -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={3} />
                    <circle
                      cx="18" cy="18" r="15" fill="none" stroke="#EF4444" strokeWidth={3}
                      strokeLinecap="round"
                      strokeDasharray={previewRingCircumference}
                      strokeDashoffset={previewRingOffset}
                    />
                  </svg>
                  <span className="text-[9px] font-black text-white">{previewExpiryLabel}</span>
                </div>
              ) : (
                <span className={`absolute bottom-3 right-3 rounded-md border border-white/10 px-2 py-0.5 text-[9px] font-black text-white shadow-sm backdrop-blur-md ${previewIsExpired ? 'bg-rose-600/80' : 'bg-black/50'}`}>
                  {previewExpiryLabel}
                </span>
              )}

              <div className="absolute top-3 right-3 z-20 flex h-7.5 w-7.5 items-center justify-center rounded-full border border-white/20 bg-white/90 text-secondary shadow-sm dark:bg-black/60 dark:text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between space-y-3 p-4">
              <div className="space-y-1">
                <h3 className="line-clamp-1 text-sm font-extrabold leading-snug text-secondary">
                  {formData.title || 'ชื่อดีลของคุณ'}
                </h3>
                <p className="line-clamp-2 text-[11px] font-bold leading-relaxed text-text-secondary">
                  {formData.shortDescription || formData.description || 'รายละเอียดสั้น ๆ จะช่วยให้ลูกค้าตัดสินใจเร็วขึ้น'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 border-t border-border/15 pt-1.5">
                {previewPriceMatch ? (
                  <>
                    <span className="text-base font-black tracking-tight text-primary">฿{previewPriceMatch.promo}</span>
                    <span className="ml-0.5 text-[10px] font-bold text-text-tertiary line-through">ปกติ ฿{previewPriceMatch.original}</span>
                    <span className="ml-auto rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black text-emerald-600 dark:text-emerald-400">
                      ประหยัด ฿{previewPriceMatch.saving}
                    </span>
                  </>
                ) : (
                  <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-black text-primary">
                    {formData.discountText || 'ส่วนลดหรือโปรโมชัน'}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border/15 pt-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/20 bg-gradient-to-br from-primary/10 to-orange-100/50 text-[10px] font-black text-primary shadow-sm">
                    {shopLogoUrl ? (
                      <img src={shopLogoUrl} alt={shopName || 'ร้านค้า'} className="h-full w-full object-cover" />
                    ) : (
                      (shopName || 'ร').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-0.5 truncate text-[9px] font-black text-secondary">
                      <span>{shopName || 'ร้านของคุณ'}</span>
                      <span className="select-none text-[7px] text-primary">✓</span>
                    </p>
                    <p className="truncate text-[8px] text-text-tertiary">{previewAddressShort || 'ดูพิกัดร้าน'}</p>
                  </div>
                </div>
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-secondary text-text-secondary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border/40 bg-card-bg p-4 shadow-sm">
          <button
            type="submit"
            disabled={loading}
            className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-primary px-5 text-sm font-black text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:opacity-60"
          >
            {loading ? 'กำลังบันทึก...' : deal ? 'บันทึกการแก้ไข' : 'สร้างดีล'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (onCancel) {
                onCancel();
              } else {
                window.location.href = '/dashboard/deals';
              }
            }}
            className="mt-2 flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-border/50 px-5 text-sm font-black text-text-secondary transition hover:bg-bg-secondary"
          >
            ยกเลิก
          </button>
        </div>
      </aside>
    </form>
  );
}
