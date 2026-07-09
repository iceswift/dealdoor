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

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="min-w-0">
        <ShopForm
          shop={shop}
          onSuccess={() => { window.location.href = '/dashboard'; }}
          onChange={(data) => setPreviewData(data)}
        />
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-6 rounded-3xl border border-border/40 bg-card-bg p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-wider text-primary">Live Preview</p>
            <h2 className="text-lg font-black text-secondary">ตัวอย่างหน้าร้าน</h2>
          </div>
          <LivePreview data={previewData} />
        </div>
      </aside>

      <button
        type="button"
        onClick={() => setShowPreview(true)}
        className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-primary/30 xl:hidden"
        aria-label="ดูตัวอย่างหน้าร้าน"
      >
        <span className="text-lg font-black">ดู</span>
      </button>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm xl:hidden" onClick={() => setShowPreview(false)}>
          <div className="relative w-full max-w-sm rounded-3xl bg-bg p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-bg-secondary text-text-secondary"
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
