// src/pages/api/deals/[id].ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../lib/db';
import { deals, shops } from '../../../lib/db-schema';
import { firstRow } from '../../../lib/db-query';
import { handleApiError, notFound } from '../../../lib/errors';
import { json, requireDashboardShop } from '../../../lib/dashboard/server';
import {
  deleteDealForShop,
  getDealForShop,
  setDealActiveForShop,
  updateDealForShop,
} from '../../../server/services/deal.service';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const row = await firstRow(db
      .select({
        deal: deals,
        shop: shops,
      })
      .from(deals)
      .leftJoin(shops, eq(deals.shopId, shops.id))
      .where(eq(deals.id, params.id!))
      .limit(1));

    if (!row?.deal || !row.shop) {
      throw notFound('ไม่พบดีลนี้');
    }

    return json({
      success: true,
      data: {
        ...row.deal,
        shop: row.shop,
        shopSlug: row.shop.slug,
        shopName: row.shop.name,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const updatedDeal = await updateDealForShop(params.id!, shop.id, await request.json());
    return json({ success: true, data: updatedDeal });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    await setDealActiveForShop(params.id!, shop.id, await request.json());
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    await deleteDealForShop(params.id!, shop.id);
    return json({ success: true, message: 'ลบดีลสำเร็จ' });
  } catch (error) {
    return handleApiError(error);
  }
};
