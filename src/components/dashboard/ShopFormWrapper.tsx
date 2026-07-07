// src/components/dashboard/ShopFormWrapper.tsx

import { useState } from 'react';
import ShopForm from './ShopForm.tsx';
import LivePreview from './LivePreview.tsx';
import type { Shop } from '../../../db/schema';

interface ShopFormWrapperProps {
  shop: Shop | null;
  merchantId?: string;
}

export default function ShopFormWrapper({ shop, merchantId }: ShopFormWrapperProps) {
  const [formData, setFormData] = useState<any>({
    name: '',
    category: 'cafe',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    openingHours: '',
    isOpen: true,
    phone: '',
    lineId: '',
    facebookUrl: '',
    instagramUrl: '',
    tiktokUrl: '',
    websiteUrl: '',
    acceptsPromptPay: false,
    acceptsCash: true,
    acceptsCreditCard: false,
    acceptsTrueMoney: false,
    acceptsRabbitLinePay: false,
    paymentNotes: '',
    wheelchairAccessible: false,
    strollerAccessible: false,
    seniorFriendlyRestroom: false,
    elevatorAvailable: false,
    brailleMenu: false,
    accessibilityNotes: '',
    freeParking: false,
    paidParking: false,
    motorcycleParking: false,
    evCharging: false,
    nearbyBts: '',
    nearbyMrt: '',
    parkingNotes: '',
    petFriendly: false,
    petMenu: false,
    petWaterBowl: false,
    petNotes: '',
    kidsMenu: false,
    highChairs: false,
    playArea: false,
    babyChanging: false,
    familyNotes: '',
    coverImage: '',
    logoImage: '',
  });

  const [showMobilePreview, setShowMobilePreview] = useState(false);

  return (
    <div className="relative grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="rounded-3xl border border-border/30 bg-card-bg/60 backdrop-blur-md p-5 shadow-md lg:col-span-7">
        <ShopForm
          shop={shop}
          merchantId={merchantId}
          onSuccess={() => window.location.reload()}
          onChange={(data) => setFormData(data)}
        />
      </div>

      <aside className="sticky top-28 hidden rounded-3xl border border-border/20 bg-bg-secondary/30 p-5 text-center shadow-sm lg:col-span-5 lg:block">
        <h3 className="mb-4 text-[10px] font-black uppercase tracking-wider text-text-tertiary">
          ตัวอย่างขณะแก้ไข (Live Preview)
        </h3>
        <LivePreview data={formData} />
      </aside>

      <div className="fixed bottom-24 right-4 z-40 lg:hidden">
        <button
          type="button"
          onClick={() => setShowMobilePreview(true)}
          className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-none bg-primary p-0 text-white shadow-xl shadow-primary/30 transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label="ดูตัวอย่างหน้าร้าน"
          title="ดูตัวอย่างหน้าร้าน"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 2h10a3 3 0 013 3v14a3 3 0 01-3 3H7a3 3 0 01-3-3V5a3 3 0 013-3z" stroke="white" />
            <path d="M11 5h2" stroke="white" />
            <circle cx="12" cy="18" r="0.75" fill="white" stroke="white" strokeWidth="1" />
          </svg>
        </button>
      </div>

      {showMobilePreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm lg:hidden"
          onClick={() => setShowMobilePreview(false)}
        >
          <div
            className="relative w-full max-w-[310px] rounded-3xl border border-border/40 bg-bg p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowMobilePreview(false)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-bg-secondary text-text-tertiary transition-all hover:bg-bg-tertiary"
              aria-label="ปิดพรีวิว"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="mb-5 text-center text-xs font-bold uppercase tracking-wider text-secondary">
              ตัวอย่างหน้าร้านบนมือถือ
            </h3>

            <LivePreview data={formData} />
          </div>
        </div>
      )}
    </div>
  );
}
