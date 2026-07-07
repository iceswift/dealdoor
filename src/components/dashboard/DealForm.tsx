// src/components/dashboard/DealForm.tsx

import { useState, useEffect } from 'react';
import { DEAL_CATEGORIES, DEAL_CATEGORY_LABELS, DEAL_CATEGORY_COLORS, CLAIM_TYPES, CLAIM_TYPE_LABELS } from '../../lib/constants';
import type { DealCategory, ClaimType } from '../../lib/constants';
import type { Deal } from '../../../db/schema';
import ImageUpload from '../shared/ImageUpload.tsx';

interface DealFormProps {
  shopId: string;
  deal?: Deal | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DealForm({ shopId, deal, onSuccess, onCancel }: DealFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: 'custom' as DealCategory,
    description: '',
    shortDescription: '',
    discountText: '',
    conditions: '',
    couponCode: '',
    claimType: 'copy_code' as ClaimType,
    startDate: '',
    endDate: '',
    imageUrl: '',
  });

  useEffect(() => {
    if (deal) {
      setFormData({
        title: deal.title,
        category: deal.category as DealCategory,
        description: deal.description || '',
        shortDescription: deal.shortDescription || '',
        discountText: deal.discountText || '',
        conditions: deal.conditions || '',
        couponCode: deal.couponCode || '',
        claimType: deal.claimType as ClaimType,
        startDate: deal.startDate ? new Date(deal.startDate).toISOString().split('T')[0] : '',
        endDate: new Date(deal.endDate).toISOString().split('T')[0],
        imageUrl: deal.imageUrl || '',
      });
    }
  }, [deal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.category || !formData.discountText || !formData.claimType || !formData.endDate) {
      setError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    if (formData.claimType === 'copy_code' && !formData.couponCode.trim()) {
      setError('กรุณากรอกโค้ดคูปองเมื่อเลือกวิธีรับสิทธิ์แบบคัดลอกโค้ด');
      return;
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      setError('วันที่เริ่มต้นต้องมาก่อนวันหมดอายุ');
      return;
    }

    setLoading(true);

    try {
      const url = deal ? `/api/deals/${deal.id}` : '/api/deals';
      const method = deal ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          shopId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'เกิดข้อผิดพลาดในการบันทึกดีล');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
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
      case 'flash': return '⚡';
      case 'festival': return '🏮';
      default: return '🏷️';
    }
  };

  const formatDateString = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const categoryColor = DEAL_CATEGORY_COLORS[formData.category] || '#6B7280';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Panel: Form Input Fields */}
      <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-danger/20 bg-danger-bg/15 p-4 text-xs text-danger-text font-black">
            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: ข้อมูลคูปองทั่วไป */}
        <div className="rounded-2xl border border-border/20 bg-bg/25 p-5 space-y-5 shadow-sm">
          <div className="border-b border-border/20 pb-3 flex items-center gap-2">
            <span className="h-5 w-5 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black">1</span>
            <h3 className="text-xs font-black text-secondary uppercase tracking-wider">ข้อมูลคูปองทั่วไป (Basic Info)</h3>
          </div>

          {/* Deal Image Upload */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-secondary">รูปภาพคูปองโปรโมชัน</label>
            <ImageUpload
              type="deal"
              currentUrl={formData.imageUrl}
              onUpload={(url) => setFormData({ ...formData, imageUrl: url })}
              label="อัปโหลดรูปภาพดีลร้านค้า (แนะนำสัดส่วน 16:9)"
            />
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-secondary">
              ชื่อคูปองโปรโมชัน <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input block w-full text-xs rounded-xl border border-border/20 bg-bg/25 text-secondary p-3 focus:outline-none focus:ring-1 focus:ring-primary/45 focus:border-primary/45 transition-all shadow-sm"
              placeholder="เช่น Weekend Coffee Set, เซตเครื่องดื่มฟรีขนมเค้ก"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-secondary">
              หมวดหมู่ดีล/คูปอง <span className="text-danger">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DEAL_CATEGORIES.map((cat) => {
                const isSelected = formData.category === cat;
                const catColor = DEAL_CATEGORY_COLORS[cat] || '#6B7280';
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className="rounded-xl px-3 py-2 text-[11px] font-black transition-all duration-200 cursor-pointer flex items-center gap-1.5 border shadow-sm"
                    style={{
                      backgroundColor: isSelected ? `${catColor}15` : 'var(--bg-card-bg)',
                      color: isSelected ? catColor : 'var(--text-secondary)',
                      borderColor: isSelected ? `${catColor}35` : 'var(--border-color)',
                    }}
                  >
                    <span>{getCategoryEmoji(cat)}</span>
                    <span>{DEAL_CATEGORY_LABELS[cat]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* STEP 2: รายละเอียดสิทธิประโยชน์ */}
        <div className="rounded-2xl border border-border/20 bg-bg/25 p-5 space-y-5 shadow-sm">
          <div className="border-b border-border/20 pb-3 flex items-center gap-2">
            <span className="h-5 w-5 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black">2</span>
            <h3 className="text-xs font-black text-secondary uppercase tracking-wider">รายละเอียดสิทธิประโยชน์ (Benefits & Timeframe)</h3>
          </div>

          {/* Discount Text */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-secondary">
              ส่วนลด / ผลประโยชน์ที่ได้รับ <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.discountText}
              onChange={(e) => setFormData({ ...formData, discountText: e.target.value })}
              className="input block w-full text-xs rounded-xl border border-border/20 bg-bg/25 text-secondary p-3 focus:outline-none focus:ring-1 focus:ring-primary/45 focus:border-primary/45 transition-all shadow-sm"
              placeholder="เช่น ลดทันที 15%, ซื้อ 1 แถม 1, ราคาพิเศษ ฿159"
              required
            />
          </div>

          {/* Short Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-secondary">คำอธิบายสั้นๆ (Short Summary)</label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              className="input block w-full text-xs rounded-xl border border-border/20 bg-bg/25 text-secondary p-3 focus:outline-none focus:ring-1 focus:ring-primary/45 focus:border-primary/45 transition-all shadow-sm"
              placeholder="ข้อความกระชับสำหรับแสดงผลหน้ารวมการ์ดดีล"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-secondary">รายละเอียดเพิ่มเติม (Full Description)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input block w-full text-xs rounded-xl border border-border/20 bg-bg/25 text-secondary p-3 focus:outline-none focus:ring-1 focus:ring-primary/45 focus:border-primary/45 transition-all shadow-sm"
              rows={3}
              placeholder="ระบุข้อมูลเพิ่มเติม รายละเอียดแพ็กเกจ หรือรายละเอียดสิทธิประโยชน์อื่นๆ"
            />
          </div>

          {/* Campaign Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-secondary">
                วันที่เริ่มโปรโมชัน
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input block w-full text-xs rounded-xl border border-border/20 bg-bg/25 text-secondary p-3 focus:outline-none focus:ring-1 focus:ring-primary/45 focus:border-primary/45 transition-all shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
            <label className="block text-xs font-bold text-secondary">
              วันหมดอายุการจัดโปรโมชัน <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="input block w-full text-xs rounded-xl border border-border/20 bg-bg/25 text-secondary p-3 focus:outline-none focus:ring-1 focus:ring-primary/45 focus:border-primary/45 transition-all shadow-sm"
              required
            />
            </div>
          </div>
        </div>

        {/* STEP 3: วิธีการรับสิทธิ์และเงื่อนไข */}
        <div className="rounded-2xl border border-border/20 bg-bg/25 p-5 space-y-5 shadow-sm">
          <div className="border-b border-border/20 pb-3 flex items-center gap-2">
            <span className="h-5 w-5 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black">3</span>
            <h3 className="text-xs font-black text-secondary uppercase tracking-wider">วิธีการรับสิทธิ์และเงื่อนไข (Claim & Conditions)</h3>
          </div>

          {/* Claim Type & Coupon Code */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-secondary">
                วิธีรับสิทธิ์คูปอง <span className="text-danger">*</span>
              </label>
              <select
                value={formData.claimType}
                onChange={(e) => setFormData({ ...formData, claimType: e.target.value as ClaimType })}
                className="block w-full text-xs rounded-xl border border-border/20 bg-bg/25 text-secondary p-3 focus:outline-none focus:ring-1 focus:ring-primary/45 focus:border-primary/45 transition-all shadow-sm"
              >
                {CLAIM_TYPES.map((type) => (
                  <option key={type} value={type}>{CLAIM_TYPE_LABELS[type]}</option>
                ))}
              </select>
            </div>

            {formData.claimType === 'copy_code' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-secondary">รหัสโค้ดส่วนลด</label>
                <input
                  type="text"
                  value={formData.couponCode}
                  onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                  className="input block w-full text-xs rounded-xl border border-border/20 bg-bg/25 text-secondary p-3 font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-primary/45 focus:border-primary/45 transition-all shadow-sm"
                  placeholder="เช่น CAFECOFFEE15"
                />
              </div>
            )}
          </div>

          {/* Conditions */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-secondary">เงื่อนไขเพิ่มเติมการรับสิทธิ์</label>
            <textarea
              value={formData.conditions}
              onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
              className="input block w-full text-xs rounded-xl border border-border/20 bg-bg/25 text-secondary p-3 focus:outline-none focus:ring-1 focus:ring-primary/45 focus:border-primary/45 transition-all shadow-sm"
              rows={3}
              placeholder="• เช่น จำกัด 1 สิทธิ์ ต่อ 1 ท่าน&#10;• เฉพาะวันจันทร์ - ศุกร์ เท่านั้น"
            />
          </div>
        </div>

        {/* Actions Button Block */}
        <div className="flex justify-end gap-3 border-t border-border/20 pt-5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-black rounded-xl bg-bg-secondary text-text-secondary border border-border/15 hover:bg-bg-tertiary hover:text-text-primary transition-all duration-200 cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-primary to-orange-500 text-white shadow-md shadow-primary/10 hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>กำลังบันทึกดีล...</span>
              </>
            ) : (
              <span>{deal ? 'บันทึกข้อมูลดีล' : 'ยืนยันเพิ่มดีล'}</span>
            )}
          </button>
        </div>
      </form>

      {/* Right Panel: Sticky Live Customer Mobile Mockup Preview */}
      <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
        <div className="text-center">
          <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest block mb-1">ตัวอย่างมุมมองลูกค้า (Live Customer View)</span>
          <p className="text-[9px] text-text-tertiary font-bold">การ์ดจะอัปเดตแบบเรียลไทม์ตามข้อมูลที่คุณกำลังกรอก</p>
        </div>

        {/* Smartphone Simulator */}
        <div className="w-full max-w-[310px] mx-auto rounded-[38px] border-[8px] border-slate-800 bg-bg shadow-xl overflow-hidden aspect-[9/18] flex flex-col relative select-none">
          {/* Speaker / Camera Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full z-20 flex items-center justify-center">
            <div className="w-8 h-1 bg-slate-700 rounded-full mb-1"></div>
          </div>
          
          {/* Screen Content Wrapper */}
          <div className="flex-1 overflow-y-auto pt-8 flex flex-col justify-between bg-bg-secondary/40">
            {/* Dynamic Header Image area */}
            <div className="relative h-36 w-full bg-gradient-to-br from-primary/10 to-orange-500/10 border-b border-border/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <span className="text-3xl filter drop-shadow-md select-none">{getCategoryEmoji(formData.category)}</span>
                  <div className="text-[9px] text-text-tertiary mt-2 font-black uppercase tracking-widest">ภาพคูปองดีล</div>
                </div>
              )}
              
              {/* Category Badge overlay */}
              <div className="absolute top-3 left-3">
                <span 
                  className="text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider shadow-sm"
                  style={{ 
                    backgroundColor: `${categoryColor}15`, 
                    color: categoryColor,
                    borderColor: `${categoryColor}25`
                  }}
                >
                  {DEAL_CATEGORY_LABELS[formData.category] || formData.category}
                </span>
              </div>
            </div>

            {/* Coupon Content Body */}
            <div className="p-4 flex-1 flex flex-col justify-between gap-4">
              <div className="space-y-2.5">
                {/* Discount text highlighted pill */}
                <div className="text-center py-2.5 px-3 rounded-2xl bg-gradient-to-r from-primary/5 to-orange-500/5 border border-primary/10">
                  <span className="text-[9px] font-black text-text-tertiary uppercase tracking-wider block">สิทธิพิเศษที่คุณได้รับ</span>
                  <span className="text-base font-black bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent block truncate">
                    {formData.discountText || 'ส่วนลดพิเศษ'}
                  </span>
                </div>

                {/* Deal Title */}
                <h3 className="text-xs font-black text-secondary leading-snug line-clamp-2">
                  {formData.title || 'ชื่อดีลโปรโมชันร้านค้าของคุณ'}
                </h3>

                {/* Short Description */}
                <p className="text-[10px] text-text-tertiary font-bold leading-relaxed line-clamp-3">
                  {formData.shortDescription || 'สรุปคำอธิบายสั้นกระชับสำหรับแสดงในหน้าการ์ดหลัก'}
                </p>

                {/* Timeframe Expiry tag */}
                <div className="text-[9px] font-black text-text-tertiary flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  <span>ใช้งานได้ถึง: {formData.endDate ? formatDateString(formData.endDate) : 'กำหนดวันหมดอายุ'}</span>
                </div>
              </div>

              {/* Action/Claim trigger block */}
              <div className="space-y-3 pt-2">
                {formData.claimType === 'copy_code' && (
                  <div className="rounded-xl border border-dashed border-border/30 bg-bg-secondary p-2.5 text-center">
                    <span className="text-[8px] font-black text-text-tertiary uppercase tracking-widest block mb-0.5">โค้ดคูปองสำหรับก๊อปปี้</span>
                    <span className="text-xs font-mono font-black tracking-wider text-secondary">
                      {formData.couponCode || 'CODE2026'}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-orange-500 text-white text-[10px] font-black shadow-md shadow-primary/15 tracking-wide active:scale-95 transition-all cursor-default"
                >
                  {formData.claimType === 'copy_code' ? 'คัดลอกโค้ดคูปอง' : 'กดรับสิทธิ์ใช้งาน'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
