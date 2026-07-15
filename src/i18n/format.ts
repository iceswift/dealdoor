// src/i18n/format.ts

import type { Language } from './index';
import { getIntlLocale } from './index';

export function formatNumber(value: number, language: Language, options: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat(getIntlLocale(language), options).format(value);
}

export function formatCurrency(value: number, language: Language, currency = 'THB'): string {
  return new Intl.NumberFormat(getIntlLocale(language), {
    style: 'currency',
    currency,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

export function formatDate(value: Date | string | number, language: Language, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat(getIntlLocale(language), options).format(new Date(value));
}

export function formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, language: Language): string {
  return new Intl.RelativeTimeFormat(getIntlLocale(language), { numeric: 'auto' }).format(value, unit);
}
