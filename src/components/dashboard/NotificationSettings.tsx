import { useEffect, useState } from 'react';

type Preferences = {
  inAppEnabled: boolean;
  dealUpdates: boolean;
  milestones: boolean;
  reports: boolean;
  systemUpdates: boolean;
};

const initialPreferences: Preferences = {
  inAppEnabled: true,
  dealUpdates: true,
  milestones: true,
  reports: true,
  systemUpdates: true,
};

const options: Array<{ key: keyof Omit<Preferences, 'inAppEnabled'>; title: string; description: string }> = [
  { key: 'dealUpdates', title: 'สถานะดีล', description: 'ดีลใกล้หมดอายุหรือหมดอายุแล้ว' },
  { key: 'milestones', title: 'สถิติและความสำเร็จ', description: 'ยอดเข้าชมและ milestone ของหน้าร้าน' },
  { key: 'reports', title: 'รายงานและการตรวจสอบ', description: 'รายงานจากลูกค้าและผลการตรวจของทีม' },
  { key: 'systemUpdates', title: 'คำแนะนำจากระบบ', description: 'ความพร้อมของร้านและการอัปเดตสำคัญ' },
];

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<Preferences>(initialPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/notification-preferences');
        const payload = await response.json();
        if (payload.success) setPreferences(payload.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const response = await fetch('/api/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
      const payload = await response.json();
      if (payload.success) {
        setPreferences(payload.data);
        setSaved(true);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="rounded-2xl border border-border/40 bg-card-bg p-8 text-sm font-semibold text-text-tertiary">กำลังโหลดการตั้งค่า...</div>;

  return <section className="max-w-3xl rounded-2xl border border-border/40 bg-card-bg p-5 shadow-sm sm:p-7">
    <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Preferences</p>
    <h1 className="mt-1 text-2xl font-black text-secondary">ตั้งค่าการแจ้งเตือน</h1>
    <p className="mt-2 text-sm leading-relaxed text-text-secondary">เลือกเฉพาะเรื่องที่อยากติดตาม การปิดหมวดหนึ่งจะไม่ลบข้อมูลหรือประวัติแจ้งเตือนเดิม</p>

    <label className="mt-7 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/40 bg-bg-secondary/45 p-4">
      <span><span className="block text-sm font-black text-secondary">แจ้งเตือนภายในแอป</span><span className="mt-1 block text-xs text-text-tertiary">ปิดเพื่อพักการแจ้งเตือนทั้งหมดชั่วคราว</span></span>
      <input className="h-5 w-5 accent-primary" type="checkbox" checked={preferences.inAppEnabled} onChange={(event) => setPreferences((current) => ({ ...current, inAppEnabled: event.target.checked }))} />
    </label>

    <div className={`mt-3 divide-y divide-border/35 rounded-xl border border-border/40 ${preferences.inAppEnabled ? '' : 'opacity-50'}`}>
      {options.map((option) => <label key={option.key} className="flex cursor-pointer items-center justify-between gap-4 p-4">
        <span><span className="block text-sm font-black text-secondary">{option.title}</span><span className="mt-1 block text-xs text-text-tertiary">{option.description}</span></span>
        <input className="h-5 w-5 accent-primary" type="checkbox" disabled={!preferences.inAppEnabled} checked={preferences[option.key]} onChange={(event) => setPreferences((current) => ({ ...current, [option.key]: event.target.checked }))} />
      </label>)}
    </div>

    <div className="mt-6 flex items-center justify-end gap-3">
      {saved && <span className="text-sm font-bold text-success">บันทึกแล้ว</span>}
      <button className="min-h-11 rounded-xl bg-primary px-5 text-sm font-black text-white shadow-sm transition-opacity disabled:opacity-60" disabled={saving} onClick={() => void save()}>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</button>
    </div>
  </section>;
}
