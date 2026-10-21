export type LegalDocumentKey = 'terms' | 'privacy' | 'cookies';

export const LEGAL_DOCUMENTS: Record<LegalDocumentKey, {
  version: string;
  effectiveDate: string;
  status: 'pre-launch-draft';
  changeSummary: string;
}> = {
  terms: {
    version: '0.2-draft',
    effectiveDate: '16 July 2026',
    status: 'pre-launch-draft',
    changeSummary: 'Adds merchant publishing, moderation, Boost, and payment-readiness rules.',
  },
  privacy: {
    version: '0.2-draft',
    effectiveDate: '16 July 2026',
    status: 'pre-launch-draft',
    changeSummary: 'Adds current data flows, device location, analytics, storage, and DSAR limitations.',
  },
  cookies: {
    version: '0.2-draft',
    effectiveDate: '16 July 2026',
    status: 'pre-launch-draft',
    changeSummary: 'Adds the current cookie and browser-storage inventory.',
  },
};

export const LEGAL_CONTACTS = {
  privacyEmail: 'privacy@dealdoor.co',
  legalEmail: 'legal@dealdoor.co',
} as const;
