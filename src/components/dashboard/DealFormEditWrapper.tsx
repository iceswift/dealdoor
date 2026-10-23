// src/components/dashboard/DealFormEditWrapper.tsx

import { useEffect, useState } from 'react';
import type { Deal } from '../../lib/db-schema';
import DealForm from './DealForm';

interface DealFormEditWrapperProps {
  uploadsDisabled?: boolean;
  shopName?: string;
  shopLogoUrl?: string | null;
  shopAddress?: string | null;
}

export default function DealFormEditWrapper({ shopName, shopLogoUrl, shopAddress, uploadsDisabled }: DealFormEditWrapperProps) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDeal() {
      const id = new URLSearchParams(window.location.search).get('id');
      if (!id) {
        setError('ไม่พบรหัสดีลที่ต้องการแก้ไข');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/deals/${encodeURIComponent(id)}`, { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error?.message || 'โหลดข้อมูลดีลไม่สำเร็จ');
        }
        setDeal(payload.data);
      } catch (err: any) {
        setError(err.message || 'โหลดข้อมูลดีลไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    }

    loadDeal();
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-border/40 bg-card-bg p-8 text-center">
        <p className="text-sm font-black text-secondary">กำลังโหลดข้อมูลดีล...</p>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="rounded-3xl border border-danger/20 bg-danger-bg/15 p-8 text-center">
        <p className="text-sm font-black text-danger">{error || 'ไม่พบดีล'}</p>
        <a href="/dashboard/deals" className="mt-4 inline-flex min-h-[44px] items-center rounded-2xl bg-primary px-5 text-sm font-black text-white">
          กลับไปหน้าดีล
        </a>
      </div>
    );
  }

  return (
    <DealForm
      uploadsDisabled={uploadsDisabled}
      deal={deal}
      shopName={shopName}
      shopLogoUrl={shopLogoUrl}
      shopAddress={shopAddress}
      onSuccess={() => { window.location.href = '/dashboard/deals'; }}
      onCancel={() => { window.location.href = '/dashboard/deals'; }}
    />
  );
}
