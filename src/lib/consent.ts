import type { AstroCookies } from 'astro';

export const CONSENT_COOKIE_NAME = 'dealdoor_consent';
export const CONSENT_VERSION = '2026-07-16';
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type ConsentPreferences = {
  necessary: true;
  analytics: boolean;
  version: string;
  updatedAt: string;
};

export function parseConsentCookie(value: string | undefined): ConsentPreferences | null {
  if (!value) return null;
  try {
    const raw = JSON.parse(value) as Partial<ConsentPreferences>;
    if (raw.necessary !== true || typeof raw.analytics !== 'boolean' || typeof raw.version !== 'string' || typeof raw.updatedAt !== 'string') return null;
    return { necessary: true, analytics: raw.analytics, version: raw.version, updatedAt: raw.updatedAt };
  } catch {
    return null;
  }
}

export function getConsentPreferences(cookies: AstroCookies): ConsentPreferences | null {
  return parseConsentCookie(cookies.get(CONSENT_COOKIE_NAME)?.value);
}

export function hasAnalyticsConsent(cookies: AstroCookies): boolean {
  return getConsentPreferences(cookies)?.analytics === true;
}

export function createConsentPreferences(analytics: boolean): ConsentPreferences {
  return { necessary: true, analytics, version: CONSENT_VERSION, updatedAt: new Date().toISOString() };
}

export function shouldUseSecureCookie(request: Request): boolean {
  if (process.env.ALLOW_INSECURE) return false;
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  return forwardedProto ? forwardedProto === 'https' : new URL(request.url).protocol === 'https:';
}
