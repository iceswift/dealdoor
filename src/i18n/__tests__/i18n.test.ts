// src/i18n/__tests__/i18n.test.ts

import { describe, expect, it } from 'vitest';
import {
  getLangFromPathname,
  getLocalizedPath,
  getMissingTranslationKeys,
  stripLocalePrefix,
  t,
} from '../index';
import { formatCurrency, formatNumber, formatRelativeTime } from '../format';

describe('i18n routing', () => {
  it('uses Thai for an unprefixed URL and English for /en', () => {
    expect(getLangFromPathname('/explore')).toBe('th');
    expect(getLangFromPathname('/en/explore')).toBe('en');
  });

  it('adds and removes language prefixes without changing the route', () => {
    expect(stripLocalePrefix('/en/explore?category=cafe')).toBe('/explore?category=cafe');
    expect(getLocalizedPath('/explore?category=cafe', 'en')).toBe('/en/explore?category=cafe');
    expect(getLocalizedPath('/explore?category=cafe#map', 'en')).toBe('/en/explore?category=cafe#map');
    expect(getLocalizedPath('/en/explore', 'th')).toBe('/explore');
  });
});

describe('translations', () => {
  it('has English values for every shared Thai key', () => {
    expect(getMissingTranslationKeys('en', 'common')).toEqual([]);
    expect(getMissingTranslationKeys('en', 'public')).toEqual([]);
  });

  it('interpolates every matching parameter and falls back safely', () => {
    expect(t('en', 'common', 'time.daysLeft', { count: 3 })).toBe('3 days left');
    expect(t('en', 'common', 'missing.key')).toBe('missing.key');
  });
});

describe('locale formatting', () => {
  it('formats numeric and currency values using the requested locale', () => {
    expect(formatNumber(1200, 'en')).toBe('1,200');
    expect(formatCurrency(1200, 'en')).toContain('1,200');
  });

  it('formats relative time with the requested locale', () => {
    expect(formatRelativeTime(-1, 'day', 'en')).toBe('yesterday');
  });
});
