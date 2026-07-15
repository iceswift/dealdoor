import { createId } from '@paralleldrive/cuid2';
import { and, asc, eq, lte } from 'drizzle-orm';
import { db } from '../../lib/db';
import { notificationDeliveries } from '../../lib/db-schema';

export type DeliveryChannel = 'in_app' | 'email' | 'web_push';
export type DeliveryStatus = 'queued' | 'processing' | 'delivered' | 'failed' | 'skipped';

export async function recordInAppDelivery(notificationId: string, executor: typeof db = db) {
  const now = new Date();
  await executor.insert(notificationDeliveries).values({
    id: createId(),
    notificationId,
    channel: 'in_app',
    status: 'delivered',
    attempts: 1,
    availableAt: now,
    lastAttemptAt: now,
    deliveredAt: now,
    createdAt: now,
    updatedAt: now,
  });
}

export async function enqueueNotificationDelivery(notificationId: string, channel: Exclude<DeliveryChannel, 'in_app'>) {
  const now = new Date();
  const id = createId();
  await db.insert(notificationDeliveries).values({
    id,
    notificationId,
    channel,
    status: 'queued',
    attempts: 0,
    availableAt: now,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function getPendingNotificationDeliveries(channel: Exclude<DeliveryChannel, 'in_app'>, limit = 50) {
  return db.query.notificationDeliveries.findMany({
    where: and(
      eq(notificationDeliveries.channel, channel),
      eq(notificationDeliveries.status, 'queued'),
      lte(notificationDeliveries.availableAt, new Date()),
    ),
    orderBy: [asc(notificationDeliveries.availableAt)],
    limit: Math.min(100, Math.max(1, limit)),
  });
}

export async function updateNotificationDelivery(id: string, update: {
  status: DeliveryStatus;
  error?: string | null;
  providerMessageId?: string | null;
  retryAt?: Date;
}) {
  const now = new Date();
  const delivered = update.status === 'delivered';
  const existing = await db.query.notificationDeliveries.findFirst({
    where: eq(notificationDeliveries.id, id),
  });
  if (!existing) return;

  await db.update(notificationDeliveries)
    .set({
      status: update.status,
      attempts: (existing.attempts || 0) + 1,
      lastAttemptAt: now,
      deliveredAt: delivered ? now : undefined,
      availableAt: update.retryAt || undefined,
      providerMessageId: update.providerMessageId,
      lastError: update.error,
      updatedAt: now,
    })
    .where(eq(notificationDeliveries.id, id));
}
