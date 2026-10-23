// src/components/dashboard/MenuFormEditWrapper.tsx

import { useEffect, useState } from 'react';
import type { MenuItem } from '../../lib/db-schema';
import MenuForm from './MenuForm';

export default function MenuFormEditWrapper({ uploadsDisabled }: { uploadsDisabled?: boolean }) {
  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadItem() {
      const id = new URLSearchParams(window.location.search).get('id');
      if (!id) {
        setError('ไม่พบรหัสเมนูที่ต้องการแก้ไข');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/menu-items/${encodeURIComponent(id)}`, { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error?.message || 'โหลดข้อมูลเมนูไม่สำเร็จ');
        }
        setItem(payload.data);
      } catch (err: any) {
        setError(err.message || 'โหลดข้อมูลเมนูไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    }

    loadItem();
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-border/40 bg-card-bg p-8 text-center max-w-2xl mx-auto">
        <p className="text-sm font-black text-secondary">กำลังโหลดข้อมูลเมนู...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="rounded-3xl border border-danger/20 bg-danger-bg/15 p-8 text-center max-w-2xl mx-auto">
        <p className="text-sm font-black text-danger">{error || 'ไม่พบเมนู'}</p>
        <a href="/dashboard/menu" className="mt-4 inline-flex min-h-[44px] items-center rounded-2xl bg-primary px-5 text-sm font-black text-white cursor-pointer">
          กลับไปหน้าจัดการเมนู
        </a>
      </div>
    );
  }

  return (
    <MenuForm
      uploadsDisabled={uploadsDisabled}
      item={item}
      onSuccess={() => { window.location.href = '/dashboard/menu'; }}
      onCancel={() => { window.location.href = '/dashboard/menu'; }}
    />
  );
}
