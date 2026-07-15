// src/components/shared/SaveButton.tsx

import { useEffect, useState, type MouseEvent } from 'react';
import { isDealSaved, saveDeal, unsaveDeal } from '../../lib/saved-deals';

interface SaveButtonProps {
  dealId: string;
  showLabel?: boolean;
  className?: string;
  variant?: 'button' | 'icon';
}

export default function SaveButton({ dealId, showLabel = false, className = '', variant = 'button' }: SaveButtonProps) {
  const [saved, setSaved] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setSaved(isDealSaved(dealId));
  }, [dealId]);

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (saved) {
      unsaveDeal(dealId);
    } else {
      saveDeal(dealId);
    }

    setSaved(!saved);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    window.dispatchEvent(new CustomEvent('dealdoor:saved-deals-change', {
      detail: { dealId, saved: !saved },
    }));
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`${variant === 'button' ? `btn ${saved ? 'btn-ghost text-danger' : 'btn-ghost'}` : ''} ${animating ? 'scale-110' : ''} ${className}`}
      aria-label={saved ? 'ยกเลิกบันทึก' : 'บันทึกดีล'}
      aria-pressed={saved}
    >
      <svg
        className={`h-5 w-5 transition-all ${saved ? 'fill-danger text-danger' : 'text-text-tertiary'} ${animating ? 'scale-125' : ''}`}
        fill={saved ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {showLabel && (
        <span>{saved ? 'บันทึกแล้ว' : 'บันทึก'}</span>
      )}
    </button>
  );
}
