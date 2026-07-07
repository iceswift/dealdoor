// src/components/dashboard/DealForm.tsx

import { useMemo, useState } from 'react';
import type { Deal } from '../../../db/schema';
import ImageUpload from '../shared/ImageUpload.tsx';

interface DealFormProps {
  deal?: Deal | null;
  onSuccess?: () => void;
  onCancel?: () => void;
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

export default function DealForm({ deal, onSuccess, onCancel }: DealFormProps) {
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

  const previewStatus = useMemo(() => {
    if (!formData.endDate) return 'ยังไม่กำหนดวันหมดอายุ';
    const now = new Date();
    const end = new Date(formData.endDate);
    if (end < now) return 'วันหมดอายุอยู่ในอดีต';
    return `หมดอายุ ${end.toLocaleDateString('th-TH', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }, [formData.endDate]);

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
        <section className="overflow-hidden rounded-3xl border border-border/40 bg-card-bg shadow-sm">
          <div className="aspect-[4/3] bg-bg-secondary">
            {formData.imageUrl ? (
              <img src={formData.imageUrl} alt="ตัวอย่างรูปดีล" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-black text-text-tertiary">ตัวอย่างดีล</div>
            )}
          </div>
          <div className="space-y-3 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                {categories.find((item) => item.id === formData.category)?.label || 'ทั่วไป'}
              </span>
              <span className="text-xs font-bold text-text-tertiary">{previewStatus}</span>
            </div>
            <h3 className="text-lg font-black text-secondary">{formData.title || 'ชื่อดีลของคุณ'}</h3>
            <p className="text-sm font-black text-primary">{formData.discountText || 'ส่วนลดหรือโปรโมชัน'}</p>
            <p className="text-sm font-bold text-text-secondary">
              {formData.shortDescription || formData.description || 'รายละเอียดสั้น ๆ จะช่วยให้ลูกค้าตัดสินใจเร็วขึ้น'}
            </p>
          </div>
        </section>

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
