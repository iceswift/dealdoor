// src/lib/auth.ts

import { db } from './db';
import { runTransaction, transactionWrite } from './db-transaction';
import { isPostgresRuntime } from './db-runtime';
import { users, sessions, merchants, shops } from './db-schema';
import { eq, and, gt } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { hash, verify } from '@node-rs/argon2';
import type { AstroCookies } from 'astro';

const SESSION_COOKIE_NAME = 'dealdoor_session';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

// ─── Password Hashing ────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return verify(hash, password);
}

// ─── Session Management ──────────────────────────────────

export function generateSessionId(): string {
  return createId();
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  return sessionId;
}

export async function validateSession(sessionId: string): Promise<typeof users.$inferSelect | null> {
  const session = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.id, sessionId),
      gt(sessions.expiresAt, new Date())
    ),
    with: {
      user: true,
    },
  });

  if (!session) return null;

  // Refresh session if expiring soon (within 7 days)
  const daysUntilExpiry = (session.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysUntilExpiry < 7) {
    await db.update(sessions)
      .set({ expiresAt: new Date(Date.now() + SESSION_DURATION) })
      .where(eq(sessions.id, sessionId));
  }

  return session.user;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

// ─── Cookie Helpers ──────────────────────────────────────

export function getSessionCookie(cookies: AstroCookies): string | undefined {
  return cookies.get(SESSION_COOKIE_NAME)?.value;
}

function shouldUseSecureCookie(request?: Request): boolean {
  if (process.env.ALLOW_INSECURE) return false;

  if (!request) {
    return process.env.NODE_ENV === 'production';
  }

  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  if (forwardedProto) {
    return forwardedProto === 'https';
  }

  return new URL(request.url).protocol === 'https:';
}

export function setSessionCookie(cookies: AstroCookies, sessionId: string, request?: Request): void {
  const isSecure = shouldUseSecureCookie(request);
  
  cookies.set(SESSION_COOKIE_NAME, sessionId, {
    path: '/',
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
  });
}

export function deleteSessionCookie(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

// ─── Auth Helpers ────────────────────────────────────────

export async function getUserFromRequest(cookies: AstroCookies): Promise<typeof users.$inferSelect | null> {
  const sessionId = getSessionCookie(cookies);
  if (!sessionId) return null;
  return validateSession(sessionId);
}

export async function getMerchantFromUser(userId: string): Promise<typeof merchants.$inferSelect | null> {
  return db.query.merchants.findFirst({
    where: eq(merchants.userId, userId),
  });
}

export async function getMerchantShop(merchantId: string): Promise<typeof shops.$inferSelect | null> {
  return db.query.shops.findFirst({
    where: eq(shops.merchantId, merchantId),
  });
}

// ─── User Registration ───────────────────────────────────

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
}): Promise<{ user: typeof users.$inferSelect; merchant: typeof merchants.$inferSelect }> {
  // Check if email exists
  const existing = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });

  if (existing) {
    throw new Error('อีเมลนี้ถูกใช้แล้ว');
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  const userId = createId();
  const merchantId = createId();
  await runTransaction(db, function* (transaction): Generator<any, any, any> {
    yield transactionWrite(transaction.insert(users).values({
      id: userId,
      email: data.email,
      passwordHash,
      name: data.name,
      role: 'merchant',
    }));
    yield transactionWrite(transaction.insert(merchants).values({
      id: merchantId,
      userId,
      email: data.email,
      name: data.name,
    }));
  }, isPostgresRuntime());

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const merchant = await db.query.merchants.findFirst({ where: eq(merchants.id, merchantId) });

  return { user: user!, merchant: merchant! };
}

// ─── User Login ──────────────────────────────────────────

export async function loginUser(email: string, password: string): Promise<typeof users.$inferSelect> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  }

  return user;
}
