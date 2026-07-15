export const prerender = false;

import type { APIRoute } from 'astro';
import { sql } from 'drizzle-orm';
import { db } from '../../../lib/db';
import { deals, shops, users } from '../../../lib/db-schema';
import { forbidden, handleApiError, unauthorized } from '../../../lib/errors';

export const GET: APIRoute = async ({ locals }) => {
  try {
    if (!locals.user) throw unauthorized();
    if (locals.user.role !== 'admin') throw forbidden('Admin access required');

    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [shopCount] = await db.select({ count: sql<number>`count(*)` }).from(shops);
    const [dealCount] = await db.select({ count: sql<number>`count(*)` }).from(deals);
    const [activeDealCount] = await db.select({ count: sql<number>`count(*)` }).from(deals).where(sql`${deals.isActive} = 1`);
    const memory = process.memoryUsage();

    return Response.json({
      success: true,
      data: {
        counts: { users: userCount.count, shops: shopCount.count, deals: dealCount.count, activeDeals: activeDealCount.count },
        system: {
          uptime: Math.round(process.uptime()),
          memory: {
            heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
            rss: Math.round(memory.rss / 1024 / 1024),
          },
          nodeVersion: process.version,
          environment: process.env.NODE_ENV,
        },
        errors: { total: 0, last24h: 0, last1h: 0, topErrors: [] },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
