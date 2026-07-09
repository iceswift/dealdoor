// src/components/shop/ContactButtons.tsx

import type { Shop } from '../../lib/db-schema';

interface ContactButtonsProps {
  shop: Shop;
}

interface ContactButton {
  label: string;
  icon: string;
  href: string;
  colorClass: string;
}

export default function ContactButtons({ shop }: ContactButtonsProps) {
  const buttons: ContactButton[] = [];

  if (shop.latitude && shop.longitude) {
    buttons.push({
      label: 'แผนที่',
      icon: `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`,
      href: `https://www.google.com/maps?q=${shop.latitude},${shop.longitude}`,
      colorClass: 'badge-info',
    });
  }

  if (shop.lineId) {
    const lineUrl = shop.lineId.startsWith('@')
      ? `https://line.me/ti/p/${shop.lineId}`
      : shop.lineId;
    buttons.push({
      label: 'LINE',
      icon: `<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 5.82 2 10.5c0 2.72 1.48 5.15 3.79 6.87-.15.56-.57 2.06-.65 2.38-.1.38.14.38.29.28.11-.08 1.83-1.26 2.57-1.78.82.12 1.67.18 2.57.18 5.52 0 10-3.82 10-8.5S17.52 2 12 2z"/></svg>`,
      href: lineUrl,
      colorClass: 'badge-success',
    });
  }

  if (shop.phone) {
    buttons.push({
      label: 'โทร',
      icon: `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>`,
      href: `tel:${shop.phone}`,
      colorClass: 'badge',
    });
  }

  if (shop.facebookUrl) {
    buttons.push({
      label: 'Facebook',
      icon: `<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
      href: shop.facebookUrl,
      colorClass: 'badge-info',
    });
  }

  if (shop.instagramUrl) {
    buttons.push({
      label: 'Instagram',
      icon: `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" /></svg>`,
      href: shop.instagramUrl,
      colorClass: 'badge',
    });
  }

  if (buttons.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2" role="navigation" aria-label="ช่องทางติดต่อ">
      {buttons.map((btn) => (
        <a
          key={btn.label}
          href={btn.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 min-h-[44px] text-xs font-bold transition-all shadow-sm border border-border/15 ${btn.colorClass}`}
          dangerouslySetInnerHTML={{ __html: `${btn.icon}<span>${btn.label}</span>` }}
        />
      ))}
    </div>
  );
}
