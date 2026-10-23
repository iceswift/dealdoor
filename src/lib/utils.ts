// src/lib/utils.ts

import type { DealCategory } from './constants';
import { getSiteOrigin } from './site';

// ─── Slug Generation ─────────────────────────────────────

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0E00-\u0E7F\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

// ─── Deal Status ─────────────────────────────────────────

export type DealStatus = 'active' | 'expiring_soon' | 'expired';

export function getDealStatus(deal: { endDate: Date; isActive: boolean }): DealStatus {
  const now = new Date();
  const end = new Date(deal.endDate);
  const hoursLeft = (end.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (!deal.isActive || end < now) return 'expired';
  if (hoursLeft <= 24) return 'expiring_soon';
  return 'active';
}

// ─── Days Remaining ──────────────────────────────────────

export function getDaysRemaining(endDate: Date): number {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Date Formatting ─────────────────────────────────────

export function formatDate(date: Date, lang: 'th' | 'en' = 'th'): string {
  if (lang === 'th') {
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(date: Date, lang: 'th' | 'en' = 'th'): string {
  if (lang === 'th') {
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
    });
  }
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });
}

// ─── Price Formatting ────────────────────────────────────

export function formatPrice(price: number, lang: 'th' | 'en' = 'th'): string {
  return `฿${price.toLocaleString(lang === 'th' ? 'th-TH' : 'en-US')}`;
}

// ─── Time Ago ────────────────────────────────────────────

export function formatTimeAgo(date: Date, lang: 'th' | 'en' = 'th'): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (lang === 'th') {
    if (seconds < 60) return 'เมื่อสักครู่';
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    if (days < 7) return `${days} วันที่แล้ว`;
    return formatDate(date, 'th');
  }

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date, 'en');
}

// ─── URL Helpers ─────────────────────────────────────────

export function getShopUrl(slug: string): string {
  return `/${slug}`;
}

export function getDealUrl(slug: string, dealId: string): string {
  return `/${slug}?deal=${dealId}`;
}

export function getShareUrl(slug: string, dealId?: string, origin = getSiteOrigin()): string {
  const base = `${origin}/${slug}`;
  return dealId ? `${base}?deal=${dealId}` : base;
}

// ─── Opening Hours ───────────────────────────────────────

export function parseOpeningHours(json: string | null): Record<string, string> {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function isOpenNow(openingHours: Record<string, string>): boolean {
  const now = new Date();
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = dayNames[now.getDay()];
  const hours = openingHours[today];

  if (!hours || hours === 'closed') return false;

  const [open, close] = hours.split('-');
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return currentTime >= open && currentTime <= close;
}
