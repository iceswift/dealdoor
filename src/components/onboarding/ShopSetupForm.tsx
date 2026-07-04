// src/components/onboarding/ShopSetupForm.tsx

import { useState, useEffect } from 'react';
import { SHOP_CATEGORIES, SHOP_CATEGORY_LABELS } from '../../lib/constants';
import type { ShopCategory } from '../../lib/constants';
import { getOnboardingState, saveOnboardingState } from '../../lib/onboarding';

interface ShopSetupFormProps {
  onNext: () => void;
}

export default function ShopSetupForm({ onNext }: ShopSetupFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'cafe' as ShopCategory,
    description: '',
    phone: '',
    lineId: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const state = getOnboardingState();
    if (state.shop) {
      setFormData(state.shop as any);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      alert('กรุณากรอกชื่อร้าน');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // Save state
      const state = getOnboardingState();
      state.shop = formData;
      state.step = 2;
      saveOnboardingState(state);
      setLoading(false);
      onNext();
    }, 400);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-border/30 pb-4">
        <h2 className="text-lg font-extrabold text-secondary">ตั้งค่าร้านค้าของคุณ 🏪</h2>
        <p className="mt-1 text-xs text-text-secondary leading-relaxed">
          เริ่มต้นกรอกข้อมูลพื้นฐานเพื่อให้ระบุตัวตนพาร์ทเนอร์ร้านได้ถูกต้อง
        </p>
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs font-bold text-secondary uppercase tracking-wider">
          ชื่อร้านค้า <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input mt-1.5 py-2.5"
          placeholder="เช่น Moon Bowl Cafe"
          required
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-bold text-secondary uppercase tracking-wider">
          ประเภทร้านค้า <span className="text-danger">*</span>
        </label>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {SHOP_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFormData({ ...formData, category: cat })}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all border border-transparent ${
                formData.category === cat
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
              }`}
            >
              {SHOP_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-bold text-secondary uppercase tracking-wider">คำอธิบายสั้นของร้าน</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="input mt-1.5 py-2.5"
          rows={3}
          placeholder="บอกลูกค้าสักนิดเกี่ยวกับข้อเสนอหรือเมนูเด็ดของร้าน (ไม่บังคับ)"
        />
      </div>

      {/* Phone & LINE */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider">เบอร์โทรศัพท์ติดต่อ</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="input mt-1.5 py-2.5"
            placeholder="081-234-5678"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider">LINE ID ร้านค้า</label>
          <input
            type="text"
            value={formData.lineId}
            onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
            className="input mt-1.5 py-2.5"
            placeholder="@shopname"
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-xs font-bold text-secondary uppercase tracking-wider">ที่ตั้งร้านค้า / ที่อยู่</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="input mt-1.5 py-2.5"
          placeholder="ที่อยู่ร้านสำหรับการปักหมุดนำทาง (ไม่บังคับ)"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full py-3 rounded-xl font-bold shadow-md mt-6"
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin mr-1.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>กำลังบันทึกข้อมูล...</span>
          </>
        ) : (
          <>
            <span>ขั้นตอนถัดไป</span>
            <svg className="h-4 w-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
