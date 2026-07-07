import { useEffect, useState } from 'react';
import DealForm from './DealForm.tsx';
import type { Deal } from '../../../db/schema';

export default function DealFormEditWrapper({ shopId }: { shopId: string }) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadDeal = async () => {
      setLoading(true);
      setError(null);

      try {
        const dealId = new URLSearchParams(window.location.search).get('id');
        const cachedDeal = sessionStorage.getItem('editDeal');

        if (cachedDeal) {
          const parsedDeal = JSON.parse(cachedDeal) as Deal;
          if (!dealId || parsedDeal.id === dealId) {
            if (!cancelled) {
              setDeal(parsedDeal);
            }
            return;
          }
        }

        if (!dealId) {
          throw new Error('missing-deal-id');
        }

        const response = await fetch(`/api/deals/${encodeURIComponent(dealId)}`, {
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });

        const result = await response.json();
        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.error?.message || 'deal-not-found');
        }

        if (result.data.shopId !== shopId) {
          throw new Error('wrong-shop');
        }

        if (!cancelled) {
          setDeal(result.data);
          sessionStorage.setItem('editDeal', JSON.stringify(result.data));
        }
      } catch (err) {
        console.error('Failed to load deal for editing:', err);
        if (!cancelled) {
          setError('ไม่พบข้อมูลโปรโมชันที่ต้องการแก้ไข');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDeal();

    return () => {
      cancelled = true;
    };
  }, [shopId]);

  if (loading) {
    return <p className="text-text-secondary text-sm">กำลังโหลดข้อมูลคูปอง...</p>;
  }

  if (error || !deal) {
    return (
      <div className="text-center py-8 max-w-sm mx-auto">
        <div className="h-12 w-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-4">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-secondary font-bold text-sm">{error || 'ไม่พบข้อมูลโปรโมชันที่ต้องการแก้ไข'}</p>
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
