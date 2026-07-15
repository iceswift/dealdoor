// src/i18n/index.ts

import thCommon from './th/common.json';
import enCommon from './en/common.json';
import thPublic from './th/public.json';
import enPublic from './en/public.json';

export const DEFAULT_LANGUAGE = 'th' as const;
export const LOCALE_COOKIE = 'dealdoor_locale';
export const LANGUAGE_LOCALES = {
  th: 'th-TH',
  en: 'en-US',
} as const;

export const LANGUAGES = {
  th: { name: 'Thai', nativeName: 'ไทย', locale: LANGUAGE_LOCALES.th },
  en: { name: 'English', nativeName: 'English', locale: LANGUAGE_LOCALES.en },
} as const;

export type Language = keyof typeof LANGUAGES;
export type TranslationNamespace = 'common' | 'public';
export type TranslationParams = Record<string, string | number>;

const translations = {
  th: { common: thCommon, public: thPublic },
  en: { common: enCommon, public: enPublic },
} as const;

export function isLanguage(value: string | null | undefined): value is Language {
  return Boolean(value && value in LANGUAGES);
}

export function getLangFromPathname(pathname: string): Language {
  const segment = pathname.split('/').filter(Boolean)[0];
  return isLanguage(segment) ? segment : DEFAULT_LANGUAGE;
}

export function getLangFromUrl(url: URL): Language {
  return getLangFromPathname(url.pathname);
}

export function getLangFromRequest(request: Request): Language {
  const rewrittenLanguage = request.headers.get('x-dealdoor-locale');
  return isLanguage(rewrittenLanguage) ? rewrittenLanguage : getLangFromUrl(new URL(request.url));
}

export function getIntlLocale(language: Language): string {
  return LANGUAGE_LOCALES[language];
}

export function stripLocalePrefix(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (!isLanguage(parts[0])) return pathname || '/';
  const stripped = `/${parts.slice(1).join('/')}`;
  return stripped === '/' ? '/' : stripped.replace(/\/+$/, '');
}

export function getLocalizedPath(path: string, language: Language): string {
  const [, pathname = '/', suffix = ''] = path.match(/^([^?#]*)(.*)$/) || [];
  const cleanPath = stripLocalePrefix(pathname || '/');
  return language === DEFAULT_LANGUAGE ? `${cleanPath}${suffix}` : `/${language}${cleanPath === '/' ? '' : cleanPath}${suffix}`;
}

function getValue(language: Language, namespace: TranslationNamespace, key: string): unknown {
  return key.split('.').reduce<unknown>((value, part) => (
    value && typeof value === 'object' && part in value
      ? (value as Record<string, unknown>)[part]
      : undefined
  ), translations[language][namespace]);
}

export function hasTranslation(language: Language, namespace: TranslationNamespace, key: string): boolean {
  return typeof getValue(language, namespace, key) === 'string';
}

export function t(
  language: Language,
  namespace: TranslationNamespace,
  key: string,
  params?: TranslationParams,
): string {
  const value = getValue(language, namespace, key);
  const fallback = getValue(DEFAULT_LANGUAGE, namespace, key);
  const text = typeof value === 'string' ? value : typeof fallback === 'string' ? fallback : key;

  return params
    ? text.replace(/\{([^}]+)\}/g, (token, name) => (name in params ? String(params[name]) : token))
    : text;
}

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') return prefix ? [prefix] : [];
  return Object.entries(value).flatMap(([key, child]) => flattenKeys(child, prefix ? `${prefix}.${key}` : key));
}

export function getTranslationKeys(language: Language, namespace: TranslationNamespace): string[] {
  return flattenKeys(translations[language][namespace]);
}

export function getMissingTranslationKeys(language: Language, namespace: TranslationNamespace): string[] {
  return getTranslationKeys(DEFAULT_LANGUAGE, namespace).filter((key) => !hasTranslation(language, namespace, key));
}
