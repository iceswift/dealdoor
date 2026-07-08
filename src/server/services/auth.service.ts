import type { AstroCookies } from 'astro';
import {
  createSession,
  createUser,
  deleteSession,
  deleteSessionCookie,
  getSessionCookie,
  loginUser,
  setSessionCookie,
} from '../../lib/auth';
import { ApiError, badRequest, conflict } from '../../lib/errors';
import { loginSchema, registerSchema, validateInput } from '../../lib/validations';

type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: string | null;
};

function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  role?: string | null;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role ?? null,
  };
}

function invalidCredentials() {
  return new ApiError(401, 'INVALID_CREDENTIALS', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
}

export async function loginWithPassword(rawData: unknown, cookies: AstroCookies, request: Request) {
  const validation = validateInput(loginSchema, rawData);
  if (!validation.success) {
    throw badRequest('VALIDATION_ERROR', 'ข้อมูลไม่ถูกต้อง', validation.errors);
  }

  const data = validation.data!;

  try {
    const user = await loginUser(data.email, data.password);
    const sessionId = await createSession(user.id);
    setSessionCookie(cookies, sessionId, request);
    return toPublicUser(user);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw invalidCredentials();
  }
}

export async function registerMerchant(rawData: unknown, cookies: AstroCookies, request: Request) {
  const validation = validateInput(registerSchema, rawData);
  if (!validation.success) {
    throw badRequest('VALIDATION_ERROR', 'ข้อมูลไม่ถูกต้อง', validation.errors);
  }

  const data = validation.data!;

  try {
    const { user } = await createUser({
      email: data.email,
      password: data.password,
      name: data.name,
    });

    const sessionId = await createSession(user.id);
    setSessionCookie(cookies, sessionId, request);
    return toPublicUser(user);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw conflict('EMAIL_EXISTS', 'อีเมลนี้ถูกใช้แล้ว');
  }
}

export async function logoutCurrentSession(cookies: AstroCookies) {
  const sessionId = getSessionCookie(cookies);

  if (sessionId) {
    await deleteSession(sessionId);
  }

  deleteSessionCookie(cookies);
}
