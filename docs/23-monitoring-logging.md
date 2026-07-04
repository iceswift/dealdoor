# DealDoor — Monitoring & Logging Design

---

## 1. Overview

Monitoring and logging help detect issues, track performance, and debug problems in production.

---

## 2. Monitoring Stack

| Tool | Purpose | Cost |
|------|---------|------|
| Plausible | Privacy-friendly analytics | Free / €9/mo |
| UptimeRobot | Uptime monitoring | Free |
| Sentry | Error tracking | Free tier |
| Better Stack | Logs & status page | Free tier |

---

## 3. Health Check Endpoint

### 3.1 Health Check Route

```typescript
// src/pages/api/health.ts

import type { APIRoute } from 'astro';
import { db } from '../../lib/db';
import { sql } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  const checks: Record<string, { status: string; latency?: number }> = {};
  let overallStatus = 'healthy';
  
  // Database check
  try {
    const start = Date.now();
    await db.run(sql`SELECT 1`);
    checks.database = {
      status: 'healthy',
      latency: Date.now() - start,
    };
  } catch (error) {
    checks.database = { status: 'unhealthy' };
    overallStatus = 'unhealthy';
  }
  
  // Disk check
  try {
    const stats = await import('fs/promises').then(fs => fs.statfs('/app/db'));
    const freeSpaceGB = (stats.bavail * stats.bsize) / 1024 / 1024 / 1024;
    checks.disk = {
      status: freeSpaceGB > 1 ? 'healthy' : 'warning',
    };
  } catch {
    checks.disk = { status: 'unknown' };
  }
  
  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    uptime: process.uptime(),
    checks,
  };
  
  return new Response(JSON.stringify(response), {
    status: overallStatus === 'healthy' ? 200 : 503,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

### 3.2 Simple Health Check

```typescript
// src/pages/api/ping.ts

export const GET: APIRoute = () => {
  return new Response('pong', { status: 200 });
};
```

---

## 4. Logging

### 4.1 Logger Implementation

```typescript
// src/lib/logger.ts

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

function formatLog(entry: LogEntry): string {
  const { level, message, timestamp, context, error } = entry;
  
  let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  if (context) {
    log += ` ${JSON.stringify(context)}`;
  }
  
  if (error) {
    log += `\n${error.stack}`;
  }
  
  return log;
}

export const logger = {
  debug(message: string, context?: Record<string, any>) {
    if (!shouldLog('debug')) return;
    const entry: LogEntry = {
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      context,
    };
    console.debug(formatLog(entry));
  },
  
  info(message: string, context?: Record<string, any>) {
    if (!shouldLog('info')) return;
    const entry: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      context,
    };
    console.log(formatLog(entry));
  },
  
  warn(message: string, context?: Record<string, any>) {
    if (!shouldLog('warn')) return;
    const entry: LogEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      context,
    };
    console.warn(formatLog(entry));
  },
  
  error(message: string, error?: Error, context?: Record<string, any>) {
    if (!shouldLog('error')) return;
    const entry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };
    console.error(formatLog(entry));
    
    // Send to error tracking service
    // captureError(error, context);
  },
};
```

### 4.2 Request Logging Middleware

```typescript
// src/middleware.ts

import { logger } from './lib/logger';

export const onRequest = defineMiddleware(async (context, next) => {
  const start = Date.now();
  const { method, url } = context.request;
  const path = new URL(url).pathname;
  
  try {
    const response = await next();
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method,
      path,
      status: response.status,
      duration,
      ip: context.clientAddress,
    });
    
    // Add timing header
    response.headers.set('X-Response-Time', `${duration}ms`);
    
    return response;
  } catch (error) {
    const duration = Date.now() - start;
    
    logger.error('Request failed', error as Error, {
      method,
      path,
      duration,
      ip: context.clientAddress,
    });
    
    throw error;
  }
});
```

---

## 5. Error Tracking (Sentry)

### 5.1 Sentry Setup

```typescript
// src/lib/sentry.ts

import * as Sentry from '@sentry/astro';

export function initSentry() {
  Sentry.init({
    dsn: import.meta.env.SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1, // 10% of transactions
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay(),
    ],
  });
}

export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}
```

### 5.2 Error Boundary

```tsx
// src/components/shared/ErrorBoundary.tsx

import { Component, type ReactNode } from 'react';
import { captureError } from '../../lib/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureError(error, { componentStack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">เกิดข้อผิดพลาด กรุณาลองใหม่</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 6. Uptime Monitoring

### 6.1 UptimeRobot Configuration

| Monitor | URL | Interval | Alert |
|---------|-----|----------|-------|
| Main site | `https://dealdoor.co/api/ping` | 5 min | Email, LINE |
| Shop page | `https://dealdoor.co/moon-bowl-cafe` | 15 min | Email |
| API | `https://dealdoor.co/api/health` | 5 min | Email, LINE |

### 6.2 Custom Uptime Check

```typescript
// scripts/uptime-check.ts

async function checkUptime() {
  const endpoints = [
    { name: 'Main', url: 'https://dealdoor.co/' },
    { name: 'API Health', url: 'https://dealdoor.co/api/health' },
    { name: 'Shop Page', url: 'https://dealdoor.co/moon-bowl-cafe' },
  ];

  for (const endpoint of endpoints) {
    try {
      const start = Date.now();
      const response = await fetch(endpoint.url);
      const duration = Date.now() - start;

      console.log(`✅ ${endpoint.name}: ${response.status} (${duration}ms)`);

      if (response.status !== 200) {
        await sendAlert(`${endpoint.name} returned ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ ${endpoint.name}: ${error.message}`);
      await sendAlert(`${endpoint.name} is down: ${error.message}`);
    }
  }
}
```

---

## 7. Performance Monitoring

### 7.1 Core Web Vitals

```typescript
// src/lib/web-vitals.ts

import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

type Metric = {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
};

function sendMetric(metric: Metric) {
  // Send to analytics
  if (window.plausible) {
    plausible('Web Vitals', { props: metric });
  }
}

export function initWebVitals() {
  onCLS(sendMetric);
  onFID(sendMetric);
  onLCP(sendMetric);
  onFCP(sendMetric);
  onTTFB(sendMetric);
}
```

### 7.2 Server-Side Timing

```typescript
// Track database query performance

export async function trackQuery<T>(
  name: string,
  query: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  
  try {
    const result = await query();
    const duration = Date.now() - start;
    
    if (duration > 100) {
      logger.warn('Slow query', { name, duration });
    }
    
    return result;
  } catch (error) {
    logger.error('Query failed', error as Error, { name });
    throw error;
  }
}
```

---

## 8. Business Metrics

### 8.1 Metrics to Track

| Metric | Description | Source |
|--------|-------------|--------|
| Daily active shops | Shops with activity in 24h | Database |
| New signups | New merchants per day | Database |
| Deals created | New deals per day | Database |
| Page views | Total page views | Analytics |
| Deal clicks | Total deal interactions | Analytics |
| Error rate | Errors per hour | Sentry |
| Response time | P95 response time | Logs |

### 8.2 Metrics Dashboard

```typescript
// src/lib/metrics.ts

export async function getDailyMetrics(date: string) {
  const shops = await db.select({
    count: sql<number>`count(distinct ${analyticsEvents.shopId})`,
  })
  .from(analyticsEvents)
  .where(sql`date(${analyticsEvents.createdAt}) = ${date}`);

  const deals = await db.select({
    count: sql<number>`count(*)`,
  })
  .from(deals)
  .where(sql`date(${deals.createdAt}) = ${date}`);

  return {
    date,
    activeShops: shops[0]?.count || 0,
    newDeals: deals[0]?.count || 0,
  };
}
```

---

## 9. Alerting

### 9.1 Alert Rules

| Condition | Severity | Channel |
|-----------|----------|---------|
| Site down | Critical | Email, LINE, SMS |
| Error rate > 5% | High | Email, LINE |
| Response time > 2s | Medium | Email |
| Disk space < 1GB | Medium | Email |
| Failed login attempts > 10 | Medium | Email |

### 9.2 Alert Implementation

```typescript
// src/lib/alerts.ts

import { logger } from './logger';

interface Alert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  context?: Record<string, any>;
}

export async function sendAlert(alert: Alert) {
  logger.warn('Alert triggered', alert);
  
  // Send to LINE webhook
  if (process.env.LINE_WEBHOOK_URL) {
    await fetch(process.env.LINE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `[${alert.severity.toUpperCase()}] ${alert.message}`,
      }),
    });
  }
  
  // Send to email (future)
  // await sendEmail(alert);
}
```

---

## 10. Log Aggregation

### 10.1 Structured Logging

```typescript
// All logs follow this structure

interface StructuredLog {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  service: 'dealdoor';
  environment: string;
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  status?: number;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}
```

### 10.2 Log Collection (Better Stack)

```typescript
// Send logs to Better Stack (formerly Logtail)

export function sendToLogtail(log: StructuredLog) {
  if (!process.env.LOGTAIL_TOKEN) return;
  
  fetch('https://in.logtail.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LOGTAIL_TOKEN}`,
    },
    body: JSON.stringify(log),
  }).catch(() => {}); // Fire and forget
}
```

---

## 11. Dashboard

### 11.1 Status Page

```typescript
// src/pages/status.astro

import { db } from '../lib/db';
import { sql } from 'drizzle-astro';

const healthCheck = await fetch(`${Astro.site}api/health`);
const health = await healthCheck.json();

const uptime24h = await getUptime(24);
const uptime7d = await getUptime(168);
---

<html>
  <body>
    <h1>DealDoor Status</h1>
    <div>Status: {health.status}</div>
    <div>Uptime 24h: {uptime24h}%</div>
    <div>Uptime 7d: {uptime7d}%</div>
  </body>
</html>
```

---

## 12. File Structure

```
src/
├── lib/
│   ├── logger.ts           # Logging utility
│   ├── sentry.ts           # Error tracking
│   ├── metrics.ts          # Business metrics
│   ├── alerts.ts           # Alert system
│   └── web-vitals.ts       # Performance monitoring
├── components/
│   └── shared/
│       └── ErrorBoundary.tsx
└── pages/
    ├── api/
    │   ├── health.ts
    │   └── ping.ts
    └── status.astro

scripts/
└── uptime-check.ts
```

---

## 13. Monitoring Checklist

### Infrastructure
- [ ] Health check endpoint
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Error tracking (Sentry)
- [ ] Log aggregation

### Application
- [ ] Request logging
- [ ] Error logging
- [ ] Performance monitoring
- [ ] Business metrics

### Alerting
- [ ] Site down alerts
- [ ] Error rate alerts
- [ ] Performance alerts
- [ ] Security alerts

### Dashboard
- [ ] Status page
- [ ] Metrics dashboard
- [ ] Log viewer
