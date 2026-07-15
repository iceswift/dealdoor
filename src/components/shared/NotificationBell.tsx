import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: string | null;
};

type IconProps = { className?: string };

type TypeStyle = {
  colorClass: string;
  bgClass: string;
  icon: (props: IconProps) => JSX.Element;
};

const Icons = {
  clock: ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  chart: ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  flag: ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
    </svg>
  ),
  check: ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  system: ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  bell: ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
};

const TYPE_STYLES: Record<string, TypeStyle> = {
  deal_expiring: { colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10', icon: Icons.clock },
  deal_expired: { colorClass: 'text-danger', bgClass: 'bg-danger/10', icon: Icons.clock },
  deal_quota_low: { colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10', icon: Icons.clock },
  deal_quota_reached: { colorClass: 'text-danger', bgClass: 'bg-danger/10', icon: Icons.clock },
  milestone: { colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10', icon: Icons.chart },
  report_created: { colorClass: 'text-blue-500', bgClass: 'bg-blue-500/10', icon: Icons.flag },
  report_resolved: { colorClass: 'text-blue-500', bgClass: 'bg-blue-500/10', icon: Icons.check },
  system: { colorClass: 'text-text-secondary', bgClass: 'bg-bg-secondary', icon: Icons.system },
};

const defaultTypeStyle: TypeStyle = { colorClass: 'text-primary', bgClass: 'bg-primary/10', icon: Icons.bell };

const styleFor = (type: string) => TYPE_STYLES[type] || defaultTypeStyle;

const isToday = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const knownIds = useRef<Set<string>>(new Set());
  const hasFetchedOnce = useRef(false);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=10', { credentials: 'same-origin' });
      const payload = await response.json();
      if (payload.success) {
        const incoming: Notification[] = payload.data.notifications;
        if (hasFetchedOnce.current) {
          const freshIds = incoming.filter((item) => !knownIds.current.has(item.id)).map((item) => item.id);
          if (freshIds.length > 0) {
            setNewIds(new Set(freshIds));
            window.setTimeout(() => {
              setNewIds((current) => {
                const next = new Set(current);
                freshIds.forEach((id) => next.delete(id));
                return next;
              });
            }, 1200);
          }
        }
        knownIds.current = new Set(incoming.map((item) => item.id));
        hasFetchedOnce.current = true;
        setNotifications(incoming);
        setUnreadCount(payload.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotifications();
    const timer = window.setInterval(fetchNotifications, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const stream = new EventSource('/api/notifications/stream');
    stream.addEventListener('inbox', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as { unreadCount?: unknown };
        if (typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
          void fetchNotifications();
        }
      } catch {
        // The periodic request remains as a fallback for malformed events.
      }
    });
    return () => stream.close();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('overflow-hidden');
    return () => document.body.classList.remove('overflow-hidden');
  }, [isOpen]);

  const markRead = async (id: string) => {
    const notification = notifications.find((item) => item.id === id);
    if (!notification || notification.read) return;

    const response = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    if (!response.ok) return;
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item));
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const markAllRead = async () => {
    const response = await fetch('/api/notifications/all/read', { method: 'POST' });
    if (!response.ok) return;
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
  };

  const dismiss = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await markRead(id);
    setNotifications((items) => items.filter((item) => item.id !== id));
  };

  const openNotification = async (notification: Notification) => {
    await markRead(notification.id);
    if (!notification.metadata) return;
    try {
      const metadata = JSON.parse(notification.metadata) as { href?: unknown };
      if (typeof metadata.href === 'string' && metadata.href.startsWith('/')) {
        window.location.assign(metadata.href);
      }
    } catch {
      // Metadata is optional and may be from older notifications.
    }
  };

  const timeAgo = (dateString: string) => {
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 60_000));
    if (minutes < 1) return 'เมื่อสักครู่';
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    return `${Math.floor(hours / 24)} วันที่แล้ว`;
  };

  const todayItems = notifications.filter((item) => isToday(item.createdAt));
  const earlierItems = notifications.filter((item) => !isToday(item.createdAt));

  const renderCard = (notification: Notification) => {
    const style = styleFor(notification.type);
    const Icon = style.icon;
    const isNew = newIds.has(notification.id);
    return (
      <div
        key={notification.id}
        className={`group relative mb-2.5 flex w-full gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${notification.read ? 'border-border/35 bg-card-bg hover:border-border/60' : 'border-primary/25 bg-primary/[0.035] hover:border-primary/45'} ${isNew ? 'animate-slide-in-right' : ''}`}
      >
        <button className="flex min-w-0 flex-1 gap-3 text-left" onClick={() => void openNotification(notification)}>
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.bgClass} ${style.colorClass}`}>
            <Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1 pr-5">
            <span className="flex items-start gap-2">
              <span className="line-clamp-1 flex-1 text-sm font-black text-secondary">{notification.title}</span>
              {!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="ยังไม่ได้อ่าน" />}
            </span>
            <span className="mt-1 block line-clamp-2 text-xs font-medium leading-relaxed text-text-secondary">{notification.message}</span>
            <span className="mt-2 block text-[10px] font-bold text-text-tertiary">{timeAgo(notification.createdAt)}</span>
          </span>
        </button>
        <button
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-text-tertiary opacity-0 transition hover:bg-bg-secondary hover:text-secondary group-hover:opacity-100"
          aria-label="ล้างการแจ้งเตือนนี้"
          onClick={(event) => void dismiss(notification.id, event)}
        >
          ×
        </button>
      </div>
    );
  };

  const skeletonRows = (
    <div className="space-y-2.5 p-1">
      {[0, 1, 2].map((index) => (
        <div key={index} className="flex gap-3 rounded-2xl border border-border/35 bg-card-bg p-3">
          <span className="skeleton h-11 w-11 shrink-0 rounded-xl" />
          <span className="min-w-0 flex-1 space-y-2 py-0.5">
            <span className="skeleton block h-3.5 w-2/3 rounded" />
            <span className="skeleton block h-3 w-full rounded" />
            <span className="skeleton block h-2.5 w-1/3 rounded" />
          </span>
        </div>
      ))}
    </div>
  );

  const drawer = (
    <>
      <button className="fixed inset-0 z-[1999] cursor-default bg-black/40 backdrop-blur-sm" aria-label="ปิดการแจ้งเตือน" onClick={() => setIsOpen(false)} />
      <section className="fixed inset-y-0 right-0 z-[2000] flex h-full w-full max-w-[420px] flex-col border-l border-border/40 bg-bg shadow-2xl" aria-label="การแจ้งเตือน" aria-modal="true" role="dialog">
        <header className="flex items-center justify-between border-b border-border/40 bg-card-bg/80 px-5 py-4 backdrop-blur-sm">
          <div>
            <h2 className="text-base font-black text-secondary">การแจ้งเตือน</h2>
            <p className="mt-0.5 text-xs font-semibold text-text-tertiary">อัปเดตของร้าน ดีล และระบบ{unreadCount > 0 ? ` · ${unreadCount} รายการใหม่` : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && <button className="min-h-10 rounded-xl px-2 text-xs font-black text-primary transition hover:bg-primary/5" onClick={markAllRead}>อ่านทั้งหมด</button>}
            <button className="flex h-10 w-10 items-center justify-center rounded-xl text-lg text-text-secondary transition hover:bg-bg-secondary hover:text-secondary" aria-label="ปิด" onClick={() => setIsOpen(false)}>×</button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            skeletonRows
          ) : notifications.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-bg-secondary text-text-tertiary">
                <Icons.check className="h-7 w-7" />
              </span>
              <p className="text-sm font-black text-secondary">ยังไม่มีการแจ้งเตือน</p>
              <p className="mt-1 text-xs text-text-tertiary">เมื่อมีเรื่องสำคัญ เราจะแจ้งที่นี่</p>
            </div>
          ) : (
            <>
              {todayItems.length > 0 && (
                <div className="mb-1">
                  <p className="mb-2 px-1 text-[11px] font-black uppercase tracking-wide text-text-tertiary">วันนี้</p>
                  {todayItems.map(renderCard)}
                </div>
              )}
              {earlierItems.length > 0 && (
                <div>
                  <p className="mb-2 px-1 text-[11px] font-black uppercase tracking-wide text-text-tertiary">ก่อนหน้านี้</p>
                  {earlierItems.map(renderCard)}
                </div>
              )}
            </>
          )}
        </div>
        <div className="border-t border-border/40 bg-card-bg/80 p-3 backdrop-blur-sm">
          <button className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black text-secondary transition hover:bg-bg-secondary hover:text-primary" onClick={() => window.location.assign('/dashboard/notifications')}>
            ดูการแจ้งเตือนทั้งหมด <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>
    </>
  );

  return <div className="relative">
    <button className="relative flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-bg-secondary hover:text-secondary" aria-label="เปิดการแจ้งเตือน" onClick={() => setIsOpen(true)}>
      <Icons.bell className="h-5 w-5" />
      {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
    </button>
    {isOpen && typeof document !== 'undefined' && createPortal(drawer, document.body)}
  </div>;
}
