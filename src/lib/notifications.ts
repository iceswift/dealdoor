// Backward-compatible facade. New server code should import from
// `src/server/services/notification.service.ts` directly.

export {
  checkDealExpiration,
  checkExpiredDeals,
  checkShopReadiness,
  checkAnalyticsMilestones,
  createNotification,
  createShopNotification,
  executeNotificationScan,
  getNotificationInbox,
  getNotificationPreferences,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  markNotificationRead,
  normalizeNotificationListParams,
  runNotificationScan,
  updateNotificationPreferences,
  type NotificationPreferenceInput,
  type NotificationScope,
  type NotificationType,
} from '../server/services/notification.service';

export {
  enqueueNotificationDelivery,
  getPendingNotificationDeliveries,
  recordInAppDelivery,
  updateNotificationDelivery,
  type DeliveryChannel,
  type DeliveryStatus,
} from '../server/services/notification-outbox.service';
