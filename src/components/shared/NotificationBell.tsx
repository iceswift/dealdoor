// src/components/shared/NotificationBell.tsx

import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: string;
}

interface NotificationBellProps {
  userId?: string;
  shopId?: string;
}

export default function NotificationBell({ userId, shopId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [userId, shopId]);

  useEffect(() => {
    if (isOpen) {
      if (window.innerWidth < 768) {
        document.body.classList.add('overflow-hidden');
      }
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      if (shopId) params.set('shopId', shopId);
      params.set('limit', '10');

      const res = await fetch(`/api/notifications?${params}`);
      const data = await res.json();

      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications/all/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, shopId }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deal_expiring': return '⏰';
      case 'deal_expired': return '❌';
      case 'milestone': return '🎉';
      case 'system': return '📢';
      default: return '🔔';
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'เมื่อสักครู่';
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชม. ที่แล้ว`;
    return `${days} วันที่แล้ว`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop for desktop click-away */}
          <div className="fixed inset-0 z-40 hidden md:block" onClick={() => setIsOpen(false)} />
          
          {/* Notifications Panel */}
          {/* Mobile: Full-screen fixed overlay */}
          {/* Desktop: Absolute dropdown */}
          <div className="fixed inset-0 z-50 md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-80 rounded-none md:rounded-xl border-0 md:border border-border bg-bg/98 md:bg-bg backdrop-blur-xl md:backdrop-blur-none shadow-xl flex flex-col md:block h-full md:h-auto overflow-y-auto md:overflow-visible animate-fade-in md:animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 px-6 py-4 md:px-4 md:py-3 mt-4 md:mt-0 flex-shrink-0">
              <h3 className="font-bold text-secondary text-lg md:text-sm">การแจ้งเตือน</h3>
              <div className="flex items-center gap-3.5">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    อ่านทั้งหมด
                  </button>
                )}
                {/* Close Button (X) - visible only on mobile */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="md:hidden h-10 w-10 rounded-xl flex items-center justify-center text-text-secondary hover:bg-bg-secondary transition-all cursor-pointer"
                  aria-label="ปิดการแจ้งเตือน"
                >
                  <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto md:max-h-96 px-3 py-2 md:px-0 md:py-0">
              {notifications.length === 0 ? (
                <div className="p-12 md:p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-text-tertiary/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="mt-3 text-sm font-semibold text-text-secondary">ไม่มีการแจ้งเตือนใหม่</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-b border-border/30 rounded-2xl md:rounded-none px-5 py-4 md:px-4 md:py-3 transition-colors hover:bg-bg-secondary cursor-pointer my-1 md:my-0 ${
                      !notification.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                    }`}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="text-xl md:text-lg flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-secondary">{notification.title}</p>
                        <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="mt-2 text-[10px] text-text-tertiary">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
