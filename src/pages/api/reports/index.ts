// src/pages/api/reports/index.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { createReport, getReports, getReportStats } from '../../../lib/reports';
import { handleApiError, badRequest } from '../../../lib/errors';
import { reportSchema, validateInput } from '../../../lib/validations';

export const GET: APIRoute = async ({ url }) => {
  try {
    const status = url.searchParams.get('status') || undefined;
    const targetType = url.searchParams.get('targetType') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const reportsList = await getReports({ status, targetType, limit });
    const stats = await getReportStats();

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          reports: reportsList,
          stats,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const rawData = await request.json();

    // Validate with Zod
    const validation = validateInput(reportSchema, rawData);
    if (!validation.success) {
      throw badRequest('VALIDATION_ERROR', 'ข้อมูลไม่ถูกต้อง', validation.errors);
    }

    const data = validation.data!;

    // Create report
    const reportId = await createReport({
      reporterId: locals.user?.id,
      targetType: data.targetType,
      targetId: data.targetId,
      reason: data.reason as any,
      description: data.description,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: { id: reportId },
        message: 'รายงานสำเร็จ ขอบคุณสำหรับการแจ้งเตือน',
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    if (error.message === 'คุณได้รายงานรายการนี้แล้ว') {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'DUPLICATE', message: error.message } }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return handleApiError(error);
  }
};
