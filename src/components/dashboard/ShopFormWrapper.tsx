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
    phone: '',
    lineId: '',
    facebookUrl: '',
    instagramUrl: '',
    websiteUrl: '',
    coverImage: '',
    logoImage: '',
  });

  const [showMobilePreview, setShowMobilePreview] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
      
      {/* Left Column: Tabbed Form */}
      <div className="lg:col-span-7 rounded-3xl border border-border/40 bg-card-bg/60 backdrop-blur-sm p-6 shadow-md">
        <div className="mb-4">
          <h2 className="text-base font-bold text-secondary flex items-center gap-2">
            <span>{shop ? 'แก้ไขรายละเอียดร้านค้า' : 'สร้างร้านค้าใหม่'}</span>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            {shop ? 'อัปเดตข้อมูลพิกัด แผนที่ และภาพแบรนดิ้งในแท็บแยกส่วน' : 'กรอกรายละเอียดเพื่อเผยแพร่หน้าร้านอย่างรวดเร็ว'}
          </p>
        </div>
        
        <div className="border-t border-border/20 pt-4">
          <ShopForm
            shop={shop}
            merchantId={merchantId}
            onSuccess={() => window.location.reload()}
            onChange={(data) => setFormData(data)}
          />
        </div>
      </div>

      {/* Right Column: Live Mockup Viewport (Desktop) */}
      <div className="hidden lg:block lg:col-span-5 sticky top-28 bg-card-bg/30 border border-border/30 rounded-3xl p-6 shadow-sm text-center">
        <h3 className="text-xs font-bold text-text-secondary mb-4 uppercase tracking-wider">
          ตัวอย่างขณะแก้ไข (Live Preview)
        </h3>
        <LivePreview data={formData} />
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      <div className="lg:hidden fixed bottom-24 right-4 z-40">
        <button
          onClick={() => setShowMobilePreview(true)}
          className="h-12 w-12 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/30 border-none hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer p-0 text-white"
          aria-label="ดูตัวอย่างหน้าร้าน"
          title="ดูตัวอย่างหน้าร้าน"
        >
          {/* Mobile phone regular SVG icon with explicit white stroke */}
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {/* Phone outline */}
            <path d="M7 2h10a3 3 0 013 3v14a3 3 0 01-3 3H7a3 3 0 01-3-3V5a3 3 0 013-3z" stroke="white" />
            {/* Speaker line at top */}
            <path d="M11 5h2" stroke="white" />
            {/* Home button indicator at bottom */}
            <circle cx="12" cy="18" r="0.75" fill="white" stroke="white" strokeWidth="1" />
          </svg>
        </button>
      </div>

      {/* Mobile Preview Modal Backdrop */}
      {showMobilePreview && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowMobilePreview(false)}
        >
          <div 
            className="relative bg-bg rounded-3xl p-6 max-w-[310px] w-full border border-border/40 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close trigger */}
            <button
              onClick={() => setShowMobilePreview(false)}
              className="absolute top-4 right-4 h-10 w-10 rounded-xl bg-bg-secondary text-text-tertiary flex items-center justify-center hover:bg-bg-tertiary transition-all"
              aria-label="ปิดพรีวิว"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xs font-bold text-center text-secondary uppercase tracking-wider mb-5">
              ตัวอย่างหน้าร้านบนมือถือ
            </h3>
            
            <LivePreview data={formData} />
          </div>
        </div>
      )}

    </div>
  );
}
