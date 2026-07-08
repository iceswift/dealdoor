# DealDoor Backend Architecture Audit

Phase: 7 - Reports And Notifications Service Extraction  
Status: Phase 1 complete, Phase 2 baseline installed, Phase 3 core dashboard services extracted, Phase 4 shop service extracted, Phase 5 analytics service extracted, Phase 6 auth service extracted, Phase 7 reports/notifications extracted  
Last updated: 2026-07-08

## Goal

Stabilize the backend before more feature work. This document freezes the current backend shape, records known risks, and defines what must not change casually while the app moves toward migration-first, service-first backend work.

DealDoor is currently an Astro server app using React islands, TypeScript, SQLite, Drizzle ORM, and Bun. The backend is functional, but data access and business rules are split across API routes, pages, and helper modules. The next backend work should reduce that spread without rewriting everything at once.

## Runtime And Storage

- Runtime: Astro server output with `@astrojs/node`
- Local command: `bun run dev`
- Build command: `pnpm build` or `bun run build`
- Database: SQLite via `better-sqlite3`
- ORM: Drizzle ORM
- Database entrypoint: `src/lib/db.ts`
- Schema source: `db/schema.ts`
- Seed source: `db/seed.ts`
- Drizzle config: `drizzle.config.ts`
- Migration output configured as `drizzle/migrations`
- Current baseline migration: `drizzle/migrations/0000_perpetual_chamber.sql`
- Migration workflow documentation: `docs/backend-migrations.md`
- Existing DB baseline helper: `npm run db:baseline`
- Schema sanity check: `npm run db:check`

## Current Database Tables

From `db/schema.ts`:

- `users`: authentication users
- `sessions`: cookie-backed sessions
- `merchants`: merchant profile linked to users
- `shops`: shop profile, public listing data, contact, accessibility, payment, parking, family, pet, vacation mode
- `deals`: shop promotions and coupons
- `menu_items`: shop menu/catalog items
- `shop_special_hours`: one-off holiday/special-hours overrides
- `analytics_events`: raw tracking events
- `daily_stats`: aggregate daily stats, currently secondary to live event aggregation
- `notifications`: system/user/shop notifications
- `reports`: reports against shops/deals

## Current Backend Modules

Core modules:

- `src/lib/db.ts`: opens SQLite database and exports Drizzle client
- `src/lib/auth.ts`: low-level password, session, cookie, user/merchant lookup helpers
- `src/lib/security.ts`: rate limit and security headers
- `src/lib/errors.ts`: API error response format
- `src/lib/validations.ts`: Zod schemas for shop/deal/auth inputs
- `src/lib/dashboard/server.ts`: dashboard context, ownership checks, dashboard overview helpers
- `src/lib/analytics.ts`: tracking and analytics aggregation
- `src/lib/reports.ts`: backward-compatible facade that re-exports the report service
- `src/lib/notifications.ts`: backward-compatible facade that re-exports the notification service
- `src/lib/explore/map-view-model.ts`: Explore/Pin Map view model
- `src/lib/deals/view-model.ts`: deal presentation helpers
- `src/server/services/shop.service.ts`: shop list/read/create/update rules, slug checks, ownership-aware profile updates
- `src/server/services/deal.service.ts`: dashboard deal list/create/update/status/delete rules
- `src/server/services/menu.service.ts`: dashboard menu/catalog validation, tier limit, CRUD rules
- `src/server/services/special-hours.service.ts`: special-hours validation and CRUD rules
- `src/server/services/analytics.service.ts`: event tracking, dashboard stats, top deals, deal view counts, daily aggregation
- `src/server/services/auth.service.ts`: login/register/logout request flow, auth validation, public user DTOs, session cookie orchestration
- `src/server/services/report.service.ts`: report validation, duplicate detection, listing, stats, moderation actions
- `src/server/services/notification.service.ts`: notification creation, inbox listing, unread counts, read state, scheduled deal-expiry checks
- `src/lib/analytics.ts`: backward-compatible facade that re-exports the analytics service

Supporting modules:

- `src/lib/tiers.ts`
- `src/lib/upload.ts`
- `src/lib/seo.ts`
- `src/lib/utils.ts`
- `src/lib/constants.ts`
- `src/lib/saved-deals.ts`
- `src/lib/onboarding.ts`
- `src/lib/accessibility.ts`
- `src/lib/cache.ts`
- `src/lib/logger.ts`
- `src/lib/error-tracking.ts`

## Current API Inventory

Auth:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/register`

Shop/dashboard:

- `GET /api/shops`
- `POST /api/shops`
- `GET /api/shops/[id]`
- `PUT /api/shops/[id]`

Deals:

- `GET /api/deals`
- `POST /api/deals`
- `GET /api/deals/[id]`
- `PUT /api/deals/[id]`
- `DELETE /api/deals/[id]`

Menu/catalog:

- `GET /api/menu-items`
- `POST /api/menu-items`
- `GET /api/menu-items/[id]`
- `PUT /api/menu-items/[id]`
- `DELETE /api/menu-items/[id]`

Special hours:

- `GET /api/special-hours`
- `POST /api/special-hours`
- `PUT /api/special-hours/[id]`
- `DELETE /api/special-hours/[id]`

Analytics:

- `POST /api/analytics/track`
- `GET /api/analytics/stats`

Notifications:

- `GET /api/notifications`
- `POST /api/notifications`
- `POST /api/notifications/[id]/read`

Reports/admin:

- `GET /api/reports`
- `POST /api/reports`
- `POST /api/reports/[id]/action`
- `GET /api/admin/stats`

Utility:

- `GET /api/health`
- `GET /api/qr/[slug]`
- `POST /api/upload`

## Current Data Flow

Authentication:

1. Middleware calls `getUserFromRequest`.
2. User is attached to `Astro.locals.user`.
3. Dashboard pages redirect unauthenticated users.
4. Dashboard APIs call `requireDashboardContext` or `requireDashboardShop`.

Dashboard ownership:

1. User resolves to merchant.
2. Merchant resolves to one shop.
3. Mutating dashboard APIs should use logged-in shop ownership, not trust client `shopId`.
4. Deals, menu items, and special hours now mostly follow this pattern.

Public shop page:

1. `src/pages/[slug].astro` queries shop by slug.
2. It directly queries active deals, expired deals, menu items, and special hours.
3. `ShopHeader` uses shop vacation mode and today's special hours to determine visible status.

Explore/Pin Map:

1. `src/pages/explore/index.astro` queries active deals joined with shops.
2. It queries all `shop_special_hours`.
3. `getExploreMapData` groups deals by shop and returns map pins.
4. Pin status uses vacation mode, special hours for today, then the shop open flag.

Analytics:

1. Public actions write `analytics_events`.
2. Dashboard analytics reads live raw events first.
3. `daily_stats` remains a fallback for deployments that run scheduled aggregation jobs.
4. `/api/analytics/stats` returns `source` as `analytics_events` or `daily_stats` so chart/debug behavior is visible.

## Known Architectural Risks

Priority 0:

- Historical risk: `dev.db` was manually altered during rescue work. Phase 2 now adds a Drizzle baseline migration and a baseline marker script for existing DBs, but future schema changes must be migration-first.
- Public pages and some API routes still perform direct `db` queries instead of always going through services.
- `shops` is becoming a wide table with many feature fields. Future features should not keep adding unrelated groups to `shops` by default.

Priority 1:

- API validation is centralized for current auth, shop, deal, menu item, special-hours, analytics, report, and notification APIs.
- Error messages and encoding are mixed in some older files; browser output is mostly okay, but source readability is uneven.
- Admin authorization is not strict. Middleware notes that MVP allows authenticated users for admin.
- Upload persistence is local-file based and not production-safe across ephemeral deployments.
- Rate limiting uses in-memory state, so it resets on restart and does not coordinate across instances.

Priority 2:

- Analytics source of truth is now documented: use raw `analytics_events` for realtime dashboards, with `daily_stats` as fallback only.
- Public Explore currently loads all special hours rows. This is acceptable for small data, but should be scoped by date/shop set later.
- `shop.openingHours` is serialized text. It works for current UI, but structured weekly hours should eventually move to a normalized field/table.
- `GET /api/shops` appears public and may expose more fields than needed. Public DTOs should be explicit.

## Backend Freeze Rules

Until the backend service extraction is complete:

1. Do not add new DB columns or tables without a migration file and this document being updated.
2. Do not manually alter `db/dev.db` as the primary migration path.
3. Do not add new dashboard APIs that trust client-provided `shopId`.
4. Do not add business logic directly into Astro pages if it belongs to a domain service.
5. Do not add new large feature groups to `shops` unless there is a clear reason they are truly one-to-one shop profile fields.
6. Do not add new API response shapes without `success/error` consistency.
7. Do not duplicate ownership checks in route files; use central helpers or create a service/helper.
8. Do not rely on local uploads for production-critical persistence without documenting the deployment limitation.

Allowed during freeze:

- Bug fixes
- UI-only fixes
- Documentation
- Tests
- Narrow service extraction with no behavior change
- Migration scaffolding
- Type/validation improvements that preserve existing API behavior

## Recommended Service Boundaries

Phase 2/3 should introduce these service modules:

- `src/server/services/auth.service.ts` - Done for login/register/logout API flow.
- `src/server/services/shop.service.ts` - Done for shop list/read/create/update APIs.
- `src/server/services/deal.service.ts` - Done for dashboard APIs.
- `src/server/services/menu.service.ts` - Done for dashboard APIs.
- `src/server/services/special-hours.service.ts` - Done for dashboard APIs.
- `src/server/services/analytics.service.ts` - Done for event tracking, dashboard stats, top deals, deal view counts, aggregation.
- `src/server/services/dashboard.service.ts`
- `src/server/services/report.service.ts` - Done for report create/list/stats/moderation APIs.
- `src/server/services/notification.service.ts` - Done for notification inbox/read helpers and deal-expiry checks.

Routes should become thin:

1. authenticate/authorize
2. parse and validate request
3. call service
4. return standardized JSON

## Phase 2 Entry Criteria

Before Phase 2 work starts:

- This file is accepted as the current backend baseline. Done.
- No unrelated feature work is mixed into migration work. Done.
- A migration folder is created or verified. Done.
- Current `db/dev.db` schema is compared against `db/schema.ts`. Done via `npm run db:check`.
- A repeatable command is chosen for local reset/migration/seed. Done in `docs/backend-migrations.md`.

## Phase 2 Exit Criteria

Phase 2 is complete when:

- All current schema changes exist as repeatable migrations. Done: `0000_perpetual_chamber.sql`.
- Fresh clone flow works: install -> migrate -> seed -> dev. Documented; should be tested before release.
- Local DB can be rebuilt without manual SQL. Documented; destructive reset not run during this phase.
- Migration notes explain how existing dev/prod DBs move forward. Done: `docs/backend-migrations.md`.
- `shop_special_hours` and vacation mode are represented in migration history. Done.

## Phase 3 Exit Criteria

Phase 3 core extraction is complete when:

- Dashboard deal APIs call `src/server/services/deal.service.ts` for validation, tier limits, ownership-aware reads, updates, status toggles, and deletes. Done.
- Dashboard menu/catalog APIs call `src/server/services/menu.service.ts` for normalization, tier limits, ownership-aware reads, updates, and deletes. Done.
- Dashboard special-hours APIs call `src/server/services/special-hours.service.ts` for date/time validation, ownership-aware updates, and deletes. Done.
- API route files stay thin: authenticate/authorize, read request body, call service, return JSON. Done for deals, menu items, and special hours.
- `npm run db:check` passes after extraction. Done.
- `npm run build` passes after extraction. Done.

## Phase 4 Exit Criteria

Phase 4 shop extraction is complete when:

- `/api/shops` calls `src/server/services/shop.service.ts` for public listing and merchant shop creation. Done.
- `/api/shops/[id]` calls `src/server/services/shop.service.ts` for read and ownership-aware update. Done.
- Shop create/update validation, slug collision checks, and wide profile field merge logic no longer live in route files. Done.
- API route files stay thin: authenticate/authorize, read request body, call service, return JSON. Done for shops.
- `npm run db:check` passes after extraction. Done.
- `npm run build` passes after extraction. Done.

## Phase 5 Exit Criteria

Phase 5 analytics extraction is complete when:

- `src/server/services/analytics.service.ts` owns event validation, tracking, stats queries, top deal queries, deal view counts, and daily aggregation. Done.
- `src/lib/analytics.ts` remains only as a compatibility facade for existing imports. Done.
- `/api/analytics/track` is a thin route that validates/tracks through the analytics service. Done.
- `/api/analytics/stats` is a thin route that authorizes the current shop and returns service data. Done.
- Dashboard overview imports analytics service directly instead of the legacy facade. Done.
- Dashboard analytics response includes the selected data source (`analytics_events` or `daily_stats`). Done.
- `npm run db:check` passes after extraction. Done.
- `npm run build` passes after extraction. Done.

## Phase 6 Exit Criteria

Phase 6 auth extraction is complete when:

- `src/server/services/auth.service.ts` owns login/register/logout request flow. Done.
- Auth API routes are thin: read request body/cookies, call service, return standardized JSON. Done.
- `src/lib/auth.ts` remains low-level infrastructure for password hashing, sessions, cookies, and user/merchant lookup. Done.
- Login failures return `INVALID_CREDENTIALS` through the standard API error handler. Done.
- Register duplicate email failures return `EMAIL_EXISTS` through the standard API error handler. Done.
- `npm run db:check` passes after extraction. Done.
- `npm run build` passes after extraction. Done.

## Phase 7 Exit Criteria

Phase 7 reports and notifications extraction is complete when:

- `src/server/services/report.service.ts` owns report validation, duplicate detection, list params, stats, target detail lookup, and moderation actions. Done.
- `src/server/services/notification.service.ts` owns notification creation, list params, unread counts, read state updates, deal-expiry checks, and time formatting. Done.
- `src/lib/reports.ts` and `src/lib/notifications.ts` remain compatibility facades. Done.
- Report and notification API route files stay thin. Done.
- Duplicate reports now return standardized `DUPLICATE` API errors through `handleApiError`. Done.
- `npm run db:check` passes after extraction. Done.
- `npm run build` passes after extraction. Done.

## Immediate Next Tasks

1. Decide whether `src/lib/dashboard/server.ts` should remain as the dashboard service boundary or be split into `src/server/services/dashboard.service.ts`.
2. Create service-level smoke tests for auth, shop, deal, analytics, report, and notification flows.
3. Create `docs/backend-api-inventory.md` if the API list grows beyond this file.
4. Decide whether weekly `openingHours` stays as text for MVP or moves to structured JSON/table in Phase 5.
5. Add narrow API/service tests for deals, menu items, and special hours.
