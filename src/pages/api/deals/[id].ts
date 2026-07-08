// src/pages/api/deals/[id].ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { handleApiError } from '../../../lib/errors';
import { json, requireDashboardShop } from '../../../lib/dashboard/server';
import {
  deleteDealForShop,
  getDealForShop,
  setDealActiveForShop,
  updateDealForShop,
} from '../../../server/services/deal.service';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const deal = await getDealForShop(params.id!, shop.id);
    return json({ success: true, data: deal });
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
