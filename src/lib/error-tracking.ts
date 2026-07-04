// src/lib/error-tracking.ts

import { logger } from './logger';

// ─── Error Tracking Configuration ────────────────────────

interface ErrorContext {
  userId?: string;
  shopId?: string;
  path?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

// ─── Error Tracking Class ────────────────────────────────

class ErrorTracker {
  private errors: Array<{
    error: Error;
    context: ErrorContext;
    timestamp: Date;
    count: number;
  }> = [];
  
  private maxErrors = 1000;

  // Track an error
  track(error: Error, context: ErrorContext = {}) {
    // Check for duplicate errors
    const existing = this.errors.find(
      e => e.error.message === error.message && 
           e.error.stack === error.stack
    );

    if (existing) {
      existing.count++;
      existing.timestamp = new Date();
    } else {
      this.errors.push({
        error,
        context,
        timestamp: new Date(),
        count: 1,
      });

      // Trim old errors
      if (this.errors.length > this.maxErrors) {
        this.errors = this.errors.slice(-this.maxErrors);
      }
    }

    // Log the error
    logger.error(error.message, error, {
      userId: context.userId,
      path: context.path,
      method: context.method,
      metadata: {
        ...context.metadata,
        errorCount: existing ? existing.count : 1,
      },
    });

    // Send to external error tracking service (future)
    // this.sendToSentry(error, context);
  }

  // Get recent errors
  getRecentErrors(limit: number = 50) {
    return this.errors
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
      .map(({ error, context, timestamp, count }) => ({
        message: error.message,
        stack: error.stack,
        context,
        timestamp,
        count,
      }));
  }

  // Get error stats
  getStats() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last1h = new Date(now.getTime() - 60 * 60 * 1000);

    const recent24h = this.errors.filter(e => e.timestamp >= last24h);
    const recent1h = this.errors.filter(e => e.timestamp >= last1h);

    return {
      total: this.errors.length,
      last24h: recent24h.length,
      last1h: recent1h.length,
      topErrors: this.getTopErrors(5),
    };
  }

  // Get most frequent errors
  private getTopErrors(limit: number) {
    const errorCounts = new Map<string, { message: string; count: number }>();

    this.errors.forEach(({ error, count }) => {
      const existing = errorCounts.get(error.message);
      if (existing) {
        existing.count += count;
      } else {
        errorCounts.set(error.message, { message: error.message, count });
      }
    });

    return Array.from(errorCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // Clear old errors
  cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000) {
    const cutoff = new Date(Date.now() - maxAge);
    this.errors = this.errors.filter(e => e.timestamp >= cutoff);
  }
}

// ─── Singleton Instance ──────────────────────────────────

export const errorTracker = new ErrorTracker();

// ─── Error Handler Helper ────────────────────────────────

export function trackError(error: unknown, context: ErrorContext = {}) {
  if (error instanceof Error) {
    errorTracker.track(error, context);
  } else {
    errorTracker.track(new Error(String(error)), context);
  }
}

// ─── API Error Response ──────────────────────────────────

export function createErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: any
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
