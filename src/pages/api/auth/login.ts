// src/pages/api/auth/login.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { loginUser, createSession, setSessionCookie } from '../../../lib/auth';
import { handleApiError, badRequest } from '../../../lib/errors';
import { loginSchema, validateInput } from '../../../lib/validations';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const rawData = await request.json();

    // Validate with Zod
    const validation = validateInput(loginSchema, rawData);
    if (!validation.success) {
      throw badRequest('VALIDATION_ERROR', 'ข้อมูลไม่ถูกต้อง', validation.errors);
    }

    const data = validation.data!;

    // Login
    const user = await loginUser(data.email, data.password);

    // Create session
    const sessionId = await createSession(user.id);
    setSessionCookie(cookies, sessionId, request);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    if (error.message === 'อีเมลหรือรหัสผ่านไม่ถูกต้อง') {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'INVALID_CREDENTIALS', message: error.message } }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return handleApiError(error);
  }
};

