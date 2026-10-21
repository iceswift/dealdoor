// src/middleware.ts

import { defineMiddleware } from 'astro:middleware';
import { getUserFromRequest } from './lib/auth';
import { getSecurityHeaders, getClientIp, apiLimiter, authLimiter } from './lib/security';
import { getLangFromRequest, getLocalizedPath, LOCALE_COOKIE, stripLocalePrefix } from './i18n';
import { isDemoAdminWriteBlocked } from './lib/demo';

export const onRequest = defineMiddleware(async (context, next) => {
  const clientIp = getClientIp(context.request, context.clientAddress);
  const method = context.request.method;
  const requestedPath = context.url.pathname;
  const language = getLangFromRequest(context.request);
  const path = stripLocalePrefix(requestedPath);
  const requestId = crypto.randomUUID();

  context.locals.language = language;

  // Public localized URLs are rendered by the existing routes. The rewrite keeps
  // the visible /en/... URL while allowing Phase 2 to translate routes gradually.
  const needsLocaleRewrite = requestedPath !== path && !path.startsWith('/api/');
  if (needsLocaleRewrite) {
    context.cookies.set(LOCALE_COOKIE, language, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
  }

  // Rate-limit each endpoint independently. A busy dashboard request must not
  // consume the budget for saving special hours or another unrelated action.
  // The notification stream is a long-lived connection, so it has no request
  // burst to throttle after its initial connection.
  if (path.startsWith('/api/') && path !== '/api/notifications/stream') {
    const { allowed, remaining, resetAt } = apiLimiter(clientIp, path);
    
    if (!allowed) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: { 
            code: 'RATE_LIMITED', 
            message: 'คุณส่งคำขอมากเกินไป กรุณาลองใหม่ภายหลัง' 
          } 
        }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
          } 
        }
      );
    }
  }
  
  // Stricter rate limiting for auth routes
  if (path.startsWith('/api/auth/')) {
    const { allowed, remaining, resetAt } = authLimiter(clientIp);
    
    if (!allowed) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: { 
            code: 'RATE_LIMITED', 
            message: 'คุณพยายามเข้าสู่ระบบมากเกินไป กรุณาลองใหม่ภายหลัง' 
          } 
        }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
          } 
        }
      );
    }
  }

  // Get user from session (with error handling)
  let user = null;
  try {
    user = await getUserFromRequest(context.cookies);
  } catch (error) {
    console.error('Auth error:', error);
    // Continue without user if auth fails
  }
  context.locals.user = user;

  if (isDemoAdminWriteBlocked(process.env.DEMO_MODE === 'true', user?.role, method, path)) {
    return new Response(JSON.stringify({ success: false, error: { code: 'DEMO_READ_ONLY', message: 'Demo admin is read-only.' } }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Protect dashboard routes
  if (path.startsWith('/dashboard')) {
    if (!user) {
      return context.redirect('/auth/login?redirect=' + encodeURIComponent(getLocalizedPath(path, language)));
    }
    if (user.role === 'admin') {
      return context.redirect('/admin/moderation');
    }
  }

  // Protect admin routes (require admin role)
  if (path.startsWith('/admin')) {
    if (!user) {
      return context.redirect('/auth/login?redirect=' + encodeURIComponent(getLocalizedPath(path, language)));
    }
    if (user.role !== 'admin') {
      return context.redirect('/dashboard');
    }
  }

  // Protect dashboard API routes
  if (path.startsWith('/api/shops') || path.startsWith('/api/deals')) {
    if (method !== 'GET' && !user) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'กรุณาเข้าสู่ระบบ' } }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Process request
  let response: Response;
  try {
    if (needsLocaleRewrite) {
      const internalUrl = new URL(context.request.url);
      internalUrl.pathname = path;
      const headers = new Headers(context.request.headers);
      headers.set('x-dealdoor-locale', language);
      response = await context.rewrite(new Request(internalUrl, { method, headers }));
    } else {
      response = await next();
    }
  } catch (error) {
    console.error('Request error:', error);
    // Return a proper error response instead of throwing
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'เกิดข้อผิดพลาด' 
        } 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
  
  // Add security headers
  const securityHeaders = getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add request ID header
  response.headers.set('X-Request-Id', requestId);
  
  // Add rate limit headers for API routes
  if (path.startsWith('/api/')) {
    const { remaining } = apiLimiter(clientIp);
    response.headers.set('X-RateLimit-Remaining', String(remaining));
  }

  return response;
});
