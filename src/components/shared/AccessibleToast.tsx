// src/components/shared/AccessibleToast.tsx

import { useState, useEffect, useCallback } from 'react';
import { announce } from '../../lib/accessibility';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface AccessibleToastProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export default function AccessibleToast({ toasts, onDismiss }: AccessibleToastProps) {
  // Announce new toasts to screen readers
  useEffect(() => {
    if (toasts.length > 0) {
      const latest = toasts[toasts.length - 1];
      announce(latest.message, latest.type === 'error' ? 'assertive' : 'polite');
    }
  }, [toasts]);

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
    }
  };

  const getColor = (type: Toast['type']) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
    }
  };

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed right-4 top-4 z-50 flex flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`${getColor(toast.type)} flex items-center gap-3 rounded-lg px-4 py-3 text-white shadow-lg`}
        >
          <span aria-hidden="true">{getIcon(toast.type)}</span>
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="ml-2 rounded-full p-1 hover:bg-white/20 transition-colors"
            aria-label="ปิด"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Toast Hook ──────────────────────────────────────────

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}
