// src/components/shared/CookieBanner.tsx

import { useState, useEffect } from 'react';

const CONSENT_KEY = 'dealdoor_cookie_consent';

interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
}

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY);
    if (!saved) {
      setShow(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const consent = { necessary: true, analytics: true };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setShow(false);
    enableAnalytics();
  };

  const handleRejectOptional = () => {
    const consent = { necessary: true, analytics: false };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setShow(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(preferences));
    setShow(false);
    if (preferences.analytics) {
      enableAnalytics();
    }
  };

  const enableAnalytics = () => {
    // Enable Plausible or other analytics
    console.log('Analytics enabled');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg shadow-lg">
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-secondary">🍪 เราใช้คุกกี้</h3>
            <p className="mt-1 text-xs text-text-secondary">
              เราใช้คุกกี้เพื่อปรับปรุงประสบการณ์ของคุณ ดูรายละเอียดใน{' '}
              <a href="/cookies" className="text-primary hover:underline">นโยบายคุกกี้</a>
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="rounded-lg border border-border px-3 py-2 text-xs text-text-secondary hover:bg-bg-secondary"
            >
              ตั้งค่า
            </button>
            <button
              onClick={handleRejectOptional}
              className="rounded-lg border border-border px-3 py-2 text-xs text-text-secondary hover:bg-bg-secondary"
            >
              ปฏิเสธ
            </button>
            <button
              onClick={handleAcceptAll}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-dark"
            >
              ยอมรับทั้งหมด
            </button>
          </div>
        </div>

        {/* Details */}
        {showDetails && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary">คุกกี้ที่จำเป็น</p>
                <p className="text-xs text-text-tertiary">จำเป็นสำหรับการทำงาน</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.necessary}
                disabled
                className="h-4 w-4 rounded border-gray-300"
              />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary">คุกกี้วิเคราะห์</p>
                <p className="text-xs text-text-tertiary">ช่วยปรับปรุงบริการ</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
            </label>
            <button
              onClick={handleSavePreferences}
              className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              บันทึกการตั้งค่า
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
