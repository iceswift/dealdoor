// src/components/dashboard/MenuManager.tsx

import { useMemo, useState } from 'react';
import type { MenuItem } from '../../lib/db-schema';
import { showToast } from '../../lib/toast';

interface MenuManagerProps {
  initialItems: MenuItem[];
  maxItems: number;
}

async function parseResponse(response: Response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || 'การดำเนินงานไม่สำเร็จ');
  }
  return payload;
}

export default function MenuManager({ initialItems, maxItems }: MenuManagerProps) {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [loading, setLoading] = useState(false);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)),
    [items],
  );

  async function refreshItems() {
    const response = await fetch('/api/menu-items');
    const payload = await parseResponse(response);
    setItems(payload.data);
  }

  async function handleDelete(item: MenuItem) {
    const confirmed = window.confirm(`ลบ "${item.name}" ออกจากหน้าร้านใช่ไหม?`);
    if (!confirmed) return;

    setLoading(true);
    try {
      await parseResponse(await fetch(`/api/menu-items/${item.id}`, { method: 'DELETE' }));
      await refreshItems();
      showToast('ลบเมนูแล้ว', 'success');
    } catch (err: any) {
      showToast(err.message || 'ลบเมนูไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border/40 bg-card-bg p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-primary">Live Catalog</p>
          <h2 className="text-xl font-black text-secondary">เมนูที่แสดงบนหน้าร้าน</h2>
        </div>
        <span className="rounded-full bg-bg-secondary px-3 py-1.5 text-xs font-black text-text-secondary self-start sm:self-auto">
          {items.length}/{maxItems} รายการ
        </span>
      </div>

      {sortedItems.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-dashed border-border/50 bg-bg-secondary/40 p-8 text-center">
          <p className="text-sm font-black text-secondary">ยังไม่มีเมนูในหน้าร้าน</p>
          <p className="mt-1 text-xs font-bold text-text-tertiary">เพิ่มรายการแรกเพื่อให้ลูกค้าเห็นเมนูหรือสินค้าที่แนะนำ</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedItems.map((item) => (
            <article key={item.id} className="group flex flex-col justify-between rounded-3xl border border-border/30 bg-bg p-4.5 transition hover:border-primary/30 hover:shadow-sm">
              <div className="flex gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border/20 bg-bg-secondary">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-black text-text-tertiary">
                      MENU
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1">
                    <h3 className="truncate text-sm font-black text-secondary">{item.name}</h3>
                    {item.price !== null && item.price !== undefined && (
                      <span className="text-sm font-black text-primary">
                        ฿{Number(item.price).toLocaleString('th-TH')}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-text-tertiary">ลำดับ {item.sortOrder ?? 0}</span>
                  </div>
                </div>
              </div>
              
              {item.description && (
                <p className="mt-3.5 line-clamp-2 text-xs font-bold leading-5 text-text-tertiary">{item.description}</p>
              )}

              <div className="mt-4 flex gap-2 border-t border-border/30 pt-3.5">
                <a
                  href={`/dashboard/menu/edit?id=${item.id}`}
                  className="flex-1 min-h-[38px] rounded-xl border border-border/40 flex items-center justify-center text-xs font-black text-secondary transition hover:bg-bg-secondary cursor-pointer"
                >
                  แก้ไข
                </a>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDelete(item)}
                  className="flex-1 min-h-[38px] rounded-xl border border-danger/20 text-xs font-black text-danger transition hover:bg-danger-bg/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  ลบ
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
