// src/components/shared/InstallPrompt.tsx

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem('dealdoor_install_dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismiss = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) return; // Don't show for 7 days
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also show after a delay if not installed
    const timer = setTimeout(() => {
      if (!isInstalled && !localStorage.getItem('dealdoor_install_dismissed')) {
        setShowInstall(true);
      }
    }, 30000); // Show after 30 seconds

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback: show instructions
      alert('กรุณาเปิดเมนูเบราว์แล้วเลือก "เพิ่มไปยังหน้าจอหลัก"');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowInstall(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstall(false);
    localStorage.setItem('dealdoor_install_dismissed', new Date().toISOString());
  };

  if (!showInstall || isInstalled) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96">
      <div className="rounded-2xl border border-border bg-bg p-4 shadow-xl">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-light to-orange-100 p-2">
            <img src="/icons/DealDoor_icon.png" alt="DealDoor" className="h-full w-full object-contain" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-secondary">ติดตั้ง DealDoor</h3>
            <p className="mt-1 text-sm text-text-secondary">
              ติดตั้งเป็นแอปเพื่อเข้าถึงเร็วขึ้น ใช้งานแบบออฟไลน์ได้
            </p>
            
            {/* Benefits */}
            <ul className="mt-2 space-y-1">
              <li className="flex items-center gap-2 text-xs text-text-tertiary">
                <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                เข้าถึงเร็วจากหน้าจอหลัก
              </li>
              <li className="flex items-center gap-2 text-xs text-text-tertiary">
                <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                ใช้งานแบบออฟไลน์ได้
              </li>
              <li className="flex items-center gap-2 text-xs text-text-tertiary">
                <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                แจ้งเตือนดีลใหม่
              </li>
            </ul>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 rounded-full p-1 text-text-tertiary hover:bg-bg-secondary hover:text-text-secondary transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleInstall}
            className="btn btn-primary flex-1"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            ติดตั้ง
          </button>
          <button
            onClick={handleDismiss}
            className="btn btn-ghost"
          >
            ไว้ก่อน
          </button>
        </div>
      </div>
    </div>
  );
}
