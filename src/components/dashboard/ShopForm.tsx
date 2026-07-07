// src/components/dashboard/ShopForm.tsx

import { useMemo, useState } from 'react';
import type { Shop } from '../../../db/schema';
import ImageUpload from '../shared/ImageUpload.tsx';

interface ShopFormProps {
  shop: Shop | null;
  onSuccess: (shop: Shop) => void;
  onChange?: (data: ShopFormState) => void;
}

type SectionId = 'identity' | 'location' | 'contact' | 'facilities' | 'brand';

type ShopFormState = {
  name: string;
  category: string;
  description: string;
  address: string;
  latitude: string;
  longitude: string;
  openingHours: string;
  isOpen: boolean;
  phone: string;
  lineId: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  websiteUrl: string;
  acceptsPromptPay: boolean;
  acceptsCash: boolean;
  acceptsCreditCard: boolean;
  acceptsTrueMoney: boolean;
  acceptsRabbitLinePay: boolean;
  paymentNotes: string;
  wheelchairAccessible: boolean;
  strollerAccessible: boolean;
  seniorFriendlyRestroom: boolean;
  elevatorAvailable: boolean;
  brailleMenu: boolean;
  accessibilityNotes: string;
  freeParking: boolean;
  paidParking: boolean;
  motorcycleParking: boolean;
  evCharging: boolean;
  nearbyBts: string;
  nearbyMrt: string;
  parkingNotes: string;
  petFriendly: boolean;
  petMenu: boolean;
  petWaterBowl: boolean;
  petNotes: string;
  kidsMenu: boolean;
  highChairs: boolean;
  playArea: boolean;
  babyChanging: boolean;
  familyNotes: string;
  coverImage: string;
  logoImage: string;
};

const categories = [
  { id: 'restaurant', label: 'ร้านอาหาร' },
  { id: 'cafe', label: 'คาเฟ่' },
  { id: 'dessert', label: 'ของหวาน' },
  { id: 'beauty', label: 'ความงาม' },
  { id: 'clinic', label: 'คลินิก' },
  { id: 'retail', label: 'ร้านค้า' },
  { id: 'service', label: 'บริการ' },
  { id: 'other', label: 'อื่น ๆ' },
];

function initialState(shop: Shop | null): ShopFormState {
  return {
    name: shop?.name || '',
    category: shop?.category || 'cafe',
    description: shop?.description || '',
    address: shop?.address || '',
    latitude: shop?.latitude?.toString() || '',
    longitude: shop?.longitude?.toString() || '',
    openingHours: shop?.openingHours || '',
    isOpen: shop?.isOpen ?? true,
    phone: shop?.phone || '',
    lineId: shop?.lineId || '',
    facebookUrl: shop?.facebookUrl || '',
    instagramUrl: shop?.instagramUrl || '',
    tiktokUrl: shop?.tiktokUrl || '',
    websiteUrl: shop?.websiteUrl || '',
    acceptsPromptPay: shop?.acceptsPromptPay || false,
    acceptsCash: shop?.acceptsCash ?? true,
    acceptsCreditCard: shop?.acceptsCreditCard || false,
    acceptsTrueMoney: shop?.acceptsTrueMoney || false,
    acceptsRabbitLinePay: shop?.acceptsRabbitLinePay || false,
    paymentNotes: shop?.paymentNotes || '',
    wheelchairAccessible: shop?.wheelchairAccessible || false,
    strollerAccessible: shop?.strollerAccessible || false,
    seniorFriendlyRestroom: shop?.seniorFriendlyRestroom || false,
    elevatorAvailable: shop?.elevatorAvailable || false,
    brailleMenu: shop?.brailleMenu || false,
    accessibilityNotes: shop?.accessibilityNotes || '',
    freeParking: shop?.freeParking || false,
    paidParking: shop?.paidParking || false,
    motorcycleParking: shop?.motorcycleParking || false,
    evCharging: shop?.evCharging || false,
    nearbyBts: shop?.nearbyBts || '',
    nearbyMrt: shop?.nearbyMrt || '',
    parkingNotes: shop?.parkingNotes || '',
    petFriendly: shop?.petFriendly || false,
    petMenu: shop?.petMenu || false,
    petWaterBowl: shop?.petWaterBowl || false,
    petNotes: shop?.petNotes || '',
    kidsMenu: shop?.kidsMenu || false,
    highChairs: shop?.highChairs || false,
    playArea: shop?.playArea || false,
    babyChanging: shop?.babyChanging || false,
    familyNotes: shop?.familyNotes || '',
    coverImage: shop?.coverImage || '',
    logoImage: shop?.logoImage || '',
  };
}

export default function ShopForm({ shop, onSuccess, onChange }: ShopFormProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('identity');
  const [formData, setFormData] = useState<ShopFormState>(() => initialState(shop));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const readiness = useMemo(() => {
    const checks = [
      Boolean(formData.name.trim()),
      Boolean(formData.category),
      Boolean(formData.description.trim()),
      Boolean(formData.address.trim()),
      Boolean(formData.latitude.trim() && formData.longitude.trim()),
      Boolean(formData.openingHours.trim()),
      Boolean(formData.phone.trim() || formData.lineId.trim() || formData.websiteUrl.trim() || formData.facebookUrl.trim() || formData.instagramUrl.trim()),
      Boolean(formData.coverImage || formData.logoImage),
    ];
    const done = checks.filter(Boolean).length;
    return { done, total: checks.length, score: Math.round((done / checks.length) * 100) };
  }, [formData]);

  function setField<K extends keyof ShopFormState>(key: K, value: ShopFormState[K]) {
    setFormData((current) => {
      const next = { ...current, [key]: value };
      onChange?.(next);
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.category) {
      setError('กรุณากรอกชื่อร้านและประเภทร้าน');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(shop ? `/api/shops/${shop.id}` : '/api/shops', {
        method: shop ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error?.message || 'บันทึกข้อมูลร้านไม่สำเร็จ');
      }
      onSuccess(payload.data);
    } catch (err: any) {
      setError(err.message || 'บันทึกข้อมูลร้านไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  const sections: { id: SectionId; label: string; hint: string }[] = [
    { id: 'identity', label: 'ตัวตนร้าน', hint: 'ชื่อ ประเภท คำอธิบาย' },
    { id: 'location', label: 'สถานที่', hint: 'ที่อยู่ พิกัด เวลาเปิด' },
    { id: 'contact', label: 'ติดต่อ', hint: 'เบอร์ LINE โซเชียล' },
    { id: 'facilities', label: 'สิ่งอำนวยความสะดวก', hint: 'จ่ายเงิน เดินทาง ครอบครัว' },
    { id: 'brand', label: 'รูปภาพ', hint: 'หน้าปกและโลโก้' },
  ];

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[280px_1fr]">
      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <section className="rounded-3xl border border-border/40 bg-card-bg p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-primary">Explore Readiness</p>
          <div className="mt-2 flex items-end justify-between">
            <h2 className="text-lg font-black text-secondary">ความพร้อมร้าน</h2>
            <span className="text-3xl font-black text-secondary">{readiness.score}%</span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-bg-tertiary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${readiness.score}%` }} />
          </div>
          <p className="mt-2 text-xs font-bold text-text-tertiary">
            กรอกแล้ว {readiness.done}/{readiness.total} หมวดสำคัญ
          </p>
        </section>

        <nav className="space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                activeSection === section.id
                  ? 'border-primary bg-primary text-white'
                  : 'border-border/40 bg-card-bg text-secondary hover:border-primary/40'
              }`}
            >
              <p className="text-sm font-black">{section.label}</p>
              <p className={`mt-1 text-xs font-bold ${activeSection === section.id ? 'text-white/80' : 'text-text-tertiary'}`}>
                {section.hint}
              </p>
            </button>
          ))}
        </nav>
      </aside>

      <div className="space-y-5">
        {error && (
          <div className="rounded-2xl border border-danger/20 bg-danger-bg/20 p-4 text-sm font-bold text-danger" role="alert">
            {error}
          </div>
        )}

        {activeSection === 'identity' && (
          <section className="rounded-3xl border border-border/40 bg-card-bg p-5 shadow-sm">
            <h2 className="text-xl font-black text-secondary">ตัวตนร้าน</h2>
            <p className="mt-1 text-sm font-bold text-text-tertiary">ข้อมูลนี้ใช้แสดงบนหน้าร้าน การ์ดดีล และหน้า Explore</p>
            <div className="mt-5 grid gap-4">
              <label>
                <span className="text-sm font-black text-secondary">ชื่อร้าน</span>
                <input value={formData.name} onChange={(e) => setField('name', e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-border/40 bg-bg px-4 text-sm font-bold outline-none focus:border-primary" required />
              </label>
              <div>
                <span className="text-sm font-black text-secondary">ประเภทร้าน</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button key={category.id} type="button" onClick={() => setField('category', category.id)} className={`min-h-[40px] rounded-full border px-4 text-xs font-black ${formData.category === category.id ? 'border-primary bg-primary text-white' : 'border-border/50 bg-bg text-text-secondary'}`}>
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
              <label>
                <span className="text-sm font-black text-secondary">คำอธิบายร้าน</span>
                <textarea value={formData.description} onChange={(e) => setField('description', e.target.value)} rows={5} className="mt-2 w-full rounded-2xl border border-border/40 bg-bg p-4 text-sm font-bold outline-none focus:border-primary" placeholder="เล่าว่าร้านของคุณเหมาะกับใคร มีจุดเด่นอะไร" />
              </label>
            </div>
          </section>
        )}

        {activeSection === 'location' && (
          <section className="rounded-3xl border border-border/40 bg-card-bg p-5 shadow-sm">
            <h2 className="text-xl font-black text-secondary">สถานที่และเวลาเปิด</h2>
            <div className="mt-5 grid gap-4">
              <label>
                <span className="text-sm font-black text-secondary">ที่อยู่</span>
                <textarea value={formData.address} onChange={(e) => setField('address', e.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-border/40 bg-bg p-4 text-sm font-bold outline-none focus:border-primary" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="text-sm font-black text-secondary">Latitude</span>
                  <input value={formData.latitude} onChange={(e) => setField('latitude', e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-border/40 bg-bg px-4 text-sm font-bold outline-none focus:border-primary" placeholder="13.7563" />
                </label>
                <label>
                  <span className="text-sm font-black text-secondary">Longitude</span>
                  <input value={formData.longitude} onChange={(e) => setField('longitude', e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-border/40 bg-bg px-4 text-sm font-bold outline-none focus:border-primary" placeholder="100.5018" />
                </label>
              </div>
              <label>
                <span className="text-sm font-black text-secondary">เวลาเปิด-ปิด</span>
                <input value={formData.openingHours} onChange={(e) => setField('openingHours', e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-border/40 bg-bg px-4 text-sm font-bold outline-none focus:border-primary" placeholder="จันทร์-ศุกร์ 08:00-18:00" />
              </label>
              <label className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-border/40 bg-bg px-4">
                <input type="checkbox" checked={formData.isOpen} onChange={(e) => setField('isOpen', e.target.checked)} />
                <span className="text-sm font-black text-secondary">เปิดรับลูกค้าอยู่</span>
              </label>
            </div>
          </section>
        )}

        {activeSection === 'contact' && (
          <section className="rounded-3xl border border-border/40 bg-card-bg p-5 shadow-sm">
            <h2 className="text-xl font-black text-secondary">ช่องทางติดต่อ</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ['phone', 'เบอร์โทร'],
                ['lineId', 'LINE ID'],
                ['facebookUrl', 'Facebook URL'],
                ['instagramUrl', 'Instagram URL'],
                ['tiktokUrl', 'TikTok URL'],
                ['websiteUrl', 'Website URL'],
              ].map(([key, label]) => (
                <label key={key}>
                  <span className="text-sm font-black text-secondary">{label}</span>
                  <input value={String(formData[key as keyof ShopFormState])} onChange={(e) => setField(key as keyof ShopFormState, e.target.value as never)} className="mt-2 h-12 w-full rounded-2xl border border-border/40 bg-bg px-4 text-sm font-bold outline-none focus:border-primary" />
                </label>
              ))}
            </div>
          </section>
        )}

        {activeSection === 'facilities' && (
          <section className="rounded-3xl border border-border/40 bg-card-bg p-5 shadow-sm">
            <h2 className="text-xl font-black text-secondary">สิ่งอำนวยความสะดวก</h2>
            <div className="mt-5 grid gap-5">
              <CheckboxGroup title="ช่องทางชำระเงิน" items={[
                ['acceptsCash', 'เงินสด'],
                ['acceptsPromptPay', 'PromptPay'],
                ['acceptsCreditCard', 'บัตรเครดิต'],
                ['acceptsTrueMoney', 'TrueMoney'],
                ['acceptsRabbitLinePay', 'Rabbit LINE Pay'],
              ]} formData={formData} setField={setField} />
              <CheckboxGroup title="การเดินทางและการเข้าถึง" items={[
                ['freeParking', 'ที่จอดรถฟรี'],
                ['paidParking', 'ที่จอดรถเสียเงิน'],
                ['motorcycleParking', 'จอดมอเตอร์ไซค์'],
                ['evCharging', 'EV Charging'],
                ['wheelchairAccessible', 'Wheelchair Accessible'],
                ['strollerAccessible', 'รถเข็นเด็กเข้าได้'],
              ]} formData={formData} setField={setField} />
              <CheckboxGroup title="ครอบครัวและสัตว์เลี้ยง" items={[
                ['kidsMenu', 'เมนูเด็ก'],
                ['highChairs', 'เก้าอี้เด็ก'],
                ['playArea', 'พื้นที่เด็กเล่น'],
                ['babyChanging', 'ที่เปลี่ยนผ้าอ้อม'],
                ['petFriendly', 'นำสัตว์เลี้ยงเข้าได้'],
                ['petWaterBowl', 'มีน้ำสำหรับสัตว์เลี้ยง'],
              ]} formData={formData} setField={setField} />
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="text-sm font-black text-secondary">BTS ใกล้เคียง</span>
                  <input value={formData.nearbyBts} onChange={(e) => setField('nearbyBts', e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-border/40 bg-bg px-4 text-sm font-bold outline-none focus:border-primary" />
                </label>
                <label>
                  <span className="text-sm font-black text-secondary">MRT ใกล้เคียง</span>
                  <input value={formData.nearbyMrt} onChange={(e) => setField('nearbyMrt', e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-border/40 bg-bg px-4 text-sm font-bold outline-none focus:border-primary" />
                </label>
              </div>
            </div>
          </section>
        )}

        {activeSection === 'brand' && (
          <section className="rounded-3xl border border-border/40 bg-card-bg p-5 shadow-sm">
            <h2 className="text-xl font-black text-secondary">รูปภาพร้าน</h2>
            <div className="mt-5 grid gap-6">
              <ImageUpload type="cover" currentUrl={formData.coverImage} onUpload={(url) => setField('coverImage', url)} label="รูปหน้าปก" />
              <ImageUpload type="logo" currentUrl={formData.logoImage} onUpload={(url) => setField('logoImage', url)} label="โลโก้ร้าน" />
            </div>
          </section>
        )}

        <div className="sticky bottom-20 z-10 rounded-3xl border border-border/40 bg-card-bg/90 p-3 shadow-xl backdrop-blur lg:bottom-4">
          <button type="submit" disabled={loading} className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-primary px-5 text-sm font-black text-white shadow-lg shadow-primary/20 disabled:opacity-60">
            {loading ? 'กำลังบันทึก...' : shop ? 'บันทึกข้อมูลร้าน' : 'สร้างร้านค้า'}
          </button>
        </div>
      </div>
    </form>
  );
}

function CheckboxGroup({
  title,
  items,
  formData,
  setField,
}: {
  title: string;
  items: [keyof ShopFormState, string][];
  formData: ShopFormState;
  setField: <K extends keyof ShopFormState>(key: K, value: ShopFormState[K]) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-black text-secondary">{title}</h3>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([key, label]) => (
          <label key={String(key)} className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-border/40 bg-bg px-4">
            <input
              type="checkbox"
              checked={Boolean(formData[key])}
              onChange={(event) => setField(key, event.target.checked as never)}
            />
            <span className="text-sm font-black text-secondary">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
