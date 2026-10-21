import type { APIRoute } from 'astro';
import { json } from '../../lib/dashboard/server';
import { badRequest, handleApiError } from '../../lib/errors';
import {
  CONSENT_COOKIE_NAME,
  CONSENT_MAX_AGE_SECONDS,
  createConsentPreferences,
  getConsentPreferences,
  shouldUseSecureCookie,
} from '../../lib/consent';

export const GET: APIRoute = async ({ cookies }) => json({
  success: true,
  data: { consent: getConsentPreferences(cookies) },
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    if (typeof body?.analytics !== 'boolean') throw badRequest('INVALID_CONSENT', 'Analytics consent must be a boolean.');
    const consent = createConsentPreferences(body.analytics);
    cookies.set(CONSENT_COOKIE_NAME, JSON.stringify(consent), {
      path: '/', httpOnly: true, secure: shouldUseSecureCookie(request), sameSite: 'lax', maxAge: CONSENT_MAX_AGE_SECONDS,
    });
    return json({ success: true, data: { consent } });
  } catch (error) {
    return handleApiError(error);
  }
};
