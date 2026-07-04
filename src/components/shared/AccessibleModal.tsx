// src/components/shared/AccessibleModal.tsx

import { useEffect, useRef, useCallback } from 'react';
import { trapFocus } from '../../lib/accessibility';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Trap focus when modal opens
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      const cleanup = modalRef.current ? trapFocus(modalRef.current) : undefined;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      return () => {
        cleanup?.();
        document.body.style.overflow = '';
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen]);

  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-bg shadow-xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg px-4 py-3">
          <h2 id="modal-title" className="text-lg font-semibold text-secondary">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-text-tertiary hover:bg-bg-secondary hover:text-text-secondary transition-colors"
            aria-label="ปิด"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
