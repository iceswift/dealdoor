import { useEffect, useState } from 'react';
import DealForm from './DealForm.tsx';
import type { Deal } from '../../../db/schema';

export default function DealFormEditWrapper({ shopId }: { shopId: string }) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const dealData = sessionStorage.getItem('editDeal');
      if (dealData) {
        setDeal(JSON.parse(dealData));
      } else {
        setError(true);
      }
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <p className="text-text-secondary text-sm">กำลังโหลดข้อมูลคูปอง...</p>;
  }

  if (error || !deal) {
    return (
      <div class="text-center py-8 max-w-sm mx-auto">
        <div class="h-12 w-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-4">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p class="text-secondary font-bold text-sm">ไม่พบข้อมูลโปรโมชันดีลที่ต้องการแก้ไข</p>
        <button
          onClick={() => window.location.href = '/dashboard/deals'}
          className="btn btn-secondary mt-5 py-2 px-4 rounded-xl text-xs font-bold"
        >
          กลับไปหน้าจัดการดีล
        </button>
      </div>
    );
  }

  return (
    <DealForm
      shopId={shopId}
      deal={deal}
      onSuccess={() => {
        sessionStorage.removeItem('editDeal');
        window.location.href = '/dashboard/deals';
      }}
      onCancel={() => {
        sessionStorage.removeItem('editDeal');
        window.location.href = '/dashboard/deals';
      }}
    />
  );
}
