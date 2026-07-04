# DealDoor — Authentication & Authorization Design

---

## 1. Overview

### MVP Phase
- No authentication required
- Dashboard accessible directly
- Single-merchant assumption (prototype)

### Future Phase
- Email/password authentication
- Session management with cookies
- Role-based access (merchant, admin)

---

## 2. Auth Architecture (Future)

### 2.1 Recommended Library: Lucia Auth

| Feature | Lucia Auth |
|---------|------------|
| Framework | Works with Astro |
| Session | Cookie-based |
| Database | SQLite compatible |
| Size | Lightweight |
| Complexity | Low |

### 2.2 Alternative: Clerk

| Feature | Clerk |
|---------|-------|
| Framework | React/Astro |
| Session | Managed |
| Database | Built-in |
| Size | Heavier |
| Complexity | Low (managed) |

**Recommendation:** Lucia Auth for SQLite integration, keeps everything local.

---

## 3. Database Schema (Future)

### 3.1 Users Table

```typescript
// db/schema.ts (additions)

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').default('merchant'), // merchant | admin
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

### 3.2 Update Merchants Table

```typescript
export const merchants = sqliteTable('merchants', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id), // Link to auth user
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
```

---

## 4. Auth Flow

### 4.1 Registration Flow

```
User visits /register →
  ├── Enter email, password, name
  ├── Validate input
  ├── Check email uniqueness
  ├── Hash password (bcrypt)
  ├── Create user record
  ├── Create merchant record
  ├── Create session
  ├── Set session cookie
  └── Redirect to /dashboard
```

### 4.2 Login Flow

```
User visits /login →
  ├── Enter email, password
  ├── Find user by email
  ├── Verify password (bcrypt)
  ├── Create session
  ├── Set session cookie
  └── Redirect to /dashboard
```

### 4.3 Logout Flow

```
User clicks logout →
  ├── Delete session from DB
  ├── Clear session cookie
  └── Redirect to /
```

### 4.4 Session Validation

```
Request arrives →
  ├── Read session cookie
  ├── Look up session in DB
  ├── Check if session expired
  ├── If valid: attach user to request
  └── If invalid: redirect to /login
```

---

## 5. Implementation

### 5.1 Auth Helper

```typescript
// src/lib/auth.ts

import { Lucia } from 'lucia';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from './db';
import { users, sessions } from '../../db/schema';

const adapter = new DrizzleSQLiteAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: import.meta.env.PROD,
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      name: attributes.name,
      role: attributes.role,
    };
  },
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      email: string;
      name: string;
      role: string;
    };
  }
}
```

### 5.2 Middleware

```typescript
// src/middleware.ts

import { defineMiddleware } from 'astro:middleware';
import { lucia } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const sessionId = context.cookies.get(lucia.sessionCookieName)?.value;

  if (!sessionId) {
    context.locals.user = null;
    context.locals.session = null;
    return next();
  }

  const { session, user } = lucia.validateSession(sessionId);

  if (session && session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id);
    context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  }

  if (!session) {
    const sessionCookie = lucia.createBlankSessionCookie();
    context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  }

  context.locals.user = user;
  context.locals.session = session;
  return next();
});
```

### 5.3 Protected Route Helper

```typescript
// src/lib/auth-guard.ts

import type { APIContext } from 'astro';

export function requireAuth(context: APIContext) {
  if (!context.locals.user) {
    return context.redirect('/login');
  }
  return context.locals.user;
}

export function requireAdmin(context: APIContext) {
  const user = requireAuth(context);
  if (user && user.role !== 'admin') {
    return context.redirect('/dashboard');
  }
  return user;
}
```

---

## 6. Pages

### 6.1 Login Page

```
src/pages/login.astro
```

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { lucia } from '../lib/auth';

// Redirect if already logged in
if (Astro.locals.user) {
  return Astro.redirect('/dashboard');
}

let error = '';

if (Astro.request.method === 'POST') {
  const formData = await Astro.request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validate and authenticate
  // ...
}
---

<BaseLayout title="เข้าสู่ระบบ">
  <div class="flex min-h-screen items-center justify-center">
    <form method="POST" class="w-full max-w-sm space-y-4 rounded-xl border p-6">
      <h1 class="text-xl font-bold">เข้าสู่ระบบ</h1>
      
      {error && (
        <div class="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div>
        <label class="block text-sm font-medium">อีเมล</label>
        <input type="email" name="email" required class="w-full rounded-lg border px-3 py-2" />
      </div>

      <div>
        <label class="block text-sm font-medium">รหัสผ่าน</label>
        <input type="password" name="password" required class="w-full rounded-lg border px-3 py-2" />
      </div>

      <button type="submit" class="w-full rounded-lg bg-primary py-2 text-white">
        เข้าสู่ระบบ
      </button>

      <p class="text-center text-sm text-gray-500">
        ยังไม่มีบัญชี? <a href="/register" class="text-primary">สมัครสมาชิก</a>
      </p>
    </form>
  </div>
</BaseLayout>
```

### 6.2 Register Page

```
src/pages/register.astro
```

### 6.3 Protected Dashboard

```astro
---
// src/pages/dashboard/index.astro
import { requireAuth } from '../../lib/auth-guard';

const user = requireAuth(Astro);
if (user instanceof Response) return user;
---

<!-- Dashboard content -->
```

---

## 7. API Route Protection

```typescript
// src/pages/api/deals/index.ts

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  // Check authentication
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Continue with creating deal
  // ...
};
```

---

## 8. Security Considerations

### 8.1 Password Hashing

```typescript
import { Argon2id } from 'oslo/password';

// Hash password
const passwordHash = await new Argon2id().hash(password);

// Verify password
const valid = await new Argon2id().verify(passwordHash, password);
```

### 8.2 CSRF Protection

```typescript
// Generate CSRF token
function generateCsrfToken(): string {
  return crypto.randomUUID();
}

// Validate CSRF token
function validateCsrfToken(token: string, sessionToken: string): boolean {
  return token === sessionToken;
}
```

### 8.3 Rate Limiting

```typescript
// Login rate limiting
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(email: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(email);

  if (!attempts || now > attempts.resetAt) {
    loginAttempts.set(email, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }

  if (attempts.count >= 5) {
    return false;
  }

  attempts.count++;
  return true;
}
```

---

## 9. MVP Shortcut

For MVP prototype, use a simple token-based approach:

```typescript
// src/lib/auth-mvp.ts

const ADMIN_TOKEN = 'dealdoor-mvp-2025';

export function isAuthenticated(request: Request): boolean {
  const token = request.headers.get('Authorization') || 
                new URL(request.url).searchParams.get('token');
  return token === ADMIN_TOKEN;
}

// In dashboard layout
---
const token = Astro.url.searchParams.get('token');
if (token !== 'dealdoor-mvp-2025') {
  return Astro.redirect('/?error=unauthorized');
}
---
```

---

## 10. Auth Routes Summary

| Route | Method | Description |
|-------|--------|-------------|
| `/login` | GET/POST | Login page |
| `/register` | GET/POST | Registration page |
| `/logout` | POST | Logout action |
| `/forgot-password` | GET/POST | Password reset request |
| `/reset-password` | GET/POST | Password reset form |
| `/api/auth/login` | POST | API login endpoint |
| `/api/auth/register` | POST | API register endpoint |
| `/api/auth/logout` | POST | API logout endpoint |
