// src/components/dashboard/ShopForm.tsx

import { useEffect, useMemo, useState } from 'react';
import type { Shop } from '../../../db/schema';
import ImageUpload from '../shared/ImageUpload.tsx';

interface ShopFormProps {
  shop: Shop | null;
  onSuccess: (shop: Shop) => void;
  onChange?: (data: ShopFormState) => void;
}

type SectionId = 'identity' | 'location' | 'hours' | 'contact' | 'facilities' | 'brand';

const sectionIds: SectionId[] = ['identity', 'location', 'hours', 'contact', 'facilities', 'brand'];

type ShopFormState = {
  name: string;
  category: string;
  description: string;
  address: string;
  latitude: string;
  longitude: string;
  openingHours: string;
  isOpen: boolean;
  vacationMode: boolean;
  vacationMessage: string;
  vacationUntil: string;
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

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

type OperatingDay = {
  key: DayKey;
  label: string;
  shortLabel: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
};

type SpecialHour = {
  id: string;
  date: string;
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
  note: string | null;
};

type SpecialHourFormState = {
  id?: string;
  date: string;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
  note: string;
};

const defaultSpecialHourForm: SpecialHourFormState = {
  date: new Date().toISOString().slice(0, 10),
  isClosed: true,
  openTime: '09:00',
  closeTime: '18:00',
  note: '',
};

const thaiPublicHolidayPresets2026 = [
  { date: '2026-01-01', note: 'วันขึ้นปีใหม่' },
  { date: '2026-02-17', note: 'วันตรุษจีน' },
  { date: '2026-03-03', note: 'วันมาฆบูชา' },
  { date: '2026-03-19', note: 'วันฮารีรายอปอซอ' },
  { date: '2026-03-20', note: 'วันหยุดต่อเนื่องฮารีรายอปอซอ' },
  { date: '2026-04-06', note: 'วันจักรี' },
  { date: '2026-04-13', note: 'วันสงกรานต์' },
  { date: '2026-04-14', note: 'วันสงกรานต์' },
  { date: '2026-04-15', note: 'วันสงกรานต์' },
  { date: '2026-05-01', note: 'วันแรงงานแห่งชาติ' },
  { date: '2026-05-04', note: 'วันฉัตรมงคล' },
  { date: '2026-05-13', note: 'วันพืชมงคล' },
  { date: '2026-05-31', note: 'วันวิสาขบูชา' },
  { date: '2026-06-03', note: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี' },
  { date: '2026-07-28', note: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว' },
  { date: '2026-07-29', note: 'วันอาสาฬหบูชา' },
  { date: '2026-08-12', note: 'วันแม่แห่งชาติ' },
  { date: '2026-10-13', note: 'วันนวมินทรมหาราช' },
  { date: '2026-10-23', note: 'วันปิยมหาราช' },
  { date: '2026-12-05', note: 'วันพ่อแห่งชาติ' },
  { date: '2026-12-10', note: 'วันรัฐธรรมนูญ' },
  { date: '2026-12-31', note: 'วันสิ้นปี' },
];

const dayTemplates: OperatingDay[] = [
  { key: 'mon', label: 'จันทร์', shortLabel: 'จ.', isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { key: 'tue', label: 'อังคาร', shortLabel: 'อ.', isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { key: 'wed', label: 'พุธ', shortLabel: 'พ.', isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { key: 'thu', label: 'พฤหัสบดี', shortLabel: 'พฤ.', isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { key: 'fri', label: 'ศุกร์', shortLabel: 'ศ.', isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { key: 'sat', label: 'เสาร์', shortLabel: 'ส.', isOpen: false, openTime: '09:00', closeTime: '18:00' },
  { key: 'sun', label: 'อาทิตย์', shortLabel: 'อา.', isOpen: false, openTime: '09:00', closeTime: '18:00' },
];

function createDefaultOperatingDays() {
  return dayTemplates.map((day) => ({ ...day }));
}

function parseOperatingHours(value?: string | null) {
  if (!value) return createDefaultOperatingDays();

  const parsed = createDefaultOperatingDays();
  for (const day of parsed) {
    const pattern = new RegExp(`${day.label}\\s+(ปิด|\\d{2}:\\d{2})\\s*(?:-|–|ถึง|to)?\\s*(\\d{2}:\\d{2})?`, 'i');
    const match = value.match(pattern);
    if (!match) continue;
    if (match[1] === 'ปิด') {
      day.isOpen = false;
      continue;
    }
    day.isOpen = true;
    day.openTime = match[1] || day.openTime;
    day.closeTime = match[2] || day.closeTime;
  }
  return parsed;
}

function serializeOperatingHours(days: OperatingDay[]) {
  return days.map((day) => `${day.label} ${day.isOpen ? `${day.openTime}-${day.closeTime}` : 'ปิด'}`).join(', ');
}

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

function getInitialSection(): SectionId {
  if (typeof window === 'undefined') return 'identity';
  const section = new URLSearchParams(window.location.search).get('section');
  return sectionIds.includes(section as SectionId) ? (section as SectionId) : 'identity';
}

function initialState(shop: Shop | null): ShopFormState {
  return {
    name: shop?.name || '',
    category: shop?.category || 'cafe',
    description: shop?.description || '',
    address: shop?.address || '',
    latitude: shop?.latitude?.toString() || '',
    longitude: shop?.longitude?.toString() || '',
    openingHours: shop?.openingHours || serializeOperatingHours(createDefaultOperatingDays()),
    isOpen: shop?.isOpen ?? true,
    vacationMode: shop?.vacationMode ?? false,
    vacationMessage: shop?.vacationMessage || '',
    vacationUntil: shop?.vacationUntil ? new Date(shop.vacationUntil).toISOString().slice(0, 10) : '',
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

function SectionIcon({ id }: { id: SectionId }) {
  const iconClass = "h-5 w-5";

  const paths: Record<SectionId, JSX.Element> = {
    identity: (
      <>
        <path d="M4 20V8.5L12 4l8 4.5V20" />
        <path d="M9 20v-6h6v6" />
        <path d="M9 10h6" />
      </>
    ),
    location: (
      <>
        <path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    hours: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
        <path d="M4.5 4.5 6 6" />
        <path d="M19.5 4.5 18 6" />
      </>
    ),
    contact: (
      <>
        <path d="M7 8.5c1.3 3 3.6 5.3 6.5 6.5l2.1-2.1a1.2 1.2 0 0 1 1.2-.3l3.2 1a1.3 1.3 0 0 1 .9 1.2V19a2 2 0 0 1-2 2C10.1 21 3 13.9 3 5a2 2 0 0 1 2-2h4.2a1.3 1.3 0 0 1 1.2.9l1 3.2a1.2 1.2 0 0 1-.3 1.2L9 10.4" />
      </>
    ),
    facilities: (
      <>
        <path d="M4 7h16" />
        <path d="M6 7v13" />
        <path d="M18 7v13" />
        <path d="M9 11h6" />
        <path d="M9 15h6" />
        <path d="M8 4h8l1 3H7l1-3Z" />
      </>
    ),
    brand: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="3" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="m7 17 3.2-3.2a1.5 1.5 0 0 1 2.1 0L15 16.5" />
        <path d="m14 15 1.2-1.2a1.5 1.5 0 0 1 2.1 0L20 16.5" />
      </>
    ),
  };

  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[id]}
    </svg>
  );
}

export default function ShopForm({ shop, onSuccess, onChange }: ShopFormProps) {
  const [activeSection, setActiveSection] = useState<SectionId>(getInitialSection);
  const [formData, setFormData] = useState<ShopFormState>(() => initialState(shop));
  const [operatingDays, setOperatingDays] = useState<OperatingDay[]>(() => parseOperatingHours(shop?.openingHours));
  const [specialHours, setSpecialHours] = useState<SpecialHour[]>([]);
  const [specialHourForm, setSpecialHourForm] = useState<SpecialHourFormState>(defaultSpecialHourForm);
  const [specialHoursLoading, setSpecialHoursLoading] = useState(false);
  const [specialHoursError, setSpecialHoursError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shop) return;

    let cancelled = false;
    setSpecialHoursLoading(true);
    fetch('/api/special-hours')
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        if (!payload.success) throw new Error(payload.error?.message || 'โหลดวันพิเศษไม่สำเร็จ');
        setSpecialHours(payload.data || []);
      })
      .catch((err: any) => {
        if (!cancelled) setSpecialHoursError(err.message || 'โหลดวันพิเศษไม่สำเร็จ');
      })
      .finally(() => {
        if (!cancelled) setSpecialHoursLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shop]);

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

  function setOperatingSchedule(nextDays: OperatingDay[]) {
    setOperatingDays(nextDays);
    setField('openingHours', serializeOperatingHours(nextDays));
  }

  async function saveSpecialHour() {
    if (!shop) {
      setSpecialHoursError('กรุณาบันทึกร้านค้าก่อนเพิ่มวันพิเศษ');
      return;
    }

    setSpecialHoursError('');
    const method = specialHourForm.id ? 'PUT' : 'POST';
    const url = specialHourForm.id ? `/api/special-hours/${specialHourForm.id}` : '/api/special-hours';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(specialHourForm),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      setSpecialHoursError(payload.error?.message || 'บันทึกวันพิเศษไม่สำเร็จ');
      return;
    }

    setSpecialHours((current) => {
      const next = specialHourForm.id
        ? current.map((item) => (item.id === payload.data.id ? payload.data : item))
        : [...current, payload.data];
      return next.sort((a, b) => a.date.localeCompare(b.date));
    });
    setSpecialHourForm(defaultSpecialHourForm);
  }

  async function deleteSpecialHour(id: string) {
    const response = await fetch(`/api/special-hours/${id}`, { method: 'DELETE' });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      setSpecialHoursError(payload.error?.message || 'ลบวันพิเศษไม่สำเร็จ');
      return;
    }
    setSpecialHours((current) => current.filter((item) => item.id !== id));
    if (specialHourForm.id === id) setSpecialHourForm(defaultSpecialHourForm);
  }

  async function importThaiPublicHolidays() {
    if (!shop) {
      setSpecialHoursError('กรุณาบันทึกร้านค้าก่อนนำเข้าวันหยุดไทย');
      return;
    }

    const existingDates = new Set(specialHours.map((item) => item.date));
    const holidaysToImport = thaiPublicHolidayPresets2026.filter((holiday) => !existingDates.has(holiday.date));
    if (holidaysToImport.length === 0) {
      setSpecialHoursError('มีวันหยุดไทยปี 2026 อยู่ครบแล้ว');
      return;
    }

    setSpecialHoursError('');
    const created: SpecialHour[] = [];
    for (const holiday of holidaysToImport) {
      const response = await fetch('/api/special-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: holiday.date,
          isClosed: true,
          openTime: '09:00',
          closeTime: '18:00',
          note: holiday.note,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        setSpecialHoursError(payload.error?.message || 'นำเข้าวันหยุดไทยไม่สำเร็จ');
        return;
      }
      created.push(payload.data);
    }

    setSpecialHours((current) => [...current, ...created].sort((a, b) => a.date.localeCompare(b.date)));
  }

  function selectSection(section: SectionId) {
    setActiveSection(section);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('section', section);
      window.history.replaceState({}, '', url);
    }
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
    { id: 'location', label: 'สถานที่', hint: 'ที่อยู่ พิกัดแผนที่' },
    { id: 'hours', label: 'เวลาเปิด-ปิด', hint: 'เวลาทำการ หยุดพักร้าน' },
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
              onClick={() => selectSection(section.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
                activeSection === section.id
                  ? 'border-primary bg-primary text-white'
                  : 'border-border/40 bg-card-bg text-secondary hover:border-primary/40'
              }`}
            >
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
                  activeSection === section.id ? 'bg-white/18 text-white' : 'bg-primary/10 text-primary'
                }`}
              >
                <SectionIcon id={section.id} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black leading-5">{section.label}</span>
                <span className={`mt-1 block text-xs font-bold leading-4 ${activeSection === section.id ? 'text-white/80' : 'text-text-tertiary'}`}>
                  {section.hint}
                </span>
              </span>
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
            <h2 className="text-xl font-black text-secondary">สถานที่และพิกัดแผนที่</h2>
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
            </div>
          </section>
        )}

        {activeSection === 'hours' && (
          <section className="rounded-3xl border border-border/40 bg-card-bg p-5 shadow-sm">
            <h2 className="text-xl font-black text-secondary">เวลาเปิด-ปิดและการพักร้าน</h2>
            <p className="mt-1 text-sm font-bold text-text-tertiary">
              แยกเวลาทำการปกติออกจากโหมดหยุดพักร้าน เพื่อให้ลูกค้าเข้าใจสถานะร้านได้ชัดเจน
            </p>
            <div className="mt-5 grid gap-4">
              <OpeningHoursEditor days={operatingDays} onChange={setOperatingSchedule} />
              <SpecialHoursEditor
                items={specialHours}
                form={specialHourForm}
                loading={specialHoursLoading}
                error={specialHoursError}
                onFormChange={setSpecialHourForm}
                onSave={saveSpecialHour}
                onDelete={deleteSpecialHour}
                onImportThaiHolidays={importThaiPublicHolidays}
              />
              <label className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-border/40 bg-bg px-4">
                <input type="checkbox" checked={formData.isOpen} onChange={(e) => setField('isOpen', e.target.checked)} />
                <span className="text-sm font-black text-secondary">เปิดรับลูกค้าอยู่</span>
              </label>
              <section className={`rounded-3xl border p-4 ${formData.vacationMode ? 'border-warning/30 bg-warning-bg/25' : 'border-border/40 bg-bg'}`}>
                <label className="flex min-h-[44px] items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.vacationMode}
                    onChange={(e) => setField('vacationMode', e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-black text-secondary">โหมดหยุดพักร้าน</span>
                    <span className="mt-1 block text-xs font-bold leading-5 text-text-tertiary">
                      ใช้เมื่อร้านหยุดรับลูกค้าชั่วคราว เช่น พักร้อน ปรับปรุงร้าน หรือหยุดยาว ลูกค้าจะเห็นประกาศบนหน้าร้านและ Explore
                    </span>
                  </span>
                </label>
                {formData.vacationMode && (
                  <div className="mt-4 grid gap-4">
                    <label>
                      <span className="text-sm font-black text-secondary">ข้อความแจ้งลูกค้า</span>
                      <textarea
                        value={formData.vacationMessage}
                        onChange={(e) => setField('vacationMessage', e.target.value)}
                        rows={3}
                        maxLength={160}
                        className="mt-2 w-full rounded-2xl border border-border/40 bg-bg p-4 text-sm font-bold outline-none focus:border-primary"
                        placeholder="ร้านหยุดพักชั่วคราว และจะกลับมาเปิดรับลูกค้าเร็ว ๆ นี้"
                      />
                      <span className="mt-1 block text-right text-[11px] font-bold text-text-tertiary">
                        {formData.vacationMessage.length}/160
                      </span>
                    </label>
                    <label>
                      <span className="text-sm font-black text-secondary">กลับมาเปิดประมาณวันที่</span>
                      <input
                        type="date"
                        value={formData.vacationUntil}
                        onChange={(e) => setField('vacationUntil', e.target.value)}
                        className="mt-2 h-12 w-full rounded-2xl border border-border/40 bg-bg px-4 text-sm font-bold outline-none focus:border-primary"
                      />
                    </label>
                  </div>
                )}
              </section>
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

function OpeningHoursEditor({
  days,
  onChange,
}: {
  days: OperatingDay[];
  onChange: (days: OperatingDay[]) => void;
}) {
  function updateDay(key: DayKey, patch: Partial<OperatingDay>) {
    onChange(days.map((day) => (day.key === key ? { ...day, ...patch } : day)));
  }

  function applyPreset(preset: 'everyday' | 'weekday' | 'weekend' | 'closed') {
    onChange(days.map((day) => {
      const isWeekend = day.key === 'sat' || day.key === 'sun';
      if (preset === 'everyday') return { ...day, isOpen: true, openTime: '09:00', closeTime: '18:00' };
      if (preset === 'weekday') return { ...day, isOpen: !isWeekend, openTime: '09:00', closeTime: '18:00' };
      if (preset === 'weekend') return { ...day, isOpen: isWeekend, openTime: '10:00', closeTime: '20:00' };
      return { ...day, isOpen: false };
    }));
  }

  function copyFirstOpenDayToAll() {
    const source = days.find((day) => day.isOpen);
    if (!source) return;
    onChange(days.map((day) => ({ ...day, isOpen: true, openTime: source.openTime, closeTime: source.closeTime })));
  }

  return (
    <section className="rounded-3xl border border-border/40 bg-bg p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-black text-secondary">เวลาทำการปกติ</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-text-tertiary">
            เลือกวันเปิดร้านและเวลา ไม่ต้องพิมพ์รูปแบบเอง ระบบจะจัดข้อความให้หน้า Explore และหน้าร้านอัตโนมัติ
          </p>
        </div>
        <button
          type="button"
          onClick={copyFirstOpenDayToAll}
          className="min-h-[40px] rounded-2xl border border-border/50 bg-card-bg px-4 text-xs font-black text-secondary transition hover:border-primary/40 hover:text-primary"
        >
          ใช้เวลาเดียวทุกวัน
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          ['weekday', 'จ.-ศ. 09:00-18:00'],
          ['everyday', 'เปิดทุกวัน'],
          ['weekend', 'เฉพาะเสาร์-อาทิตย์'],
          ['closed', 'ปิดทั้งหมด'],
        ].map(([preset, label]) => (
          <button
            key={preset}
            type="button"
            onClick={() => applyPreset(preset as 'everyday' | 'weekday' | 'weekend' | 'closed')}
            className="min-h-[38px] rounded-full border border-border/50 bg-card-bg px-4 text-xs font-black text-text-secondary transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-2">
        {days.map((day) => (
          <div
            key={day.key}
            className={`grid gap-3 rounded-2xl border p-3 transition sm:grid-cols-[128px_1fr] sm:items-center ${
              day.isOpen ? 'border-primary/20 bg-card-bg' : 'border-border/40 bg-bg-secondary/50'
            }`}
          >
            <label className="flex min-h-[44px] items-center gap-3">
              <input
                type="checkbox"
                checked={day.isOpen}
                onChange={(event) => updateDay(day.key, { isOpen: event.target.checked })}
              />
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-xs font-black text-primary">
                {day.shortLabel}
              </span>
              <span className="text-sm font-black text-secondary">{day.label}</span>
            </label>

            {day.isOpen ? (
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <input
                  type="time"
                  value={day.openTime}
                  onChange={(event) => updateDay(day.key, { openTime: event.target.value })}
                  className="h-11 min-w-0 rounded-2xl border border-border/40 bg-bg px-3 text-sm font-black text-secondary outline-none focus:border-primary"
                  aria-label={`${day.label} เวลาเปิด`}
                />
                <span className="text-xs font-black text-text-tertiary">ถึง</span>
                <input
                  type="time"
                  value={day.closeTime}
                  onChange={(event) => updateDay(day.key, { closeTime: event.target.value })}
                  className="h-11 min-w-0 rounded-2xl border border-border/40 bg-bg px-3 text-sm font-black text-secondary outline-none focus:border-primary"
                  aria-label={`${day.label} เวลาปิด`}
                />
              </div>
            ) : (
              <div className="flex min-h-[44px] items-center rounded-2xl bg-bg px-4 text-sm font-black text-text-tertiary">
                ปิดร้านวันนี้
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function SpecialHoursEditor({
  items,
  form,
  loading,
  error,
  onFormChange,
  onSave,
  onDelete,
  onImportThaiHolidays,
}: {
  items: SpecialHour[];
  form: SpecialHourFormState;
  loading: boolean;
  error: string;
  onFormChange: (form: SpecialHourFormState) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onImportThaiHolidays: () => void;
}) {
  const sortedItems = [...items].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section className="rounded-3xl border border-border/40 bg-bg p-4">
      <div>
        <h3 className="text-sm font-black text-secondary">วันหยุดและเวลาพิเศษ</h3>
        <p className="mt-1 text-xs font-bold leading-5 text-text-tertiary">
          ใช้สำหรับวันหยุดนักขัตฤกษ์ อีเวนต์ ปิดปรับปรุง หรือวันที่เปิดไม่ตรงกับเวลาปกติ ระบบจะใช้ค่านี้ก่อนตารางรายสัปดาห์
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-secondary">ชุดวันหยุดนักขัตฤกษ์ไทย</p>
            <p className="mt-1 text-xs font-bold text-text-tertiary">
              เพิ่มวันหยุดไทยปี 2026 เป็นวันปิดร้านแบบอัตโนมัติ แล้วค่อยแก้บางวันได้ภายหลัง
            </p>
          </div>
          <button
            type="button"
            onClick={onImportThaiHolidays}
            className="min-h-[44px] shrink-0 rounded-2xl bg-primary px-4 text-sm font-black text-white shadow-lg shadow-primary/20"
          >
            นำเข้าวันหยุดไทย 2026
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-border/40 bg-card-bg p-3 lg:grid-cols-[150px_1fr]">
        <label>
          <span className="text-xs font-black text-text-tertiary">วันที่</span>
          <input
            type="date"
            value={form.date}
            onChange={(event) => onFormChange({ ...form, date: event.target.value })}
            className="mt-1 h-11 w-full rounded-2xl border border-border/40 bg-bg px-3 text-sm font-black text-secondary outline-none focus:border-primary"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
          <label className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-border/40 bg-bg px-4">
            <input
              type="checkbox"
              checked={form.isClosed}
              onChange={(event) => onFormChange({ ...form, isClosed: event.target.checked })}
            />
            <span className="text-sm font-black text-secondary">ปิดทั้งวัน</span>
          </label>

          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <label>
              <span className="text-xs font-black text-text-tertiary">เปิด</span>
              <input
                type="time"
                value={form.openTime}
                disabled={form.isClosed}
                onChange={(event) => onFormChange({ ...form, openTime: event.target.value })}
                className="mt-1 h-11 w-full rounded-2xl border border-border/40 bg-bg px-3 text-sm font-black text-secondary outline-none focus:border-primary disabled:opacity-40"
              />
            </label>
            <span className="pb-3 text-xs font-black text-text-tertiary">ถึง</span>
            <label>
              <span className="text-xs font-black text-text-tertiary">ปิด</span>
              <input
                type="time"
                value={form.closeTime}
                disabled={form.isClosed}
                onChange={(event) => onFormChange({ ...form, closeTime: event.target.value })}
                className="mt-1 h-11 w-full rounded-2xl border border-border/40 bg-bg px-3 text-sm font-black text-secondary outline-none focus:border-primary disabled:opacity-40"
              />
            </label>
          </div>
        </div>

        <label className="lg:col-span-2">
          <span className="text-xs font-black text-text-tertiary">หมายเหตุที่ลูกค้าเห็น</span>
          <input
            value={form.note}
            onChange={(event) => onFormChange({ ...form, note: event.target.value })}
            className="mt-1 h-11 w-full rounded-2xl border border-border/40 bg-bg px-3 text-sm font-bold text-secondary outline-none focus:border-primary"
            placeholder="เช่น วันหยุดปีใหม่, ปิดปรับปรุงร้าน, เปิดเฉพาะรับกลับบ้าน"
          />
        </label>

        <div className="flex flex-wrap gap-2 lg:col-span-2">
          <button
            type="button"
            onClick={onSave}
            className="min-h-[44px] rounded-2xl bg-primary px-5 text-sm font-black text-white shadow-lg shadow-primary/20"
          >
            {form.id ? 'บันทึกวันพิเศษ' : 'เพิ่มวันพิเศษ'}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() => onFormChange(defaultSpecialHourForm)}
              className="min-h-[44px] rounded-2xl border border-border/50 px-5 text-sm font-black text-secondary"
            >
              ยกเลิกแก้ไข
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-3 rounded-2xl bg-danger-bg/20 p-3 text-xs font-black text-danger">{error}</p>}

      <div className="mt-4 grid gap-2">
        {loading ? (
          <div className="rounded-2xl border border-border/40 bg-card-bg p-4 text-sm font-black text-text-tertiary">กำลังโหลดวันพิเศษ...</div>
        ) : sortedItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/50 bg-card-bg p-4 text-sm font-bold text-text-tertiary">
            ยังไม่มีวันพิเศษ ร้านจะใช้เวลาประจำสัปดาห์ทั้งหมด
          </div>
        ) : (
          sortedItems.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-card-bg p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-secondary">
                  {new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(new Date(`${item.date}T00:00:00`))}
                </p>
                <p className="mt-1 text-xs font-bold text-text-tertiary">
                  {item.isClosed ? 'ปิดทั้งวัน' : `เปิดพิเศษ ${item.openTime}-${item.closeTime}`}
                  {item.note ? ` · ${item.note}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onFormChange({
                    id: item.id,
                    date: item.date,
                    isClosed: Boolean(item.isClosed),
                    openTime: item.openTime || '09:00',
                    closeTime: item.closeTime || '18:00',
                    note: item.note || '',
                  })}
                  className="min-h-[40px] rounded-xl border border-border/50 px-4 text-xs font-black text-secondary"
                >
                  แก้ไข
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="min-h-[40px] rounded-xl border border-danger/20 bg-danger-bg/10 px-4 text-xs font-black text-danger"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
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
