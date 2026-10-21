import { useEffect, useState } from 'react';

const CONSENT_KEY = 'dealdoor_cookie_consent';

type ConsentPreferences = {
  necessary: true;
  analytics: boolean;
  version?: string;
  updatedAt?: string;
};

type ConsentResponse = {
  success: boolean;
  data?: { consent: ConsentPreferences | null };
};

function saveLocalConsent(consent: ConsentPreferences) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
}

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
  });

  useEffect(() => {
    let mounted = true;

    const loadConsent = async () => {
      try {
        const response = await fetch('/api/consent', { credentials: 'same-origin' });
        const payload = await response.json() as ConsentResponse;
        if (!mounted) return;

        if (payload.success && payload.data?.consent) {
          saveLocalConsent(payload.data.consent);
          setPreferences(payload.data.consent);
          setShow(false);
          return;
        }
      } catch {
        // Keep the banner visible. Consent must be stored by the server before it takes effect.
      }

      if (mounted) setShow(true);
    };

    const openSettings = () => {
      setError('');
      setShow(true);
      setShowDetails(true);
    };

    void loadConsent();
    window.addEventListener('dealdoor:open-cookie-settings', openSettings);
    return () => {
      mounted = false;
      window.removeEventListener('dealdoor:open-cookie-settings', openSettings);
    };
  }, []);

  const persistConsent = async (analytics: boolean) => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/consent', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analytics }),
      });
      const payload = await response.json() as ConsentResponse;
      if (!response.ok || !payload.success || !payload.data?.consent) {
        throw new Error('Unable to save consent');
      }

      saveLocalConsent(payload.data.consent);
      setPreferences(payload.data.consent);
      setShow(false);
      setShowDetails(false);
    } catch {
      setError('บันทึกการตั้งค่าคุกกี้ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <section
      className="fixed bottom-0 left-0 right-0 z-[1000] border-t border-border bg-bg shadow-2xl"
      aria-label="การตั้งค่าคุกกี้"
      role="dialog"
      aria-modal="false"
    >
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-8">
          <div className="max-w-2xl">
            <h2 className="text-base font-semibold text-secondary">การตั้งค่าคุกกี้</h2>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              เราใช้คุกกี้ที่จำเป็นต่อการทำงานของเว็บไซต์ และจะบันทึกสถิติการใช้งานเมื่อคุณอนุญาตเท่านั้น{' '}
              <a href="/cookies" className="font-medium text-primary hover:underline">อ่านนโยบายคุกกี้</a>
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-nowrap lg:justify-end">
            <button type="button" onClick={() => setShowDetails((value) => !value)} className="min-h-11 shrink-0 whitespace-nowrap rounded-lg border border-border px-4 text-sm font-medium text-text-secondary hover:bg-bg-secondary">
              ตั้งค่า
            </button>
            <button type="button" disabled={saving} onClick={() => void persistConsent(false)} className="min-h-11 shrink-0 whitespace-nowrap rounded-lg border border-border px-4 text-sm font-medium text-text-secondary hover:bg-bg-secondary disabled:cursor-wait disabled:opacity-60">
              ใช้เฉพาะที่จำเป็น
            </button>
            <button type="button" disabled={saving} onClick={() => void persistConsent(true)} className="min-h-11 shrink-0 whitespace-nowrap rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark disabled:cursor-wait disabled:opacity-60">
              ยอมรับทั้งหมด
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <label className="flex min-h-12 items-center justify-between gap-4 rounded-lg bg-bg-secondary px-4 py-3">
              <span>
                <span className="block text-sm font-semibold text-secondary">คุกกี้ที่จำเป็น</span>
                <span className="block text-xs text-text-tertiary">ใช้เพื่อความปลอดภัย การเข้าสู่ระบบ และการทำงานพื้นฐาน</span>
              </span>
              <input type="checkbox" checked disabled aria-label="คุกกี้ที่จำเป็น" className="h-4 w-4 rounded border-gray-300" />
            </label>
            <label className="flex min-h-12 items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
              <span>
                <span className="block text-sm font-semibold text-secondary">สถิติการใช้งาน</span>
                <span className="block text-xs text-text-tertiary">ช่วยวัดการเข้าชม ดีลที่สนใจ และปรับปรุงบริการ</span>
              </span>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(event) => setPreferences((current) => ({ ...current, analytics: event.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 accent-primary"
              />
            </label>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <button type="button" disabled={saving} onClick={() => void persistConsent(preferences.analytics)} className="min-h-11 w-full rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-wait disabled:opacity-60">
              บันทึกการตั้งค่า
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
