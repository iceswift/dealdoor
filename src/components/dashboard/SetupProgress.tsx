// src/components/dashboard/SetupProgress.tsx

import { useState } from 'react';
import type { Shop } from '../../../db/schema';

interface SetupProgressProps {
  shop: Shop | null;
  dealCount: number;
}

const icons: Record<string, JSX.Element> = {
  pencil: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  ),
  tag: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  eye: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  phone: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  'map-pin': (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  rocket: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
};

export default function SetupProgress({ shop, dealCount }: SetupProgressProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!shop || dismissed) return null;

  const tasks = [
    {
      id: 'description',
      label: 'เพิ่มคำอธิบายร้านค้า',
      done: Boolean(shop.description && shop.description.length > 10),
      href: '/dashboard/edit',
      icon: 'pencil',
    },
    {
      id: 'deals',
      label: 'สร้างดีลแรกของคุณ',
      done: dealCount >= 1,
      href: '/dashboard/deals',
      icon: 'tag',
    },
    {
      id: 'branding',
      label: 'อัปโหลดรูปโลโก้หรือหน้าปก',
      done: Boolean(shop.logoImage || shop.coverImage),
      href: '/dashboard/edit',
      icon: 'eye',
    },
    {
      id: 'contact',
      label: 'เพิ่มช่องทางติดต่อ (โทร/LINE)',
      done: Boolean(shop.phone || shop.lineId),
      href: '/dashboard/edit',
      icon: 'phone',
    },
    {
      id: 'address',
      label: 'เพิ่มที่อยู่ร้านค้า',
      done: Boolean(shop.address && shop.address.length > 5),
      href: '/dashboard/edit',
      icon: 'map-pin',
    },
  ];

  const completedCount = tasks.filter(t => t.done).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);
  const allDone = completedCount === tasks.length;

  if (allDone) return null;

  return (
    <div className="rounded-3xl border border-primary/15 bg-gradient-to-br from-primary-light/30 via-card-bg/80 to-card-bg/60 backdrop-blur-md p-6 shadow-md relative overflow-hidden group">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-sm">
              <div className="h-5 w-5 text-white">
                {icons.rocket}
              </div>
            </div>
            <div>
              <h3 className="text-base font-black text-secondary">ตั้งค่าร้านค้าของคุณ</h3>
              <p className="text-xs text-text-tertiary font-bold">ทำให้ร้านของคุณโดดเด่นและดึงดูดลูกค้า</p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-text-tertiary hover:bg-bg-secondary/60 transition-colors"
            aria-label="ปิด"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-text-secondary">{progressPercent}% เสร็จสมบูรณ์</span>
            <span className="text-xs font-black text-primary">{completedCount}/{tasks.length}</span>
          </div>
          <div className="h-2.5 bg-bg-secondary rounded-full overflow-hidden border border-border/20">
            <div
              className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          {tasks.map(task => (
            <a
              key={task.id}
              href={task.href}
              className={`flex items-center gap-3 rounded-xl p-3 transition-all duration-200 group/item ${
                task.done
                  ? 'bg-success-bg/40 opacity-60'
                  : 'hover:bg-primary/5 border border-transparent hover:border-primary/10'
              }`}
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                task.done
                  ? 'bg-success/10 text-success'
                  : 'bg-primary/10 text-primary'
              }`}>
                <div className="h-4 w-4">
                  {icons[task.icon]}
                </div>
              </div>
              <span className={`text-sm font-bold flex-1 ${task.done ? 'line-through text-text-tertiary' : 'text-secondary'}`}>
                {task.label}
              </span>
              {task.done ? (
                <div className="h-6 w-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                  <svg className="h-3.5 w-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <svg className="h-4 w-4 text-text-tertiary group-hover/item:text-primary transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
