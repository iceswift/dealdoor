// src/i18n/react.tsx

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { DEFAULT_LANGUAGE, getLangFromPathname, t, type Language, type TranslationNamespace, type TranslationParams } from './index';

type I18nContextValue = {
  language: Language;
  translate: (namespace: TranslationNamespace, key: string, params?: TranslationParams) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ language, children }: { language: Language; children: ReactNode }) {
  const value = useMemo<I18nContextValue>(() => ({
    language,
    translate: (namespace, key, params) => t(language, namespace, key, params),
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function getBrowserLanguage(): Language {
  if (typeof document === 'undefined') return DEFAULT_LANGUAGE;
  return getLangFromPathname(window.location.pathname || document.documentElement.lang);
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (context) return context;

  const language = getBrowserLanguage();
  return {
    language,
    translate: (namespace, key, params) => t(language, namespace, key, params),
  };
}
