// Backward-compatible facade. New server code should import from
// `src/server/services/notification.service.ts` directly.

export {
  checkDealExpiration,
  checkMilestones,
  createNotification,
  formatTimeAgo,
  getNotificationInbox,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  markNotificationReadFromRequest,
  normalizeNotificationListParams,
  type NotificationType,
} from '../server/services/notification.service';
