# DealDoor Postgres Migration Plan

Date: 2026-07-08  
Phase: C - Postgres Migration Plan  
Status: Planned, not implemented

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
2. Add a Postgres schema file in a later implementation phase, likely `db/schema.pg.ts`.
3. Add a Postgres Drizzle config, likely `drizzle.pg.config.ts`.
4. Add a Postgres DB client module, likely `src/lib/db.pg.ts`, or update `src/lib/db.ts` with a production-only Postgres path after tests pass.
5. Generate fresh Postgres migrations into a separate folder, likely `drizzle/pg-migrations`.
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

Next:

- Add Postgres dependency.
- Add `drizzle.pg.config.ts`.
- Add Postgres schema draft.

### Phase C2 - Postgres Schema

Create `db/schema.pg.ts`.

Generate Postgres migration.

Do not change runtime app yet.

### Phase C3 - Runtime Cutover Branch

Switch `src/lib/db.ts` to Postgres.

Run build and service smoke tests against local Docker Postgres.

### Phase C4 - Data Migration Tooling

Add export/import scripts.

Test with current `db/dev.db`.

### Phase C5 - Staging Cutover

Run Postgres app in staging.

Verify smoke tests.

## Open Decisions

- Whether local dev should also move to Postgres.
- Whether `metadata` columns should become `jsonb` during first migration or later.
- Whether shop profile split should happen before or after public launch.
- Whether Postgres is self-hosted on VPS first or managed from day one.

## Recommendation

For DealDoor, do not combine Postgres migration with shop schema normalization. First migrate the DB engine with minimal shape changes. Normalize shop-related tables later after staging is stable.
