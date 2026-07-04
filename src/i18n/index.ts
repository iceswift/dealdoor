// src/i18n/index.ts

import thCommon from './th/common.json';
import enCommon from './en/common.json';

export const LANGUAGES = {
  th: { name: 'ไทย', flag: '🇹🇭' },
  en: { name: 'English', flag: '🇺🇸' },
} as const;

export type Language = keyof typeof LANGUAGES;

const translations = {
  th: { common: thCommon },
  en: { common: enCommon },
} as const;

export type Namespace = 'common';

export function getLangFromUrl(url: URL): Language {
  const path = url.pathname;
  if (path.startsWith('/en')) return 'en';
  return 'th';
}

export function t(
  lang: Language,
  namespace: Namespace,
  key: string,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let value: any = translations[lang][namespace];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to Thai
      value = translations['th'][namespace];
      for (const fk of keys) {
        value = value?.[fk];
      }
      break;
    }
  }

  if (typeof value !== 'string') return key;

  // Replace params
  if (params) {
    return Object.entries(params).reduce(
      (str, [key, val]) => str.replace(`{${key}}`, String(val)),
      value
    );
  }

  return value;
}

export function getLocalizedPath(path: string, lang: Language): string {
  // Remove existing language prefix
  const cleanPath = path.replace(/^\/(th|en)/, '') || '/';

  if (lang === 'th') {
    return cleanPath; // Thai is default, no prefix
  }

  return `/${lang}${cleanPath}`;
}
