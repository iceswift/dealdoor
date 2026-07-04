// src/pages/api/admin/stats.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { users, shops, deals } from '../../../../db/schema';
import { sql } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    // Get counts
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [shopCount] = await db.select({ count: sql<number>`count(*)` }).from(shops);
    const [dealCount] = await db.select({ count: sql<number>`count(*)` }).from(deals);
    const [activeDealCount] = await db.select({ count: sql<number>`count(*)` }).from(deals).where(sql`${deals.isActive} = 1`);

    // Get system info
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          counts: {
            users: userCount.count,
            shops: shopCount.count,
            deals: dealCount.count,
            activeDeals: activeDealCount.count,
          },
          system: {
            uptime: Math.round(uptime),
            memory: {
              heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
              heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
              rss: Math.round(memUsage.rss / 1024 / 1024),
            },
            nodeVersion: process.version,
            environment: process.env.NODE_ENV,
          },
          errors: {
            total: 0,
            last24h: 0,
            last1h: 0,
            topErrors: [],
          },
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Admin stats error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'เกิดข้อผิดพลาด' 
        } 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
