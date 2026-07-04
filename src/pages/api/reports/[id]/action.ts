// src/pages/api/reports/[id]/action.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { takeModerationAction, getReportWithDetails } from '../../../../lib/reports';
import { handleApiError, badRequest, notFound } from '../../../../lib/errors';

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // Check if user is admin (for MVP, allow any authenticated user)
    if (!locals.user) {
      throw badRequest('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ');
    }

    const reportId = params.id!;
    const data = await request.json();

    // Validate action
    if (!['remove', 'warn', 'no_action'].includes(data.action)) {
      throw badRequest('INVALID_ACTION', 'การกระทำไม่ถูกต้อง');
    }

    // Get report details
    const report = await getReportWithDetails(reportId);
    if (!report) {
      throw notFound('ไม่พบรายงาน');
    }

    // Take action
    await takeModerationAction({
      reportId,
      action: data.action,
      targetType: report.targetType as 'shop' | 'deal',
      targetId: report.targetId,
      reviewedBy: locals.user.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'ดำเนินการสำเร็จ',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
};
