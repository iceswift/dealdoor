// src/components/dashboard/ShopFormWrapper.tsx

import { useState } from 'react';
import type { Shop } from '../../lib/db-schema';
import ShopForm from './ShopForm';
import LivePreview from './LivePreview';

interface ShopFormWrapperProps {
  shop: Shop | null;
}

export default function ShopFormWrapper({ shop }: ShopFormWrapperProps) {
  const [previewData, setPreviewData] = useState<any>(shop || {});
  const [showPreview, setShowPreview] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="relative">
      <div className={`grid gap-6 transition-all duration-300 ${isCollapsed ? 'xl:grid-cols-1' : 'xl:grid-cols-[1fr_360px]'}`}>
        <div className="min-w-0">
          <ShopForm
            shop={shop}
            onSuccess={(updatedShop) => {
              setPreviewData(updatedShop);
              if (!shop) window.location.href = '/dashboard';
            }}
            onChange={(data) => setPreviewData(data)}
            isCollapsed={isCollapsed}
          />
        </div>

        {!isCollapsed && (
          <aside className="hidden xl:block">
            <div className="sticky top-6 rounded-3xl border border-border/40 bg-card-bg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-primary">Live Preview</p>
                  <h2 className="text-lg font-black text-secondary">ตัวอย่างหน้าร้าน</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCollapsed(true)}
                  className="flex h-8 items-center gap-1.5 rounded-xl border border-border/50 bg-bg px-2.5 text-xs font-black text-text-secondary transition hover:border-primary/40 hover:text-primary cursor-pointer"
                  title="ซ่อนตัวอย่างหน้าร้าน"
                >
                  <span>ซ่อน</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <LivePreview data={previewData} />
            </div>
          </aside>
        )}
      </div>

      {isCollapsed && (
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="fixed top-1/2 right-0 z-40 hidden xl:flex h-16 w-20 -translate-y-1/2 items-center justify-start pl-4.5 rounded-l-3xl border border-r-0 border-primary bg-primary text-white shadow-xl shadow-primary/30 transition-all hover:w-22 hover:bg-primary/90 cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <svg className="h-4.5 w-4.5 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.0}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            <svg className="h-8 w-8 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.0}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        </button>
      )}

      <button
        type="button"
        onClick={() => setShowPreview(true)}
        className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-primary/30 xl:hidden cursor-pointer"
        aria-label="ดูตัวอย่างหน้าร้าน"
      >
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </button>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm xl:hidden" onClick={() => setShowPreview(false)}>
          <div className="relative w-full max-w-sm rounded-3xl bg-bg p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-bg-secondary text-text-secondary cursor-pointer"
              aria-label="ปิดตัวอย่าง"
            >
              x
            </button>
            <LivePreview data={previewData} />
          </div>
        </div>
      )}
    </div>
  );
}
