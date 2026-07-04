// src/lib/logger.ts

// ─── Log Levels ──────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ─── Log Entry Interface ─────────────────────────────────

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  environment: string;
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  status?: number;
  duration?: number;
  ip?: string;
  userAgent?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

// ─── Configuration ───────────────────────────────────────

const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const SERVICE_NAME = 'dealdoor';
const ENVIRONMENT = process.env.NODE_ENV || 'development';

// ─── Helper Functions ────────────────────────────────────

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

function formatLog(entry: LogEntry): string {
  const { level, timestamp, message, ...rest } = entry;
  const levelStr = level.toUpperCase().padEnd(5);
  
  let log = `[${timestamp}] ${levelStr} ${message}`;
  
  // Add context
  const context = Object.entries(rest)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
    .join(' ');
  
  if (context) {
    log += ` | ${context}`;
  }
  
  return log;
}

function createEntry(
  level: LogLevel,
  message: string,
  context?: Partial<LogEntry>
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: SERVICE_NAME,
    environment: ENVIRONMENT,
    ...context,
  };
}

// ─── Logger Class ────────────────────────────────────────

class Logger {
  private buffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Flush buffer every 5 seconds in production
    if (ENVIRONMENT === 'production') {
      this.flushInterval = setInterval(() => this.flush(), 5000);
    }
  }

  debug(message: string, context?: Partial<LogEntry>) {
    if (!shouldLog('debug')) return;
    const entry = createEntry('debug', message, context);
    this.output(entry);
  }

  info(message: string, context?: Partial<LogEntry>) {
    if (!shouldLog('info')) return;
    const entry = createEntry('info', message, context);
    this.output(entry);
  }

  warn(message: string, context?: Partial<LogEntry>) {
    if (!shouldLog('warn')) return;
    const entry = createEntry('warn', message, context);
    this.output(entry);
  }

  error(message: string, error?: Error, context?: Partial<LogEntry>) {
    if (!shouldLog('error')) return;
    const entry = createEntry('error', message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
    this.output(entry);
  }

  // Request logging helper
  request(
    method: string,
    path: string,
    status: number,
    duration: number,
    context?: Partial<LogEntry>
  ) {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    this[level](`${method} ${path} ${status}`, {
      method,
      path,
      status,
      duration,
      ...context,
    });
  }

  private output(entry: LogEntry) {
    const formatted = formatLog(entry);
    
    switch (entry.level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }

    // Buffer for external services
    if (ENVIRONMENT === 'production') {
      this.buffer.push(entry);
    }
  }

  private flush() {
    if (this.buffer.length === 0) return;
    
    // Send to external logging service (future)
    // this.sendToLogService(this.buffer);
    
    this.buffer = [];
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// ─── Singleton Instance ──────────────────────────────────

export const logger = new Logger();

// ─── Convenience Functions ───────────────────────────────

export function logDebug(message: string, context?: Record<string, any>) {
  logger.debug(message, { metadata: context });
}

export function logInfo(message: string, context?: Record<string, any>) {
  logger.info(message, { metadata: context });
}

export function logWarn(message: string, context?: Record<string, any>) {
  logger.warn(message, { metadata: context });
}

export function logError(message: string, error?: Error, context?: Record<string, any>) {
  logger.error(message, error, { metadata: context });
}
