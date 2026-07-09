# DealDoor Deploy Readiness Audit

Date: 2026-07-08  
Phase: A - Deploy Readiness Audit  
Status: Not ready for production deploy yet

Phase B follow-up:

- VPS deploy architecture documented in `docs/vps-deploy-architecture.md`.
- Draft production files added:
  - `docker-compose.prod.yml`
  - `Caddyfile`
  - `.env.production.example`
- These files describe the target architecture, but they are not fully runnable production config until Postgres and R2 support are implemented in Phase C/D.

Phase C follow-up:

- Postgres migration plan documented in `docs/postgres-migration-plan.md`.
- Decision: migrate DB engine first, keep current table shape, and postpone shop schema normalization until after Postgres staging is stable.

## Executive Summary

DealDoor is now in much better shape after the backend rescue and service-layer work, but it should not be deployed as a real production service until a few production blockers are fixed.

The current app can build and run, and the service layer is a good foundation. The main production risks are not the UI or Astro itself. The main risks are persistence, upload storage, API authorization coverage, and CI gates.

## Current Readiness

Ready:

- Astro server output with `@astrojs/node` standalone adapter.
- `bun run build` passes.
- `bun run db:check` passes.
- Drizzle baseline migration exists.
- Backend service layer exists for auth, shop, deal, menu, special-hours, analytics, reports, and notifications.
- Health endpoint exists at `/api/health`.
- Docker, Railway, and Render config files exist.

Not ready:

- Production DB configuration is inconsistent and still hard-coded to local SQLite in the app.
- Uploads are local filesystem only and `/api/upload` currently allows unauthenticated uploads.
- Middleware authorization coverage is incomplete for newer dashboard APIs.
- Admin routes allow any authenticated user.
- CI currently ignores lint/typecheck failures with `|| true`.
- README is still Astro starter text and does not explain real production setup.

## P0 - Must Fix Before Real Deploy

### 1. Database path ignores `DATABASE_URL`

Current state:

- `drizzle.config.ts` uses `./db/dev.db`.
- `src/lib/db.ts` always opens `db/dev.db`.
- `.env.example`, `render.yaml`, and `docker-compose.yml` mention `DATABASE_URL`, but the runtime code does not actually use it.

Risk:

- Production may accidentally use `dev.db`.
- Render/Railway env configuration will not behave as expected.
- Backups and migrations can target a different DB than the running app.

Required fix:

- Update `src/lib/db.ts` to read `process.env.DATABASE_URL || './db/dev.db'`.
- Update `drizzle.config.ts` to use env-aware DB URL.
- Decide whether first production deploy uses SQLite with persistent disk or moves to Postgres.

Recommendation:

- Short-term: SQLite with persistent disk only for staging or very early closed beta.
- Production: plan Postgres before real merchants/customers.

### 2. Local uploads are not production-safe

Current state:

- `src/lib/upload.ts` writes to `public/uploads/...`.
- Docker compose mounts `./public/uploads`.
- Render/Railway deployments may lose uploaded files unless persistent disk is configured correctly.
- `public/uploads/logos/` already exists as untracked runtime data.

Risk:

- Merchant images disappear after redeploy.
- Multiple app instances will not share uploads.
- No CDN, no lifecycle policy, no external backup.

Required fix:

- Move uploads to cloud object storage before public launch.
- Good options: Cloudflare R2, Supabase Storage, S3-compatible storage, or Cloudinary.

Short-term acceptable:

- Keep local uploads only for local/staging.
- Add clear deployment note that uploaded files are not durable unless persistent storage is configured.

### 3. Upload API is unauthenticated

Current state:

- `src/pages/api/upload/index.ts` explicitly says uploads are allowed without auth for MVP.

Risk:

- Anyone can upload files to the server.
- Storage can be abused.
- Sharp/image processing can be used to burn CPU.

Required fix:

- Require authenticated merchant session for upload.
- Apply upload-specific rate limiting.
- Validate file signature, not only browser-provided MIME type.
- Consider per-shop ownership rules for replacing logo/cover/menu/deal images.

### 4. Admin access is too permissive

Current state:

- `src/middleware.ts` allows any authenticated user into `/admin`.

Risk:

- Merchant accounts can access admin views.

Required fix:

- Enforce `user.role === 'admin'` for `/admin`.
- Audit all `/api/admin/*`, `/api/reports/*` moderation actions, and monitor pages.

### 5. Dashboard API authorization coverage is incomplete

Current state:

- Middleware protects non-GET `/api/shops` and `/api/deals`.
- New dashboard APIs such as `/api/menu-items`, `/api/special-hours`, `/api/upload`, `/api/notifications`, and `/api/reports/[id]/action` rely on route/service checks or currently have looser rules.

Risk:

- Future route additions may miss auth.
- Dashboard mutation rules are inconsistent.

Required fix:

- Define a central protected API matcher.
- Require auth for all dashboard mutation APIs.
- Keep public APIs explicit, not accidental.

## P1 - Should Fix Before Staging

### 1. CI hides lint/typecheck failures

Current state:

- `.github/workflows/ci.yml` runs:
  - `bun run lint || true`
  - `bun run typecheck || true`
- `package.json` currently has no `lint` or `typecheck` scripts.

Risk:

- CI can pass while type errors exist.
- Production deploy can proceed with broken code.

Required fix:

- Add a real typecheck script, likely `astro check`.
- Add or intentionally skip lint, but do not use `|| true` for production gates.
- Add `bun run db:check` to CI.

### 2. Production environment docs are stale

Current state:

- `README.md` is still Astro starter content.
- `.env.example` includes `AUTH_SECRET`, but current auth/session implementation does not use it.
- Existing docs include older MVP guidance that conflicts with current system.

Risk:

- Future setup will be confusing.
- Another AI or teammate may follow stale docs.

Required fix:

- Rewrite README with real DealDoor commands and deploy notes.
- Keep `.env.example` aligned with actual code.
- Mark older design docs as reference, not current truth.

### 3. Rate limiting is in-memory only

Current state:

- `src/lib/security.ts` stores rate limits in a process-local `Map`.

Risk:

- Limits reset on restart.
- Limits do not work across multiple instances.

Required fix:

- Fine for single-instance staging.
- Use Redis/Upstash or platform rate limits for production.

### 4. Healthcheck is useful but basic

Current state:

- `/api/health` checks DB with `SELECT 1` and memory.

Risk:

- It does not verify migrations, write access, upload storage, or external storage.

Required fix:

- Add migration/version check.
- If local SQLite is used, verify DB path/writeability.
- If cloud storage is used, add optional storage health.

## P2 - Should Fix Before Public Launch

### 1. Move from SQLite to Postgres or explicitly accept SQLite limits

SQLite is okay for local dev, demos, and possibly a small closed beta on one instance with persistent disk. For real production with merchants, Postgres is a safer default.

Recommendation:

- Use Drizzle + Postgres when the deploy target and storage choice are clear.
- Good hosted choices: Supabase, Neon, Railway Postgres.

### 2. Normalize shop data model

Current `shops` is wide. It contains identity, location, contact, payment, accessibility, parking, pet policy, family facilities, vacation mode, media, and plan data.

Recommendation:

- Keep wide `shops` for the next feature cycle if needed.
- Before public launch, design:
  - `shop_hours`
  - `shop_media`
  - `shop_contacts`
  - `shop_facilities`
  - optional `menu_categories`

### 3. Add smoke tests

Minimum smoke flow:

- Login.
- Dashboard loads.
- Shop update works.
- Deal create/update/delete works.
- Menu create/update/delete works.
- Special-hours create/update/delete works.
- Public shop page loads.
- Explore page loads.
- Analytics track/stats API works.
- Upload requires auth.

### 4. Observability

Required before public traffic:

- Error logging target.
- Request IDs already exist; make logs searchable.
- Optional Sentry or similar error tracking.
- Basic uptime monitor against `/api/health`.

## Deploy Target Notes

### Render

Current `render.yaml` configures persistent disk for DB, but runtime code ignores `DATABASE_URL`, so this is not production-ready yet.

### Railway

Current `railway.toml` builds and starts the app but does not solve persistent SQLite DB or upload storage by itself.

### Docker/VPS

Most production-friendly with current SQLite/local uploads because volumes are explicit. Still needs backup strategy, TLS, monitoring, and upload auth.

## Recommended Next Phases

### Phase B - Production Persistence Decision

Decide:

- SQLite with persistent disk for staging only.
- Or Postgres for production.
- Choose upload storage provider.

Decision made:

- Use VPS + Docker app + Caddy.
- Use Postgres for production data.
- Use Cloudflare R2 or S3-compatible object storage for images.
- Use offsite DB backups.

Phase C2 progress:

- Parallel Postgres schema draft added in `db/schema.pg.ts`.
- Postgres Drizzle config added in `drizzle.pg.config.ts`.
- Initial Postgres migration generated under `drizzle/pg-migrations`.
- Runtime still uses SQLite until the dedicated cutover phase.

Phase C3 progress:

- Local Postgres validation compose file added in `docker-compose.pg.yml`.
- Postgres schema verification script added in `scripts/db-verify-postgres-schema.cjs`.
- Runtime cutover is intentionally delayed until the DB client and schema adapter can switch together.

Phase C4 progress:

- Runtime schema imports now go through `src/lib/db-schema.ts`.
- Direct `db/schema` imports inside `src` are blocked by `bun run db:check:boundary`.
- This prepares the app for a controlled DB client + schema adapter cutover.

Phase C5 progress:

- SQLite export and Postgres import scripts are available.
- Local migration test imported the current `db/dev.db` into Postgres.
- Importer skips stale orphan rows that would violate Postgres foreign keys.

Phase C6 progress:

- Postgres runtime smoke client added in `src/lib/db.postgres.ts`.
- `bun run db:smoke:pg` validates Drizzle Postgres reads plus analytics insert/select/delete.
- Runtime smoke passed against imported local data.

Phase C7 progress:

- SQLite-only `.get()`, `.all()`, and `db.run()` calls were removed from runtime app queries.
- Dialect-specific date/json SQL is centralized in `src/lib/db-sql.ts`.
- `bun run db:check:portability` now guards against runtime SQLite query patterns returning.

Phase C8 progress:

- `DB_DRIVER=postgres` now switches the runtime DB client, schema adapter, and SQL helpers together.
- `bun run build:pg` verifies the app can build against local Postgres.
- Default runtime remains SQLite unless `DB_DRIVER=postgres` is explicitly set.

Phase C9 progress:

- `bun run smoke:pg:app` starts the built app with `DB_DRIVER=postgres`.
- The app smoke checks health, home, explore, and the sample shop page against imported Postgres data.
- Latest local Postgres app smoke passed for `/api/health`, `/`, `/explore`, and `/moon-bowl-cafe`.

### Phase C - Security Hardening

Fix:

- Auth-required upload API.
- Admin role enforcement.
- Central protected API matcher.
- CI hard gates.

### Phase D - Production Config Implementation

Implement:

- Env-aware DB path.
- Updated Drizzle config.
- `.env.example` cleanup.
- README production setup.
- Healthcheck improvements.

### Phase E - Smoke Tests And Staging Deploy

Implement:

- Smoke scripts.
- Staging deploy.
- Manual QA checklist.

## Decision

DealDoor is not yet production-ready, but it is now close enough to prepare seriously. The next work should focus on persistence, storage, and security rather than broad UI rewrites or framework changes.
