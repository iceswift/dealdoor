import { describe, expect, it } from 'vitest';
import { parseConsentCookie } from '../consent';

describe('parseConsentCookie', () => {
  it('accepts a complete consent record', () => {
    expect(parseConsentCookie(JSON.stringify({
      necessary: true,
      analytics: false,
      version: '2026-07-16',
      updatedAt: '2026-07-16T00:00:00.000Z',
    }))).toMatchObject({ necessary: true, analytics: false });
  });

  it('rejects malformed or incomplete records', () => {
    expect(parseConsentCookie('not-json')).toBeNull();
    expect(parseConsentCookie(JSON.stringify({ necessary: true, analytics: true }))).toBeNull();
    expect(parseConsentCookie(JSON.stringify({ necessary: false, analytics: true, version: 'v1', updatedAt: 'now' }))).toBeNull();
  });
});
