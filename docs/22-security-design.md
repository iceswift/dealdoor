# DealDoor — Security Design

---

## 1. Overview

Security protects merchants, customers, and the platform from attacks and data breaches.

---

## 2. Threat Model

| Threat | Impact | Likelihood | Mitigation |
|--------|--------|------------|------------|
| XSS | High | Medium | Input sanitization, CSP |
| CSRF | High | Medium | CSRF tokens |
| SQL Injection | High | Low | ORM (Drizzle), parameterized queries |
| Brute Force | Medium | Medium | Rate limiting |
| Data Leak | High | Low | Access control, encryption |
| File Upload Attack | Medium | Medium | File validation, type checking |
| Session Hijacking | High | Low | Secure cookies, HTTPS |

---

## 3. Input Sanitization

### 3.1 HTML Sanitization

```typescript
// src/lib/sanitize.ts

import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
}

export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

### 3.2 Input Validation

```typescript
// src/lib/validations.ts

export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

export function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^0-9-]/g, '');
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}
```

### 3.3 Validation Schema

```typescript
// Using Zod for validation
import { z } from 'zod';

export const shopSchema = z.object({
  name: z.string().min(2).max(50).transform(sanitizeString),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  category: z.enum(['restaurant', 'cafe', 'dessert', 'beauty', 'clinic', 'retail', 'service', 'other']),
  description: z.string().max(500).optional().transform(v => v ? sanitizeString(v) : undefined),
  phone: z.string().regex(/^[0-9-]{9,12}$/).optional(),
  lineId: z.string().max(30).optional(),
  facebookUrl: z.string().url().optional().transform(v => v ? sanitizeUrl(v) : undefined),
  instagramUrl: z.string().url().optional().transform(v => v ? sanitizeUrl(v) : undefined),
  websiteUrl: z.string().url().optional().transform(v => v ? sanitizeUrl(v) : undefined),
});

export const dealSchema = z.object({
  title: z.string().min(2).max(100).transform(sanitizeString),
  category: z.enum(['birthday', 'monthly', 'festival', 'special_day', 'senior', 'kids', 'student', 'flash', 'custom']),
  description: z.string().max(1000).optional().transform(v => v ? sanitizeString(v) : undefined),
  shortDescription: z.string().max(200).optional(),
  discountText: z.string().max(100).transform(sanitizeString),
  conditions: z.string().max(500).optional(),
  couponCode: z.string().regex(/^[A-Z0-9-]*$/).max(30).optional(),
  endDate: z.string().datetime(),
});
```

---

## 4. XSS Prevention

### 4.1 Content Security Policy

```typescript
// src/middleware.ts

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  
  response.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://plausible.io",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://plausible.io",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; '));
  
  return response;
});
```

### 4.2 Security Headers

```typescript
// Additional security headers

response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-XSS-Protection', '1; mode=block');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
```

---

## 5. CSRF Protection

### 5.1 Token Generation

```typescript
// src/lib/csrf.ts

import { randomBytes } from 'crypto';

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

export function validateCsrfToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false;
  return token === sessionToken;
}
```

### 5.2 Middleware

```typescript
// CSRF middleware for form submissions

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.request.method === 'POST') {
    const contentType = context.request.headers.get('content-type');
    
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await context.request.clone().formData();
      const token = formData.get('_csrf') as string;
      const sessionToken = context.cookies.get('csrf_token')?.value;
      
      if (!validateCsrfToken(token, sessionToken || '')) {
        return new Response('CSRF validation failed', { status: 403 });
      }
    }
  }
  
  return next();
});
```

### 5.3 Form Usage

```astro
---
const csrfToken = generateCsrfToken();
Astro.cookies.set('csrf_token', csrfToken, { httpOnly: true, secure: true });
---

<form method="POST">
  <input type="hidden" name="_csrf" value={csrfToken} />
  <!-- form fields -->
  <button type="submit">Submit</button>
</form>
```

---

## 6. Rate Limiting

### 6.1 Implementation

```typescript
// src/lib/rate-limit.ts

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Max requests per window
}

export function rateLimit(options: RateLimitOptions) {
  return (key: string): { success: boolean; remaining: number } => {
    const now = Date.now();
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + options.windowMs });
      return { success: true, remaining: options.max - 1 };
    }
    
    if (record.count >= options.max) {
      return { success: false, remaining: 0 };
    }
    
    record.count++;
    return { success: true, remaining: options.max - record.count };
  };
}

// Predefined limiters
export const apiLimiter = rateLimit({ windowMs: 60000, max: 100 });      // 100 req/min
export const authLimiter = rateLimit({ windowMs: 900000, max: 5 });       // 5 req/15min
export const uploadLimiter = rateLimit({ windowMs: 60000, max: 10 });     // 10 req/min
```

### 6.2 Usage in API Routes

```typescript
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const limiter = apiLimiter(clientAddress);
  
  if (!limiter.success) {
    return new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }
  
  // Handle request
};
```

---

## 7. File Upload Security

### 7.1 File Type Validation

```typescript
// src/lib/upload-security.ts

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
};

const MAX_SIZES = {
  cover: 2 * 1024 * 1024,    // 2MB
  logo: 500 * 1024,           // 500KB
  deal: 1 * 1024 * 1024,     // 1MB
  menu: 500 * 1024,           // 500KB
};

export function validateFile(
  file: File,
  type: keyof typeof MAX_SIZES
): { valid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_TYPES.image.includes(file.type)) {
    return { valid: false, error: 'ประเภทไฟล์ไม่ถูกต้อง' };
  }
  
  // Check file size
  if (file.size > MAX_SIZES[type]) {
    return { valid: false, error: `ไฟล์ใหญ่เกินไป (สูงสุด ${MAX_SIZES[type] / 1024 / 1024}MB)` };
  }
  
  // Check file extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) {
    return { valid: false, error: 'นามสกุลไฟล์ไม่ถูกต้อง' };
  }
  
  return { valid: true };
}
```

### 7.2 File Name Sanitization

```typescript
import { randomUUID } from 'crypto';

export function sanitizeFileName(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const safeName = randomUUID();
  return `${safeName}.${ext}`;
}
```

### 7.3 Upload Handler

```typescript
export async function handleUpload(file: File, type: string): Promise<string> {
  // Validate
  const validation = validateFile(file, type as keyof typeof MAX_SIZES);
  if (!validation.valid) {
    throw new ApiError(400, 'INVALID_FILE', validation.error!);
  }
  
  // Sanitize filename
  const fileName = sanitizeFileName(file.name);
  
  // Save file
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadPath = join(process.cwd(), 'public', 'uploads', type, fileName);
  
  await writeFile(uploadPath, buffer);
  
  return `/uploads/${type}/${fileName}`;
}
```

---

## 8. SQL Injection Prevention

### 8.1 Drizzle ORM (Already Safe)

```typescript
// Drizzle uses parameterized queries by default

const shop = await db.query.shops.findFirst({
  where: eq(shops.slug, slug),  // Safe: parameterized query
});

// NEVER do this:
// db.run(`SELECT * FROM shops WHERE slug = '${slug}'`);  // UNSAFE!
```

### 8.2 Raw SQL (If Needed)

```typescript
// Use parameterized queries
db.run(sql`SELECT * FROM shops WHERE slug = ${slug}`);

// NEVER concatenate user input
// db.run(`SELECT * FROM shops WHERE slug = '${slug}'`);  // SQL INJECTION!
```

---

## 9. Authentication Security

### 9.1 Password Hashing

```typescript
import { Argon2id } from 'oslo/password';

// Hash password (registration)
const passwordHash = await new Argon2id().hash(password);

// Verify password (login)
const valid = await new Argon2id().verify(passwordHash, inputPassword);
```

### 9.2 Session Security

```typescript
// Secure cookie settings
{
  httpOnly: true,      // Not accessible via JavaScript
  secure: true,        // HTTPS only
  sameSite: 'lax',    // CSRF protection
  maxAge: 60 * 60 * 24 * 30,  // 30 days
  path: '/',
}
```

---

## 10. HTTPS & TLS

### 10.1 Force HTTPS

```nginx
# Nginx configuration

server {
    listen 80;
    server_name dealdoor.co;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    # SSL configuration
}
```

### 10.2 HSTS Header

```typescript
response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
```

---

## 11. Dependency Security

### 11.1 Audit Script

```json
{
  "scripts": {
    "audit": "pnpm audit",
    "audit:fix": "pnpm audit --fix"
  }
}
```

### 11.2 Dependabot

```yaml
# .github/dependabot.yml

version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

---

## 12. Logging & Monitoring

### 12.1 Security Event Logging

```typescript
// src/lib/security-logger.ts

export function logSecurityEvent(event: {
  type: 'auth_failure' | 'rate_limit' | 'invalid_input' | 'suspicious_activity';
  ip: string;
  path: string;
  details?: string;
}) {
  console.warn(`[SECURITY] ${event.type}`, {
    ip: event.ip,
    path: event.path,
    details: event.details,
    timestamp: new Date().toISOString(),
  });
  
  // Send to monitoring service
  // sendToSentry(event);
}
```

---

## 13. Security Checklist

### Application
- [ ] Input validation on all user inputs
- [ ] Output encoding/escaping
- [ ] CSP headers configured
- [ ] CSRF protection on forms
- [ ] XSS prevention

### Authentication
- [ ] Password hashing (Argon2id)
- [ ] Secure session cookies
- [ ] Rate limiting on login
- [ ] Session expiration

### File Upload
- [ ] File type validation
- [ ] File size limits
- [ ] Sanitized filenames
- [ ] Stored outside webroot (or with proper permissions)

### API
- [ ] Rate limiting
- [ ] Input validation (Zod)
- [ ] Error handling (no stack traces in production)

### Infrastructure
- [ ] HTTPS everywhere
- [ ] HSTS enabled
- [ ] Security headers
- [ ] Dependency scanning
- [ ] Regular backups

---

## 14. File Structure

```
src/
├── lib/
│   ├── sanitize.ts        # Input sanitization
│   ├── validations.ts     # Validation schemas
│   ├── csrf.ts            # CSRF protection
│   ├── rate-limit.ts      # Rate limiting
│   ├── upload-security.ts # File upload security
│   └── security-logger.ts # Security event logging
└── middleware.ts           # Security headers, CSP
```
