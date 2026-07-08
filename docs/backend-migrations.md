# Backend Migrations

Last updated: 2026-07-08

## Purpose

This project now uses Drizzle migrations as the source of truth for database structure.

Do not manually alter `db/dev.db` as the main migration path. Manual SQL may be used only for emergency repair, and the matching schema/migration must be added immediately afterward.

## Files

- Schema: `db/schema.ts`
- Drizzle config: `drizzle.config.ts`
- Migration folder: `drizzle/migrations`
- Current baseline migration: `drizzle/migrations/0000_perpetual_chamber.sql`
- Seed script: `db/seed.ts`
- Existing DB baseline helper: `scripts/db-baseline-existing.cjs`
- Schema check helper: `scripts/db-check-schema.cjs`

## Commands

Generate a new migration after editing `db/schema.ts`:

```bash
pnpm db:generate
```

Apply pending migrations:

```bash
pnpm db:migrate
```

Check that the current SQLite database contains the expected tables and columns:

```bash
npm run db:check
```

Record the current migration baseline for an existing database that already has all app tables:

```bash
npm run db:baseline
```

Seed development data:

```bash
pnpm db:seed
```

Warning: `db:seed` clears existing dev data before inserting seed data. Treat it as dev-only.

## Fresh Local Database Flow

Use this when `db/dev.db` does not exist or you intentionally start from an empty database.

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm build
```

## Existing Local Database Flow

Use this when `db/dev.db` already exists and already contains the current app tables.

```bash
npm run db:check
npm run db:baseline
pnpm db:migrate
pnpm build
```

`db:baseline` creates/updates the `__drizzle_migrations` table and records the current migration hash. It does not create app tables. It refuses to run if required app tables are missing.

## Adding A New Database Change

1. Edit `db/schema.ts`.
2. Run `pnpm db:generate`.
3. Review the generated SQL in `drizzle/migrations`.
4. Run `pnpm db:migrate`.
5. Run `npm run db:check`.
6. Run `pnpm build`.
7. Update this document if the workflow changes.

## Current Baseline Notes

The current baseline includes:

- Vacation mode fields on `shops`
- Shop contact/profile/accessibility/payment/parking/pet/family fields
- `menu_items`
- `shop_special_hours`
- Analytics, daily stats, notifications, and reports

This baseline was created after rescue work. Existing local `db/dev.db` has been marked with `npm run db:baseline` so future `pnpm db:migrate` runs do not try to recreate existing tables.

## Rules During Backend Freeze

- New tables/columns require a generated migration.
- Public pages and API routes should not grow more direct DB business logic unless it is a narrow bug fix.
- Dashboard mutations must resolve the shop from the authenticated user/merchant context.
- Do not rely on `db:push` for production-like schema changes.
- Do not run `db:seed` against data you want to keep.

