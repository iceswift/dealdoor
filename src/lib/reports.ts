// Backward-compatible facade. New server code should import from
// `src/server/services/report.service.ts` directly.

export {
  REPORT_REASONS,
  createReport,
  createReportFromRequest,
  getReportDashboardData,
  getReportStats,
  getReportWithDetails,
  getReports,
  moderateReport,
  normalizeReportListParams,
  takeModerationAction,
  updateReportStatus,
  type ModerationAction,
  type ReportReason,
} from '../server/services/report.service';
