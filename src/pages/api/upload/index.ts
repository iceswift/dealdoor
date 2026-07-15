// src/pages/api/upload/index.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { validateUpload, saveImage, type UploadType } from '../../../lib/upload';
import { handleApiError, badRequest, unauthorized } from '../../../lib/errors';
import { requireDashboardShop } from '../../../lib/dashboard/server';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.user) throw unauthorized();
    await requireDashboardShop(locals.user);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = (formData.get('type') as UploadType) || 'deal';

    if (!file) {
      throw badRequest('NO_FILE', 'กรุณาเลือกไฟล์');
    }

    // Validate file
    const validation = validateUpload(file, type);
    if (!validation.valid) {
      throw badRequest('INVALID_FILE', validation.error!);
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save image
    const url = await saveImage(buffer, type);

    return new Response(
      JSON.stringify({
        success: true,
        data: { url },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
};
