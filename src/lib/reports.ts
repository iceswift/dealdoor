// src/lib/reports.ts

import { db } from './db';
import { reports, shops, deals } from '../../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// ─── Report Reasons ──────────────────────────────────────

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

// ─── Create Report ───────────────────────────────────────

export async function createReport(params: {
  reporterId?: string;
  targetType: 'shop' | 'deal';
  targetId: string;
  reason: ReportReason;
  description?: string;
}): Promise<string> {
  // Check for duplicate report
  const existing = await db.query.reports.findFirst({
    where: and(
      eq(reports.targetType, params.targetType),
      eq(reports.targetId, params.targetId),
      eq(reports.reason, params.reason),
      eq(reports.status, 'pending')
    ),
  });

  if (existing) {
    throw new Error('คุณได้รายงานรายการนี้แล้ว');
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

// ─── Get Reports ─────────────────────────────────────────

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

// ─── Get Report Stats ────────────────────────────────────

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

// ─── Update Report Status ────────────────────────────────

export async function updateReportStatus(params: {
  reportId: string;
  status: 'reviewed' | 'resolved' | 'dismissed';
  resolution?: 'removed' | 'warning' | 'no_action';
  reviewedBy: string;
}): Promise<void> {
  await db.update(reports)
    .set({
      status: params.status,
      resolution: params.resolution || null,
      reviewedBy: params.reviewedBy,
      reviewedAt: new Date(),
    })
    .where(eq(reports.id, params.reportId));
}

// ─── Get Report with Target Details ──────────────────────

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

// ─── Take Action on Reported Content ─────────────────────

export async function takeModerationAction(params: {
  reportId: string;
  action: 'remove' | 'warn' | 'no_action';
  targetType: 'shop' | 'deal';
  targetId: string;
  reviewedBy: string;
}): Promise<void> {
  // Update report status
  await updateReportStatus({
    reportId: params.reportId,
    status: 'resolved',
    resolution: params.action === 'remove' ? 'removed' : params.action === 'warn' ? 'warning' : 'no_action',
    reviewedBy: params.reviewedBy,
  });

  // Take action on content
  if (params.action === 'remove') {
    if (params.targetType === 'deal') {
      await db.update(deals)
        .set({ isActive: false })
        .where(eq(deals.id, params.targetId));
    }
    // For shops, we might deactivate or flag for review
  }
}
