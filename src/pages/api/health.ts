// src/pages/api/health.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { db } from '../../lib/db';
import { users } from '../../lib/db-schema';
import { sql } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  const checks: Record<string, { status: string; latency?: number }> = {};
  let overallStatus = 'healthy';

  // Database check
  try {
    const start = Date.now();
    await db.select({ value: sql<number>`1` }).from(users).limit(1);
    checks.database = {
      status: 'healthy',
      latency: Date.now() - start,
    };
  } catch (error) {
    checks.database = { status: 'unhealthy' };
    overallStatus = 'unhealthy';
  }

  // Memory check
  const memUsage = process.memoryUsage();
  const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  checks.memory = {
    status: memUsedMB < 512 ? 'healthy' : 'warning',
    latency: memUsedMB,
  };

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    uptime: Math.round(process.uptime()),
    checks,
  };

  return new Response(JSON.stringify(response), {
    status: overallStatus === 'healthy' ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
};
