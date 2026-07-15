import { createId } from '@paralleldrive/cuid2';
import { and, desc, eq, sql } from 'drizzle-orm';
import { deals, reports, shops, users } from '../../lib/db-schema';
import { db } from '../../lib/db';
import { badRequest, conflict, notFound } from '../../lib/errors';
import { reportSchema, validateInput } from '../../lib/validations';
import { createNotification, createShopNotification } from './notification.service';
import { writeAdminAuditLog } from './admin-audit.service';

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

async function ensureReportTargetExists(targetType: 'shop' | 'deal', targetId: string) {
  if (targetType === 'shop') {
    const shop = await db.query.shops.findFirst({
      where: eq(shops.id, targetId),
    });
    if (!shop) throw notFound('ไม่พบร้านค้าที่ต้องการรายงาน');
    return shop;
  }

  const deal = await db.query.deals.findFirst({
    where: eq(deals.id, targetId),
  });
  if (!deal) throw notFound('ไม่พบดีลที่ต้องการรายงาน');
  return deal;
}

async function getReportTargetDetails(targetType: string, targetId: string) {
  if (targetType === 'shop') {
    const shop = await db.query.shops.findFirst({
      where: eq(shops.id, targetId),
    });
    if (!shop) return null;
    return {
      id: shop.id,
      type: 'shop',
      title: shop.name,
      subtitle: shop.address || shop.category,
      href: `/${shop.slug}`,
      shopHref: `/${shop.slug}`,
      imageUrl: shop.logoImage || shop.coverImage,
      status: shop.vacationMode ? 'paused' : shop.isOpen ? 'open' : 'closed',
    };
  }

  if (targetType === 'deal') {
    const deal = await db.query.deals.findFirst({
      where: eq(deals.id, targetId),
    });
    if (!deal) return null;
    const shop = await db.query.shops.findFirst({
      where: eq(shops.id, deal.shopId),
    });
    return {
      id: deal.id,
      type: 'deal',
      title: deal.title,
      subtitle: shop ? shop.name : deal.category,
      href: `/deal/${deal.id}`,
      shopHref: shop ? `/${shop.slug}` : null,
      shopTitle: shop?.name || null,
      imageUrl: deal.imageUrl || shop?.logoImage || shop?.coverImage || null,
      status: deal.isActive ? 'active' : 'inactive',
    };
  }

  return null;
}

export async function createReport(params: {
  reporterId?: string;
  targetType: 'shop' | 'deal';
  targetId: string;
  reason: ReportReason;
  description?: string;
}): Promise<string> {
  await ensureReportTargetExists(params.targetType, params.targetId);

  if (params.reporterId) {
    const existing = await db.query.reports.findFirst({
      where: and(
        eq(reports.reporterId, params.reporterId),
        eq(reports.targetType, params.targetType),
        eq(reports.targetId, params.targetId),
        eq(reports.reason, params.reason),
        eq(reports.status, 'pending')
      ),
    });

    if (existing) {
      throw conflict('DUPLICATE', 'คุณได้รายงานรายการนี้แล้ว');
    }
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

  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, 'admin'));

  await Promise.all(admins.map((admin) => createNotification({
    userId: admin.id,
    type: 'report_created',
    title: 'มีรายงานใหม่รอตรวจสอบ',
    message: `มีการรายงาน${params.targetType === 'deal' ? 'ดีล' : 'ร้านค้า'} โปรดตรวจสอบในศูนย์ดูแลระบบ`,
    metadata: {
      reportId: id,
      targetId: params.targetId,
      targetType: params.targetType,
      href: '/admin/moderation',
    },
  })));

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

  const reportsList = await db.query.reports.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(reports.createdAt)],
    limit: params.limit || 50,
  });

  return Promise.all(reportsList.map(async (report) => ({
    ...report,
    targetDetails: await getReportTargetDetails(report.targetType, report.targetId),
  })));
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

  await writeAdminAuditLog({
    actorUserId: params.reviewedBy,
    action: 'moderation.report_resolved',
    targetType: 'report',
    targetId: params.reportId,
    metadata: {
      moderationAction: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
    },
  });

  if (params.action === 'remove' && params.targetType === 'deal') {
    await writeAdminAuditLog({
      actorUserId: params.reviewedBy,
      action: 'moderation.deal_deactivated',
      targetType: 'deal',
      targetId: params.targetId,
      metadata: { reportId: params.reportId, reason: 'report_moderation' },
    });
  }

  if (params.action === 'warn') {
    await writeAdminAuditLog({
      actorUserId: params.reviewedBy,
      action: 'moderation.warning_issued',
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: { reportId: params.reportId },
    });
  }

  if (params.action === 'no_action') {
    await writeAdminAuditLog({
      actorUserId: params.reviewedBy,
      action: 'moderation.no_action',
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: { reportId: params.reportId },
    });
  }

  const targetShop = params.targetType === 'shop'
    ? await db.query.shops.findFirst({ where: eq(shops.id, params.targetId) })
    : await (async () => {
        const deal = await db.query.deals.findFirst({ where: eq(deals.id, params.targetId) });
        return deal ? db.query.shops.findFirst({ where: eq(shops.id, deal.shopId) }) : undefined;
      })();

  if (targetShop) {
    const outcome = params.action === 'remove'
      ? 'เนื้อหาถูกปิดการแสดงผล'
      : params.action === 'warn'
        ? 'มีคำเตือนจากทีมดูแลระบบ'
        : 'ทีมดูแลระบบตรวจสอบแล้ว';

    await createShopNotification({
      merchantId: targetShop.merchantId,
      shopId: targetShop.id,
      type: 'report_resolved',
      title: 'อัปเดตผลการตรวจสอบรายงาน',
      message: outcome,
      metadata: { reportId: params.reportId, href: '/dashboard' },
    });
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
