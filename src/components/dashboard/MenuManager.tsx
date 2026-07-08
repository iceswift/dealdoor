// src/components/dashboard/MenuManager.tsx

import { useMemo, useState } from 'react';
import type { MenuItem } from '../../../db/schema';
import { showToast } from '../../lib/toast';
import ImageUpload from '../shared/ImageUpload.tsx';

type MenuFormState = {
  id?: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  sortOrder: string;
};

interface MenuManagerProps {
  initialItems: MenuItem[];
  maxItems: number;
}

const emptyForm: MenuFormState = {
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  sortOrder: '0',
};

function toForm(item: MenuItem): MenuFormState {
  return {
    id: item.id,
    name: item.name,
    description: item.description || '',
    price: item.price === null || item.price === undefined ? '' : String(item.price),
    imageUrl: item.imageUrl || '',
    sortOrder: String(item.sortOrder ?? 0),
  };
}

async function parseResponse(response: Response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || 'บันทึกข้อมูลไม่สำเร็จ');
  }
  return payload;
}

export default function MenuManager({ initialItems, maxItems }: MenuManagerProps) {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [form, setForm] = useState<MenuFormState>(() => ({
    ...emptyForm,
    sortOrder: String(initialItems.length),
  }));
  const [loading, setLoading] = useState(false);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)),
    [items],
  );
  const isEditing = Boolean(form.id);
  const remaining = Math.max(0, maxItems - items.length);

  function setField<K extends keyof MenuFormState>(key: K, value: MenuFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm(nextItems = items) {
    setForm({
      ...emptyForm,
      sortOrder: String(nextItems.length),
    });
  }

  async function refreshItems() {
    const response = await fetch('/api/menu-items');
    const payload = await parseResponse(response);
    setItems(payload.data);
    return payload.data as MenuItem[];
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      showToast('กรุณากรอกชื่อเมนูหรือสินค้า', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(form.id ? `/api/menu-items/${form.id}` : '/api/menu-items', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: form.price,
          imageUrl: form.imageUrl,
          sortOrder: form.sortOrder,
        }),
      });

      await parseResponse(response);
      const nextItems = await refreshItems();
      resetForm(nextItems);
      showToast(isEditing ? 'อัปเดตเมนูแล้ว' : 'เพิ่มเมนูแล้ว', 'success');
    } catch (err: any) {
      showToast(err.message || 'บันทึกเมนูไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(item: MenuItem) {
    const confirmed = window.confirm(`ลบ "${item.name}" ออกจากหน้าร้านใช่ไหม?`);
    if (!confirmed) return;

    setLoading(true);
    try {
      await parseResponse(await fetch(`/api/menu-items/${item.id}`, { method: 'DELETE' }));
      const nextItems = await refreshItems();
      if (form.id === item.id) resetForm(nextItems);
      showToast('ลบเมนูแล้ว', 'success');
    } catch (err: any) {
      showToast(err.message || 'ลบเมนูไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-border/40 bg-card-bg p-5 shadow-sm xl:sticky xl:top-6 xl:self-start">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-primary">Menu Editor</p>
          <h2 className="text-xl font-black text-secondary">{isEditing ? 'แก้ไขเมนู' : 'เพิ่มเมนูหรือสินค้า'}</h2>
          <p className="mt-1 text-sm font-bold text-text-tertiary">
            ใช้แสดงในหัวข้อเมนู & แคตตาล็อกสินค้าบนหน้าร้าน
          </p>
        </div>

        <ImageUpload
          type="menu"
          currentUrl={form.imageUrl}
          onUpload={(url) => setField('imageUrl', url)}
          label="รูปเมนู"
        />

        <label className="block">
          <span className="text-sm font-black text-secondary">ชื่อเมนู / สินค้า</span>
          <input
            value={form.name}
            onChange={(event) => setField('name', event.target.value)}
            className="mt-2 h-12 w-full rounded-2xl border border-border/40 bg-bg px-4 text-sm font-bold outline-none focus:border-primary"
            placeholder="เช่น Iced Latte"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-black text-secondary">รายละเอียดสั้น</span>
          <textarea
            value={form.description}
            onChange={(event) => setField('description', event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-border/40 bg-bg p-4 text-sm font-bold outline-none focus:border-primary"
            placeholder="เช่น กาแฟนมคั่วกลาง หอมหวานนุ่ม"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-black text-secondary">ราคา</span>
            <input
              value={form.price}
              onChange={(event) => setField('price', event.target.value)}
              inputMode="decimal"
              className="mt-2 h-12 w-full rounded-2xl border border-border/40 bg-bg px-4 text-sm font-bold outline-none focus:border-primary"
              placeholder="120"
            />
          </label>
          <label className="block">
            <span className="text-sm font-black text-secondary">ลำดับ</span>
            <input
              value={form.sortOrder}
              onChange={(event) => setField('sortOrder', event.target.value)}
              inputMode="numeric"
              className="mt-2 h-12 w-full rounded-2xl border border-border/40 bg-bg px-4 text-sm font-bold outline-none focus:border-primary"
              placeholder="0"
            />
          </label>
        </div>

        <div className="flex gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={() => resetForm()}
              className="min-h-[46px] flex-1 rounded-2xl border border-border/40 px-4 text-sm font-black text-secondary transition hover:bg-bg-secondary"
            >
              ยกเลิก
            </button>
          )}
          <button
            type="submit"
            disabled={loading || (!isEditing && remaining <= 0)}
            className="min-h-[46px] flex-1 rounded-2xl bg-primary px-5 text-sm font-black text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'กำลังบันทึก...' : isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มเมนู'}
          </button>
        </div>
      </form>

      <section className="rounded-3xl border border-border/40 bg-card-bg p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-primary">Live Catalog</p>
            <h2 className="text-xl font-black text-secondary">เมนูที่แสดงบนหน้าร้าน</h2>
          </div>
          <span className="rounded-full bg-bg-secondary px-3 py-1.5 text-xs font-black text-text-secondary">
            {items.length}/{maxItems} รายการ
          </span>
        </div>

        {sortedItems.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-dashed border-border/50 bg-bg-secondary/40 p-8 text-center">
            <p className="text-sm font-black text-secondary">ยังไม่มีเมนูในหน้าร้าน</p>
            <p className="mt-1 text-xs font-bold text-text-tertiary">เพิ่มรายการแรกเพื่อให้ลูกค้าเห็นเมนูหรือสินค้าที่แนะนำ</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {sortedItems.map((item) => (
              <article key={item.id} className="group flex gap-4 rounded-3xl border border-border/30 bg-bg p-3 transition hover:border-primary/30 hover:shadow-sm">
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
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-black text-secondary">{item.name}</h3>
                      {item.description && (
                        <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-text-tertiary">{item.description}</p>
                      )}
                    </div>
                    {item.price !== null && item.price !== undefined && (
                      <span className="rounded-xl bg-primary/10 px-2.5 py-1 text-sm font-black text-primary">
                        ฿{Number(item.price).toLocaleString('th-TH')}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-text-tertiary">ลำดับ {item.sortOrder ?? 0}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setForm(toForm(item))}
                        className="min-h-[38px] rounded-xl border border-border/40 px-3 text-xs font-black text-secondary transition hover:bg-bg-secondary"
                      >
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="min-h-[38px] rounded-xl border border-danger/20 px-3 text-xs font-black text-danger transition hover:bg-danger-bg/20"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
