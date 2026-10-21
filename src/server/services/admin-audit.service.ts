import { createId } from '@paralleldrive/cuid2';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../lib/db';
import { adminAuditLogs, users } from '../../lib/db-schema';

export type AdminAuditAction =
  | 'moderation.report_resolved'
  | 'moderation.deal_deactivated'
  | 'moderation.warning_issued'
  | 'moderation.no_action'
  | 'boost.campaign_stopped';

export async function writeAdminAuditLog(params: {
  actorUserId: string;
  action: AdminAuditAction;
  targetType: 'report' | 'shop' | 'deal' | 'boost_campaign';
  targetId: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(adminAuditLogs).values({
    id: createId(),
    actorUserId: params.actorUserId,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
  });
}

export async function getAdminAuditLogs(params: { limit?: number; action?: string; targetType?: string } = {}) {
  const conditions = [];
  if (params.action) conditions.push(eq(adminAuditLogs.action, params.action));
  if (params.targetType) conditions.push(eq(adminAuditLogs.targetType, params.targetType));

  const rows = await db.query.adminAuditLogs.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    orderBy: [desc(adminAuditLogs.createdAt)],
    limit: Math.min(100, Math.max(1, params.limit || 50)),
  });
  const actorIds = [...new Set(rows.map((row) => row.actorUserId))];
  const actorRows = actorIds.length
    ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users)
    : [];
  const actors = new Map(actorRows.map((actor) => [actor.id, actor]));

  return rows.map((row) => ({ ...row, actor: actors.get(row.actorUserId) || null }));
}
