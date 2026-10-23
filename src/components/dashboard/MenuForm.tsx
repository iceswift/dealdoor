// src/components/dashboard/MenuForm.tsx

import { useState } from 'react';
import type { MenuItem } from '../../lib/db-schema';
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

interface MenuFormProps {
  uploadsDisabled?: boolean;
  item?: MenuItem;
  onSuccess?: () => void;
  onCancel?: () => void;
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

export default function MenuForm({ item, onSuccess, onCancel, uploadsDisabled }: MenuFormProps) {
  const [form, setForm] = useState<MenuFormState>(() => {
    if (item) return toForm(item);
    return emptyForm;
  });
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(form.id);

  function setField<K extends keyof MenuFormState>(key: K, value: MenuFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
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
      showToast(isEditing ? 'อัปเดตเมนูแล้ว' : 'เพิ่มเมนูแล้ว', 'success');
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = '/dashboard/menu';
      }
    } catch (err: any) {
      showToast(err.message || 'บันทึกเมนูไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-border/40 bg-card-bg p-5 shadow-sm max-w-2xl mx-auto">
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-primary">Menu Editor</p>
        <h2 className="text-xl font-black text-secondary">{isEditing ? 'แก้ไขเมนู' : 'เพิ่มเมนูหรือสินค้า'}</h2>
        <p className="mt-1 text-sm font-bold text-text-tertiary">
          ใช้แสดงในหัวข้อเมนู & แคตตาล็อกสินค้าบนหน้าร้าน
        </p>
      </div>

      <ImageUpload
        disabled={uploadsDisabled}
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
          placeholder="เช่น ลาเต้ร้อนรสชาติกลมกล่อม หอมนุ่ม"
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

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel || (() => { window.location.href = '/dashboard/menu'; })}
          className="min-h-[46px] flex-1 rounded-2xl border border-border/40 px-4 text-sm font-black text-secondary transition hover:bg-bg-secondary cursor-pointer"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={loading}
          className="min-h-[46px] flex-1 rounded-2xl bg-primary px-5 text-sm font-black text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'กำลังบันทึก...' : isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มเมนู'}
        </button>
      </div>
    </form>
  );
}
