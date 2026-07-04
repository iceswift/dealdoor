// src/components/onboarding/ShareSuccess.tsx

import { useState, useEffect } from 'react';
import { getOnboardingState, clearOnboardingState } from '../../lib/onboarding';

export default function ShareSuccess() {
  const [shopSlug, setShopSlug] = useState('');
  const [shopName, setShopName] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createShop();
  }, []);

  const createShop = async () => {
    const state = getOnboardingState();

    try {
      // Create shop
      const shopRes = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.shop),
      });

      const shopData = await shopRes.json();

      if (!shopRes.ok) {
        throw new Error(shopData.error?.message || 'Failed to create shop');
      }

      const shop = shopData.data;
      setShopSlug(shop.slug);
      setShopName(shop.name);

      // Create deals
      for (const deal of state.deals) {
        await fetch('/api/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...deal,
            shopId: shop.id,
          }),
        });
      }

      // Clear onboarding state
      clearOnboardingState();
    } catch (err) {
      console.error('Failed to create shop:', err);
    } finally {
      setLoading(false);
    }
  };

  const url = `https://dealdoor.co/${shopSlug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${shopName} - DealDoor`,
          text: `ดูโปรโมชันล่าสุดจาก ${shopName}`,
          url: url,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-text-secondary">กำลังสร้างร้าน...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      {/* Success Icon */}
      <div>
        <span className="text-6xl">🎉</span>
        <h2 className="mt-4 text-2xl font-bold text-secondary">
          หน้าร้านของคุณพร้อมแล้ว!
        </h2>
        <p className="mt-2 text-text-secondary">
          แชร์ลิงก์นี้ให้ลูกค้าเพื่อดูโปรโมชัน
        </p>
      </div>

      {/* Preview Card */}
      <div className="mx-auto max-w-sm overflow-hidden rounded-xl border border-border bg-bg">
        <div className="bg-gradient-to-br from-primary-light to-primary-subtle p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white text-2xl font-bold text-primary shadow-sm">
            {shopName.charAt(0)}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-secondary">{shopName}</h3>
          <p className="text-sm text-text-secondary">ดูโปรโมชันล่าสุด</p>
        </div>
      </div>

      {/* Share Link */}
      <div className="mx-auto max-w-sm">
        <label className="block text-sm font-medium text-secondary">ลิงก์หน้าร้าน</label>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="text"
            value={url}
            readOnly
            className="flex-1 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm"
          />
          <button
            onClick={handleCopy}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            {copied ? '✓ คัดลอกแล้ว' : 'คัดลอก'}
          </button>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="mx-auto flex max-w-sm gap-3">
        <a
          href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-lg bg-green-500 py-3 text-center text-sm font-medium text-white hover:bg-green-600"
        >
          💬 LINE
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-lg bg-blue-600 py-3 text-center text-sm font-medium text-white hover:bg-blue-700"
        >
          📘 Facebook
        </a>
        <button
          onClick={handleShare}
          className="flex-1 rounded-lg border border-border py-3 text-sm font-medium text-text-secondary hover:bg-bg-secondary"
        >
          📤 แชร์
        </button>
      </div>

      {/* Next Steps */}
      <div className="mx-auto max-w-sm rounded-lg bg-bg-secondary p-4 text-left">
        <h4 className="text-sm font-medium text-secondary">สิ่งที่ทำได้ต่อ:</h4>
        <ul className="mt-2 space-y-1 text-sm text-text-secondary">
          <li>• เพิ่มโปรโมชัน更多</li>
          <li>• อัปโหลดรูปปกและโลโก้</li>
          <li>• เพิ่มเมนู/สินค้า</li>
          <li>• แชร์ลิงก์ให้ลูกค้า</li>
        </ul>
      </div>

      {/* Dashboard Button */}
      <a
        href="/dashboard"
        className="inline-block rounded-lg bg-primary px-8 py-3 text-sm font-medium text-white hover:bg-primary-dark"
      >
        ดูแดชบอร์ด →
      </a>
    </div>
  );
}
