# DealDoor Postgres Migration Plan

Date: 2026-07-08  
Phase: C2 - Postgres Schema Draft  
Status: Postgres schema draft and first migration generated, runtime still SQLite

## Decision

DealDoor will move production data to Postgres. SQLite remains useful for local development until the Postgres schema and migration path are implemented and verified.

Target production setup:

- Runtime DB: Postgres
- ORM: Drizzle ORM
- Driver: `pg` or a Drizzle-supported Postgres driver
- Deployment: VPS Docker Compose or managed Postgres
- Backups: offsite object storage, preferably R2

## Why Not Switch Immediately

Current schema is written with SQLite primitives:

- `sqliteTable`
- `integer(..., { mode: 'timestamp' })`
- `integer(..., { mode: 'boolean' })`
- `real`

Postgres needs a different schema module:

- `pgTable`
- `timestamp`
- `boolean`
- `doublePrecision` or `numeric`
- Postgres-compatible indexes and defaults

Changing this directly in place would affect every service and page at once. The safe path is to prepare a parallel Postgres schema, verify it, then switch runtime intentionally.

## Migration Strategy

Recommended strategy:

1. Keep current SQLite schema as the local baseline.
2. Add a Postgres schema file in a later implementation phase, likely `db/schema.pg.ts`. Done.
3. Add a Postgres Drizzle config, likely `drizzle.pg.config.ts`. Done.
4. Add a Postgres DB client module, likely `src/lib/db.pg.ts`, or update `src/lib/db.ts` with a production-only Postgres path after tests pass.
5. Generate fresh Postgres migrations into a separate folder, likely `drizzle/pg-migrations`.
   Done.
6. Create a data export/import script from SQLite to Postgres.
7. Run smoke tests against Postgres.
8. Switch production runtime only after the import is verified.

Do not mix SQLite and Postgres migrations in the same migration folder.

## Dependency Changes

Expected package changes:

- Add `pg`.
- Add `@types/pg` as dev dependency if TypeScript types are needed.
- Keep `better-sqlite3` temporarily for local dev and migration/export tooling.

Potential scripts:

```json
{
  "db:generate:pg": "bunx drizzle-kit generate --config drizzle.pg.config.ts",
  "db:migrate:pg": "bunx drizzle-kit migrate --config drizzle.pg.config.ts",
  "db:studio:pg": "bunx drizzle-kit studio --config drizzle.pg.config.ts",
  "db:export:sqlite": "bun run scripts/export-sqlite-data.ts",
  "db:import:pg": "bun run scripts/import-postgres-data.ts"
}
```

## Schema Mapping

| Current SQLite | Target Postgres | Notes |
| --- | --- | --- |
| `sqliteTable` | `pgTable` | Requires new imports from `drizzle-orm/pg-core` |
| `text(...).primaryKey()` | `text(...).primaryKey()` | Keep CUID IDs for now |
| `integer(..., { mode: 'timestamp' })` | `timestamp(..., { mode: 'date' })` | Confirm Drizzle returns `Date` consistently |
| `integer(..., { mode: 'boolean' })` | `boolean(...)` | Services already expect booleans |
| `real` | `doublePrecision` | Good for lat/lng and menu price MVP |
| `text` JSON fields | `jsonb` or `text` | Keep text first for migration simplicity; move to `jsonb` later if useful |
| `date` as text | `date` or `text` | `shop_special_hours.date` and `daily_stats.date` can stay text initially |

## Table Notes

### `users`

Keep:

- `id text primary key`
- `email unique not null`
- `password_hash not null`
- `role default 'merchant'`

Change:

- timestamp columns to Postgres timestamps.

### `sessions`

Important:

- `expires_at` must be indexed eventually.
- Session lookup depends on comparing `expiresAt > new Date()`.

### `shops`

Keep wide table for first Postgres migration.

Do not split shop profile fields during the DB engine migration. Splitting `shops` should be a later data-model cleanup phase.

### `deals`

Important:

- `end_date` should be timestamp.
- Active deal indexes should be preserved.

### `menu_items`

Potential later additions:

- `category_id`
- `available`
- `updated_at`

Not required for the initial Postgres migration.

### `shop_special_hours`

Keep `date` as `text` for now because app code expects `YYYY-MM-DD` string comparisons.

### `analytics_events`

Keep raw events in Postgres initially.

Potential later optimization:

- Use partitioning or scheduled aggregation if event volume grows.
- Move `metadata` to `jsonb`.

### `daily_stats`

Can stay as aggregate fallback table.

### `notifications`

Potential improvement:

- Add index on `(user_id, read, created_at)`.
- Add index on `(shop_id, read, created_at)`.

### `reports`

Potential improvement:

- Add unique partial index for pending duplicate reports later.
- Current duplicate check is application-level only.

## Runtime DB Client Plan

Short-term local:

- `src/lib/db.ts` remains SQLite until Postgres schema exists.

Postgres implementation options:

### Option A - Environment switch in `src/lib/db.ts`

Use `DATABASE_CLIENT=sqlite|postgres`.

Pros:

- Single import path remains `src/lib/db`.
- Services do not need to change.

Cons:

- Type inference becomes trickier if SQLite and Postgres schemas live separately.

### Option B - Replace SQLite runtime with Postgres after cutover

Keep `src/lib/db.ts` as the single runtime client, but change it from SQLite to Postgres in one cutover commit.

Pros:

- Cleaner production code after migration.
- Less dual-mode complexity.

Cons:

- Local dev must move to Postgres too, or use branch/config discipline.

Recommendation:

- Use Option B for a cleaner production system.
- Keep SQLite only until Postgres is ready, then cut over intentionally.

## Data Migration Plan

### 1. Freeze Writes

Before real migration:

- Put app in maintenance mode or stop app container.
- Backup SQLite DB.
- Verify backup opens locally.

### 2. Export SQLite

Export table data in dependency order:

1. `users`
2. `sessions`
3. `merchants`
4. `shops`
5. `deals`
6. `menu_items`
7. `shop_special_hours`
8. `analytics_events`
9. `daily_stats`
10. `notifications`
11. `reports`

### 3. Transform

Transform:

- SQLite integer booleans to Postgres booleans.
- SQLite timestamp values to ISO timestamps or JS `Date`.
- JSON text fields remain text initially.

### 4. Import Postgres

Import in dependency order.

### 5. Verify Counts

For every table:

- Compare SQLite row count to Postgres row count.
- Spot-check key records:
  - test merchant user
  - main shop
  - deals
  - menu items
  - special hours
  - analytics totals

### 6. Smoke Test

Run:

- login
- dashboard load
- shop update
- deal CRUD
- menu CRUD
- special-hours CRUD
- public shop page
- explore page
- analytics track/stats

## Rollback Plan

Rollback must be possible before launch.

Minimum rollback:

- Keep old SQLite DB backup.
- Keep previous Docker image.
- Do not delete old SQLite data until Postgres has been verified.

After public traffic starts on Postgres, rollback to SQLite becomes harder because new data may exist only in Postgres.

## Implementation Phases

### Phase C1 - Plan And Config

Done in this document.

Done:

- Add `drizzle.pg.config.ts`.
- Add Postgres schema draft as `db/schema.pg.ts`.
- Add package scripts for Postgres generate/migrate/studio.

### Phase C2 - Postgres Schema

Done:

- Create `db/schema.pg.ts`.
- Generate Postgres migration in `drizzle/pg-migrations`.
- Keep Postgres migrations separate from SQLite migrations.

Do not change runtime app yet.

Current C2 note:

- Runtime remains SQLite through `src/lib/db.ts`.
- `db/schema.pg.ts` mirrors current table shape and intentionally does not normalize `shops`.
- `metadata` fields remain `text` for simpler SQLite-to-Postgres migration.
- `shop_special_hours.date` and `daily_stats.date` remain `text` because app logic expects `YYYY-MM-DD` strings.
- Generated migration: `drizzle/pg-migrations/0000_chunky_sentry.sql`.

### Phase C3 - Local Postgres Validation

Done:

- Add local Postgres compose file: `docker-compose.pg.yml`.
- Add schema verification script: `scripts/db-verify-postgres-schema.cjs`.
- Add package scripts for local Postgres lifecycle and verification.

Commands:

```bash
bun run db:pg:up
bun run db:check:pg
```

Local default `DATABASE_URL` for the Postgres Drizzle config is `postgres://dealdoor:dealdoor@localhost:54329/dealdoor`.
Set `DATABASE_URL` explicitly when testing managed Postgres or VPS Postgres.

Docker is not required for local Postgres. `docker-compose.pg.yml` is only the isolated default path. If native Postgres is installed on the laptop, use a normal local service instead:

```powershell
$env:DB_DRIVER="postgres"
$env:DATABASE_URL="postgres://dealdoor:dealdoor@localhost:5432/dealdoor"
bun run db:migrate:pg
bun run dev
```

Native local Postgres is lighter than Docker Desktop on many Windows laptops, especially when Docker Desktop keeps WSL2 memory high.

See `docs/local-postgres-options.md` for Native Postgres, Docker Postgres, and SQLite quick-mode workflows.

Keep runtime app on SQLite until the Postgres schema has been applied and verified locally.

### Phase C4 - Runtime Cutover Branch

Phase started with runtime schema boundary work.

Done:

- Add `src/lib/db-schema.ts` as the only SQLite runtime schema adapter.
- Add `src/lib/db-schema.postgres.ts` as the future Postgres schema adapter.
- Rewrite runtime imports in `src` to use `src/lib/db-schema` instead of importing `db/schema` directly.
- Add `bun run db:check:boundary` to prevent direct schema imports from coming back.

Switch the runtime DB layer to Postgres.

Important:

- App code now imports table definitions through `src/lib/db-schema.ts`.
- Postgres runtime needs the DB client and schema adapter to change together.
- Do not flip only `src/lib/db.ts`; that would pair a Postgres client with the current SQLite schema adapter.
- After this boundary step, the next cutover can change the schema adapter and DB client together.

Run build and service smoke tests against local Docker Postgres.

### Phase C5 - Data Migration Tooling

Done:

- Add shared table/column migration metadata in `scripts/db-migration-shared.cjs`.
- Add SQLite JSON export script: `scripts/db-export-sqlite.cjs`.
- Add Postgres JSON import script: `scripts/db-import-postgres.cjs`.
- Add package scripts:
  - `bun run db:export:sqlite`
  - `bun run db:import:pg`

Commands:

```bash
bun run db:export:sqlite
bun run db:pg:up
bun run db:check:pg
bun run db:import:pg
```

The Postgres importer refuses to write into non-empty target tables unless `--truncate` is passed. Use `--truncate` only for disposable local, staging, or freshly restored databases.

Local import result from the current `db/dev.db`:

- `users`: 1
- `sessions`: 7 imported, 18 orphan rows skipped
- `merchants`: 3
- `shops`: 3
- `deals`: 10
- `menu_items`: 5
- `shop_special_hours`: 22
- `analytics_events`: 408 imported, 52 orphan rows skipped
- `daily_stats`: 0
- `notifications`: 0
- `reports`: 1

Skipped orphan rows are expected cleanup from SQLite data that was allowed before Postgres foreign keys were enforced.

Test with current `db/dev.db`.

### Phase C6 - Staging Cutover

Before staging cutover, run the Postgres runtime smoke harness:

```bash
bun run db:pg:up
bun run db:check:pg
bun run db:export:sqlite
bun run db:import:pg:truncate
bun run db:smoke:pg
```

Runtime smoke status:

- `src/lib/db.postgres.ts` provides a Postgres Drizzle client for validation.
- `bun run db:smoke:pg` verifies imported data can be read through Drizzle Postgres table definitions.
- The smoke test also verifies an analytics insert/select/delete cycle.
- Latest local smoke passed against imported `db/dev.db` data:
  - `users`: 1
  - `sessions`: 7
  - `shops`: 3
  - `deals`: 10
  - `menu_items`: 5
  - `shop_special_hours`: 22
  - `analytics_events`: 408
  - `reports`: 1

Known cutover blocker:

- SQLite-only `.get()`, `.all()`, and `db.run()` calls were removed from runtime app queries.
- Runtime date/json SQL helpers are centralized in `src/lib/db-sql.ts`.
- `bun run db:check:portability` blocks SQLite-specific query helpers and SQL expressions from spreading back into app code.
- Full app cutover still needs the main `src/lib/db.ts` and `src/lib/db-schema.ts` adapter switch to happen together.

Runtime cutover switch status:

- `DB_DRIVER=sqlite` or unset keeps the app on SQLite.
- `DB_DRIVER=postgres` switches `src/lib/db.ts`, `src/lib/db-schema.ts`, and SQL helpers together.
- Production env template now sets `DB_DRIVER=postgres`.
- `bun run build:pg` builds the app with `DB_DRIVER=postgres` and local Postgres default `DATABASE_URL`.
- Latest local `bun run build:pg` passed against imported Postgres data.

Postgres app smoke:

```bash
bun run db:pg:up
bun run db:check:pg
bun run db:export:sqlite
bun run db:import:pg:truncate
bun run build:pg
bun run smoke:pg:app
```

The app smoke starts the built Astro server on port `4325` with `DB_DRIVER=postgres`, checks `/api/health`, `/`, `/explore`, and `/moon-bowl-cafe`, then shuts the server down.

Latest local app smoke passed:

- `/api/health`: 200
- `/`: 200
- `/explore`: 200
- `/moon-bowl-cafe`: 200

Run Postgres app in staging.

Verify smoke tests.

## Open Decisions

- Whether local dev should also move to Postgres.
- Whether `metadata` columns should become `jsonb` during first migration or later.
- Whether shop profile split should happen before or after public launch.
- Whether Postgres is self-hosted on VPS first or managed from day one.

## Recommendation

For DealDoor, do not combine Postgres migration with shop schema normalization. First migrate the DB engine with minimal shape changes. Normalize shop-related tables later after staging is stable.
