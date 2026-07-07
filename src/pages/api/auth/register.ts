// src/pages/api/auth/register.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { createUser, createSession, setSessionCookie } from '../../../lib/auth';
import { handleApiError, badRequest } from '../../../lib/errors';
import { registerSchema, validateInput } from '../../../lib/validations';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const rawData = await request.json();

    // Validate with Zod
    const validation = validateInput(registerSchema, rawData);
    if (!validation.success) {
      throw badRequest('VALIDATION_ERROR', 'ข้อมูลไม่ถูกต้อง', validation.errors);
    }

    const data = validation.data!;

    // Create user
    const { user } = await createUser({
      email: data.email,
      password: data.password,
      name: data.name,
    });

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
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    if (error.message === 'อีเมลนี้ถูกใช้แล้ว') {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'EMAIL_EXISTS', message: error.message } }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return handleApiError(error);
  }
};

