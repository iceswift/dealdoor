// src/components/onboarding/DealQuickAdd.tsx

import { useState, useEffect } from 'react';
import { DEAL_CATEGORIES, DEAL_CATEGORY_LABELS, CLAIM_TYPES, CLAIM_TYPE_LABELS } from '../../lib/constants';
import type { DealCategory, ClaimType } from '../../lib/constants';
import { getOnboardingState, saveOnboardingState, DEAL_TEMPLATES } from '../../lib/onboarding';

interface DealQuickAddProps {
  onNext: () => void;
  onBack: () => void;
}

export default function DealQuickAdd({ onNext, onBack }: DealQuickAddProps) {
  const [deals, setDeals] = useState<Array<{
    title: string;
    category: DealCategory;
    discountText: string;
    endDate: string;
    couponCode: string;
    claimType: ClaimType;
  }>>([]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'custom' as DealCategory,
    discountText: '',
    endDate: '',
    couponCode: '',
    claimType: 'copy_code' as ClaimType,
  });

  useEffect(() => {
    const state = getOnboardingState();
    if (state.deals && state.deals.length > 0) {
      setDeals(state.deals as any);
    }
  }, []);

  const handleUseTemplate = (template: typeof DEAL_TEMPLATES[0]) => {
    setFormData({
      ...template.data,
      couponCode: '',
      endDate: template.data.endDate,
    } as any);
    setShowForm(true);
  };

  const handleAddDeal = () => {
    if (!formData.title || !formData.discountText || !formData.endDate) {
      alert('กรุณากรอกข้อมูลที่จำเป็น');
      return;
    }

    setDeals([...deals, { ...formData }]);
    setFormData({
      title: '',
      category: 'custom',
      discountText: '',
      endDate: '',
      couponCode: '',
      claimType: 'copy_code',
    });
    setShowForm(false);
  };

  const handleRemoveDeal = (index: number) => {
    setDeals(deals.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    // Save state
    const state = getOnboardingState();
    state.deals = deals;
    state.step = 3;
    saveOnboardingState(state);

    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border/30 pb-4">
        <h2 className="text-lg font-extrabold text-secondary">เพิ่มข้อเสนอแรกของร้าน 🎉</h2>
        <p className="mt-1 text-xs text-text-secondary leading-relaxed">
          สร้างดีลสุดพิเศษหรือคูปองส่วนลดเพื่อจูงใจให้ลูกค้าเข้ามาใช้สิทธิ์
        </p>
      </div>

      {/* Quick Templates */}
      {!showForm && deals.length === 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">เทมเพลตด่วนแนะนำ</h3>
          <div className="grid grid-cols-2 gap-3">
            {DEAL_TEMPLATES.map((template) => (
              <button
                key={template.name}
                type="button"
                onClick={() => handleUseTemplate(template)}
                className="rounded-2xl border border-border bg-bg p-4 text-left transition-all hover:border-primary hover:shadow-md group min-h-[80px]"
              >
                <span className="text-2xl transition-transform group-hover:scale-110 inline-block">{template.icon}</span>
                <p className="mt-1 text-xs font-bold text-secondary group-hover:text-primary transition-colors">{template.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Added Deals */}
      {deals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">ดีลที่พร้อมใช้งาน ({deals.length})</h3>
          <div className="space-y-2.5">
            {deals.map((deal, index) => (
              <div key={index} className="flex items-center justify-between rounded-2xl border border-border/50 bg-bg p-4 shadow-sm hover:border-primary/20 transition-all">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-secondary truncate">{deal.title}</p>
                  <p className="text-xs text-text-secondary truncate mt-0.5">{deal.discountText}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveDeal(index)}
                  className="h-11 w-11 rounded-xl flex items-center justify-center text-text-tertiary hover:text-danger hover:bg-danger-bg/25 transition-all"
                  aria-label="ลบดีลนี้"
                >
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Deal Form */}
      {showForm ? (
        <div className="rounded-3xl border border-border/50 bg-bg p-5 shadow-sm space-y-4">
          <div className="border-b border-border/30 pb-2.5">
            <h3 className="text-sm font-bold text-secondary">กรอกข้อมูลดีล</h3>
          </div>
          
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider">ชื่อข้อเสนอดีล *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input mt-1.5 py-2.5"
                placeholder="เช่น Birthday Free Brownie"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider">หมวดหมู่ดีล *</label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {DEAL_CATEGORIES.slice(0, 5).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                      formData.category === cat
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                    }`}
                  >
                    {DEAL_CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider">ส่วนลด / สิทธิประโยชน์ *</label>
              <input
                type="text"
                value={formData.discountText}
                onChange={(e) => setFormData({ ...formData, discountText: e.target.value })}
                className="input mt-1.5 py-2.5"
                placeholder="เช่น ฟรีบราวนี่ 1 ชิ้น หรือ ส่วนลด 15%"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider">วันหมดอายุของดีล *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="input mt-1.5 py-2.5"
                required
              />
            </div>
            
            {formData.claimType === 'copy_code' && (
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider">รหัสโค้ดคูปอง (ไม่บังคับ)</label>
                <input
                  type="text"
                  value={formData.couponCode}
                  onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                  className="input mt-1.5 py-2.5 font-mono tracking-wider"
                  placeholder="เช่น BDAY2025"
                />
              </div>
            )}
            
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={handleAddDeal}
                className="btn btn-primary flex-1 py-2.5 rounded-xl text-xs shadow-md"
              >
                ยืนยันเพิ่มดีล
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary flex-1 py-2.5 rounded-xl text-xs"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full min-h-[50px] rounded-2xl border border-dashed border-border/80 p-4 text-center text-xs font-bold text-text-secondary hover:border-primary hover:text-primary transition-all bg-bg-secondary/20"
        >
          + เพิ่มดีลโปรโมชันใหม่
        </button>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-border/30">
        <button
          type="button"
          onClick={onBack}
          className="btn btn-secondary flex-1 py-3 rounded-xl text-xs font-bold"
        >
          ← ย้อนกลับ
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={deals.length === 0}
          className="btn btn-primary flex-1 py-3 rounded-xl text-xs font-bold shadow-md disabled:opacity-50 disabled:pointer-events-none"
        >
          ถัดไป →
        </button>
      </div>

      {/* Skip Onboarding link */}
      <button
        type="button"
        onClick={handleNext}
        className="w-full text-center text-[11px] font-bold text-text-tertiary hover:text-primary transition-colors min-h-[44px]"
      >
        ข้ามเพื่อไปเปิดใช้งานที่ระบบหลังบ้านภายหลัง
      </button>
    </div>
  );
}
