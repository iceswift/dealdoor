// src/components/shared/FavoriteButton.tsx

import { useState, useEffect } from 'react';
import { isFavoriteShop, addFavoriteShop, removeFavoriteShop } from '../../lib/saved-deals';

interface FavoriteButtonProps {
  shopId: string;
  showLabel?: boolean;
  className?: string;
}

export default function FavoriteButton({ shopId, showLabel = false, className = '' }: FavoriteButtonProps) {
  const [favorite, setFavorite] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setFavorite(isFavoriteShop(shopId));
  }, [shopId]);

  const handleToggle = () => {
    setAnimating(true);
    
    if (favorite) {
      removeFavoriteShop(shopId);
    } else {
      addFavoriteShop(shopId);
    }
    setFavorite(!favorite);
    
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <button
      onClick={handleToggle}
      className={`btn ${favorite ? 'btn-ghost text-warning' : 'btn-ghost'} ${animating ? 'scale-110' : ''} ${className}`}
      aria-label={favorite ? 'ยกเลิกติดตาม' : 'ติดตามร้าน'}
    >
      <svg
        className={`h-5 w-5 transition-all ${favorite ? 'fill-warning text-warning' : 'text-text-tertiary'} ${animating ? 'scale-125' : ''}`}
        fill={favorite ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
      {showLabel && (
        <span>{favorite ? 'ติดตามแล้ว' : 'ติดตาม'}</span>
      )}
    </button>
  );
}
