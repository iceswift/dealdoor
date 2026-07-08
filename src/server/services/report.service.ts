import { createId } from '@paralleldrive/cuid2';
import { and, desc, eq, sql } from 'drizzle-orm';
import { deals, reports, shops } from '../../../db/schema';
import { db } from '../../lib/db';
import { badRequest, conflict, notFound } from '../../lib/errors';
import { reportSchema, validateInput } from '../../lib/validations';

export const REPORT_REASONS = {
  spam: { label: 'สแปม', description: 'เนื้อหาซ้ำ หรือไม่เกี่ยวข้อง' },
  fake: { label: 'ข้อมูลเท็จ', description: 'ดีลหรือข้อมูลร้านไม่จริง' },
  offensive: { label: 'เนื้อหาไม่เหมาะสม', description: 'คำหยาบ หรือเนื้อหาล่วงละเมิด' },
  scam: { label: 'หลอกลวง', description: 'ดูเหมือนการหลอกลวง' },
  expired: { label: 'หมดอายุ', description: 'ดีลหมดอายุแล้วแต่ยังแสดงอยู่' },
  incorrect: { label: 'ข้อมูลผิด', description: 'ข้อมูลไม่ถูกต้อง' },
  other: { label: 'อื่นๆ', description: 'เหตุผลอื่น' },
} as const;

export type ReportReason = keyof typeof REPORT_REASONS;
export type ModerationAction = 'remove' | 'warn' | 'no_action';

export async function createReport(params: {
  reporterId?: string;
  targetType: 'shop' | 'deal';
  targetId: string;
  reason: ReportReason;
  description?: string;
}): Promise<string> {
  const existing = await db.query.reports.findFirst({
    where: and(
      eq(reports.targetType, params.targetType),
      eq(reports.targetId, params.targetId),
      eq(reports.reason, params.reason),
      eq(reports.status, 'pending')
    ),
  });

  if (existing) {
    throw conflict('DUPLICATE', 'คุณได้รายงานรายการนี้แล้ว');
  }

  const id = createId();

  await db.insert(reports).values({
    id,
    reporterId: params.reporterId || null,
    targetType: params.targetType,
    targetId: params.targetId,
    reason: params.reason,
    description: params.description || null,
    status: 'pending',
  });

  return id;
}

export async function createReportFromRequest(rawData: unknown, reporterId?: string) {
  const validation = validateInput(reportSchema, rawData);
  if (!validation.success) {
    throw badRequest('VALIDATION_ERROR', 'ข้อมูลไม่ถูกต้อง', validation.errors);
  }

  const data = validation.data!;
  const id = await createReport({
    reporterId,
    targetType: data.targetType,
    targetId: data.targetId,
    reason: data.reason as ReportReason,
    description: data.description,
  });

  return { id };
}

export function normalizeReportListParams(url: URL) {
  return {
    status: url.searchParams.get('status') || undefined,
    targetType: url.searchParams.get('targetType') || undefined,
    limit: Math.min(200, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '50', 10) || 50)),
  };
}

export async function getReports(params: {
  status?: string;
  targetType?: string;
  limit?: number;
}) {
  const conditions = [];

  if (params.status) {
    conditions.push(eq(reports.status, params.status));
  }
  if (params.targetType) {
    conditions.push(eq(reports.targetType, params.targetType));
  }

  return db.query.reports.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(reports.createdAt)],
    limit: params.limit || 50,
  });
}

export async function getReportStats() {
  const [total] = await db.select({ count: sql<number>`count(*)` }).from(reports);
  const [pending] = await db.select({ count: sql<number>`count(*)` }).from(reports).where(eq(reports.status, 'pending'));
  const [resolved] = await db.select({ count: sql<number>`count(*)` }).from(reports).where(eq(reports.status, 'resolved'));

  return {
    total: total.count,
    pending: pending.count,
    resolved: resolved.count,
  };
}

export async function getReportDashboardData(url: URL) {
  const params = normalizeReportListParams(url);
  const reportsList = await getReports(params);
  const stats = await getReportStats();
  return { reports: reportsList, stats };
}

export async function updateReportStatus(params: {
  reportId: string;
  status: 'reviewed' | 'resolved' | 'dismissed';
  resolution?: 'removed' | 'warning' | 'no_action';
  reviewedBy: string;
}): Promise<void> {
  await db
    .update(reports)
    .set({
      status: params.status,
      resolution: params.resolution || null,
      reviewedBy: params.reviewedBy,
      reviewedAt: new Date(),
    })
    .where(eq(reports.id, params.reportId));
}

export async function getReportWithDetails(reportId: string) {
  const report = await db.query.reports.findFirst({
    where: eq(reports.id, reportId),
  });

  if (!report) return null;

  let targetDetails = null;

  if (report.targetType === 'shop') {
    targetDetails = await db.query.shops.findFirst({
      where: eq(shops.id, report.targetId),
    });
  } else if (report.targetType === 'deal') {
    targetDetails = await db.query.deals.findFirst({
      where: eq(deals.id, report.targetId),
    });
  }

  return {
    ...report,
    targetDetails,
  };
}

export async function takeModerationAction(params: {
  reportId: string;
  action: ModerationAction;
  targetType: 'shop' | 'deal';
  targetId: string;
  reviewedBy: string;
}): Promise<void> {
  await updateReportStatus({
    reportId: params.reportId,
    status: 'resolved',
    resolution: params.action === 'remove' ? 'removed' : params.action === 'warn' ? 'warning' : 'no_action',
    reviewedBy: params.reviewedBy,
  });

  if (params.action === 'remove' && params.targetType === 'deal') {
    await db.update(deals).set({ isActive: false }).where(eq(deals.id, params.targetId));
  }
}

export async function moderateReport(reportId: string, rawData: unknown, reviewedBy: string) {
  const data = rawData as { action?: unknown };
  if (!['remove', 'warn', 'no_action'].includes(String(data?.action))) {
    throw badRequest('INVALID_ACTION', 'การกระทำไม่ถูกต้อง');
  }

  const report = await getReportWithDetails(reportId);
  if (!report) {
    throw notFound('ไม่พบรายงาน');
  }

  await takeModerationAction({
    reportId,
    action: data.action as ModerationAction,
    targetType: report.targetType as 'shop' | 'deal',
    targetId: report.targetId,
    reviewedBy,
  });
}
