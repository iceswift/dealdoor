import { useEffect, useMemo, useState } from 'react';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: string | null;
};

const typeLabel: Record<string, string> = {
  deal_expiring: 'ดีล',
  deal_expired: 'ดีล',
  deal_quota_low: 'โควตาดีล',
  deal_quota_reached: 'โควตาดีล',
  milestone: 'สถิติ',
  report_created: 'รายงาน',
  report_resolved: 'รายงาน',
  system: 'ระบบ',
};

function getHref(notification: Notification) {
  if (!notification.metadata) return null;
  try {
    const metadata = JSON.parse(notification.metadata) as { href?: unknown };
    return typeof metadata.href === 'string' && metadata.href.startsWith('/') ? metadata.href : null;
  } catch {
    return null;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function NotificationCenter() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=50', { credentials: 'same-origin' });
      const payload = await response.json();
      if (payload.success) {
        setItems(payload.data.notifications);
        setUnreadCount(payload.data.unreadCount);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchInbox(); }, []);

  useEffect(() => {
    const stream = new EventSource('/api/notifications/stream');
    stream.addEventListener('inbox', () => void fetchInbox());
    return () => stream.close();
  }, []);

  const visibleItems = useMemo(
    () => filter === 'unread' ? items.filter((item) => !item.read) : items,
    [filter, items],
  );

  const markRead = async (notification: Notification) => {
    if (!notification.read) {
      const response = await fetch(`/api/notifications/${notification.id}/read`, { method: 'POST' });
      if (response.ok) {
        setItems((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
        setUnreadCount((current) => Math.max(0, current - 1));
      }
    }

    const href = getHref(notification);
    if (href) window.location.assign(href);
  };

  const markAllRead = async () => {
    const response = await fetch('/api/notifications/all/read', { method: 'POST' });
    if (!response.ok) return;
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
  };

  return <section className="rounded-2xl border border-border/40 bg-card-bg p-4 shadow-sm sm:p-6">
    <div className="flex flex-col gap-4 border-b border-border/40 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Inbox</p>
        <h1 className="mt-1 text-2xl font-black text-secondary">การแจ้งเตือนทั้งหมด</h1>
        <p className="mt-1 text-sm text-text-secondary">อัปเดตเกี่ยวกับร้าน ดีล สถิติ และการดูแลระบบ</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a className="flex min-h-11 items-center rounded-xl border border-border/50 px-4 text-sm font-black text-text-secondary hover:bg-bg-secondary" href="/dashboard/notification-settings">ตั้งค่า</a>
        {unreadCount > 0 && <button className="min-h-11 rounded-xl border border-primary/25 px-4 text-sm font-black text-primary hover:bg-primary/5" onClick={() => void markAllRead()}>อ่านทั้งหมด ({unreadCount})</button>}
      </div>
    </div>

    <div className="mt-5 flex gap-2" role="tablist" aria-label="ตัวกรองการแจ้งเตือน">
      {(['all', 'unread'] as const).map((value) => <button key={value} role="tab" aria-selected={filter === value} className={`min-h-10 rounded-xl px-4 text-sm font-black transition-colors ${filter === value ? 'bg-primary text-white' : 'bg-bg-secondary text-text-secondary hover:text-secondary'}`} onClick={() => setFilter(value)}>{value === 'all' ? 'ทั้งหมด' : `ยังไม่อ่าน (${unreadCount})`}</button>)}
    </div>

    <div className="mt-5 divide-y divide-border/35">
      {loading ? <p className="py-12 text-center text-sm font-semibold text-text-tertiary">กำลังโหลดการแจ้งเตือน...</p> : visibleItems.length === 0 ? <div className="py-16 text-center"><p className="text-base font-black text-secondary">ไม่มีรายการในมุมมองนี้</p><p className="mt-1 text-sm text-text-tertiary">ทุกอย่างเรียบร้อยดี</p></div> : visibleItems.map((notification) => <button key={notification.id} className={`flex w-full gap-3 px-1 py-4 text-left transition-colors hover:bg-bg-secondary/60 sm:px-3 ${notification.read ? '' : 'bg-primary/[0.03]'}`} onClick={() => void markRead(notification)}>
        <span className="mt-0.5 shrink-0 rounded-lg bg-bg-secondary px-2 py-1 text-[10px] font-black text-text-secondary">{typeLabel[notification.type] || 'แจ้งเตือน'}</span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-black text-secondary">{notification.title}</span><span className="mt-1 block text-sm leading-relaxed text-text-secondary">{notification.message}</span><span className="mt-2 block text-xs font-semibold text-text-tertiary">{formatDate(notification.createdAt)}</span></span>
        {!notification.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
      </button>)}
    </div>
  </section>;
}
