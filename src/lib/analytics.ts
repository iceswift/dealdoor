// Backward-compatible facade. New server code should import from
// `src/server/services/analytics.service.ts` directly.

export {
  aggregateDailyStats,
  getDashboardAnalytics,
  getDealViewCount,
  getShopStats,
  getTopDeals,
  normalizeAnalyticsDays,
  normalizeTrackEventInput,
  trackEvent,
  trackEventFromRequest,
  type EventType,
  type TrackEventInput,
} from '../server/services/analytics.service';
