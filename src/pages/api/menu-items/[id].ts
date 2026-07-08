// src/pages/api/menu-items/[id].ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { handleApiError } from '../../../lib/errors';
import { json, requireDashboardShop } from '../../../lib/dashboard/server';
import {
  deleteMenuItemForShop,
  getMenuItemForShop,
  updateMenuItemForShop,
} from '../../../server/services/menu.service';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const item = await getMenuItemForShop(params.id!, shop.id);
    return json({ success: true, data: item });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const item = await updateMenuItemForShop(params.id!, shop.id, await request.json());
    return json({ success: true, data: item });
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    await deleteMenuItemForShop(params.id!, shop.id);
    return json({ success: true, message: 'ลบเมนูสำเร็จ' });
  } catch (error) {
    return handleApiError(error);
  }
};
