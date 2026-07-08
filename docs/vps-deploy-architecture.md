# DealDoor VPS Deploy Architecture

Date: 2026-07-08  
Phase: B - VPS Deploy Architecture  
Decision: VPS + Docker app + Caddy + Postgres + Cloudflare R2 for images and offsite backups

## Architecture

```text
Internet
  |
  | HTTPS
  v
Caddy on VPS
  |
  | reverse_proxy app:4321
  v
DealDoor Astro app container
  |
  | DATABASE_URL
  v
Postgres

DealDoor app
  |
  | S3-compatible API
  v
Cloudflare R2 or another cloud object storage

Postgres backup job
  |
  | encrypted/compressed dump
  v
Offsite bucket, preferably R2
```

## Deployment Choice

Recommended first production shape:

- VPS runs Docker Compose.
- Caddy handles HTTPS and reverse proxy.
- App runs as a Docker container.
- Postgres runs either:
  - inside Docker Compose on the VPS for early production, or
  - as managed Postgres when traffic/data becomes important enough.
- Images are stored in Cloudflare R2 or compatible object storage.
- DB backups are exported out of the VPS to offsite object storage.

This keeps VPS control and cost low while avoiding the most dangerous single-machine failure: losing uploaded images and DB backups together.

## Services

### `caddy`

Responsibilities:

- Terminate HTTPS.
- Auto-renew TLS certificates.
- Reverse proxy to `app:4321`.
- Add compression and basic security headers where useful.

### `app`

Responsibilities:

- Run Astro server output.
- Serve public pages and dashboard.
- Talk to Postgres through `DATABASE_URL`.
- Send uploads to object storage in production.

### `postgres`

Responsibilities:

- Store application data.
- Use a persistent Docker volume on the VPS if self-hosted.
- Must have offsite backups.

### `backup`

Responsibilities:

- Dump Postgres on a schedule.
- Compress backup.
- Upload to R2 or another cloud bucket.
- Keep local temporary files short-lived.

The initial `docker-compose.prod.yml` includes app, Caddy, and Postgres. The backup service is documented as a required next step because provider credentials and backup retention policy should be decided before implementation.

## DNS

Suggested records:

- `A dealdoor.co -> VPS_PUBLIC_IP`
- `A www.dealdoor.co -> VPS_PUBLIC_IP`

If using Cloudflare DNS:

- Proxy can be on or off.
- If proxy is on, set SSL mode to Full or Full (strict).
- Keep Caddy serving valid certificates.

## Environment Variables

Required for VPS production:

- `NODE_ENV=production`
- `HOST=0.0.0.0`
- `PORT=4321`
- `SITE_URL=https://dealdoor.co`
- `PUBLIC_SITE_URL=https://dealdoor.co`
- `DATABASE_URL=postgres://dealdoor:${POSTGRES_PASSWORD}@postgres:5432/dealdoor`
- `POSTGRES_DB=dealdoor`
- `POSTGRES_USER=dealdoor`
- `POSTGRES_PASSWORD=<strong secret>`

Required for R2 or compatible object storage:

- `STORAGE_DRIVER=r2`
- `R2_ACCOUNT_ID=<account id>`
- `R2_ACCESS_KEY_ID=<access key>`
- `R2_SECRET_ACCESS_KEY=<secret key>`
- `R2_BUCKET_NAME=<bucket>`
- `R2_PUBLIC_BASE_URL=https://media.dealdoor.co`

Required for backup:

- `BACKUP_BUCKET_NAME=<bucket>`
- `BACKUP_RETENTION_DAYS=14`
- `BACKUP_ENCRYPTION_KEY=<secret if backup encryption is implemented>`

## Current Code Gaps Before This Can Run Production

The production architecture is decided, but code is not fully ready for it yet.

P0 gaps from Phase A:

- Runtime DB still uses SQLite in `src/lib/db.ts`.
- Drizzle config still targets SQLite.
- Upload API stores local files and allows unauthenticated upload.
- Admin routes are too permissive.
- Middleware protected API matcher is incomplete.

Phase C should handle Postgres migration. Phase D should handle R2 storage.

Phase C planning is documented in `docs/postgres-migration-plan.md`. The recommended approach is to keep the SQLite schema stable while drafting a parallel Postgres schema, then cut over in a dedicated implementation phase after smoke tests pass.

## VPS Directory Layout

Suggested:

```text
/opt/dealdoor
  docker-compose.prod.yml
  Caddyfile
  .env.production
  data/
    postgres/
  backups/
```

Do not store long-term uploads in this directory once R2 is enabled.

## Deployment Flow

1. Point DNS to VPS.
2. Install Docker and Docker Compose plugin.
3. Put `.env.production` on VPS.
4. Start services:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

5. Run migrations once Postgres migration work is complete.
6. Verify:

```bash
curl -f https://dealdoor.co/api/health
```

7. Run smoke tests.

## Backup Plan

Minimum acceptable backup plan:

- Nightly Postgres dump.
- Upload dump to offsite storage.
- Keep at least 14 daily backups.
- Test restore before public launch.

Recommended command shape:

```bash
pg_dump "$DATABASE_URL" | gzip > "dealdoor-$(date +%F).sql.gz"
```

Upload command depends on chosen provider. For Cloudflare R2, `rclone` or an S3-compatible CLI is recommended.

## Rollback Plan

Minimum rollback:

- Keep previous Docker image tag.
- Keep latest successful DB backup.
- Avoid destructive migrations without a backup.

Recommended production deploy rule:

- Deploy app code only after `build`, `db:check`, and smoke tests pass.
- Run schema migrations separately and visibly.
- Back up DB before migrations.

## Recommendation

Proceed with this architecture, but do not deploy public production until Phase C and Phase D are complete:

- Phase C: Postgres migration plan and implementation.
- Phase D: R2 upload storage and authenticated upload hardening.
- Phase E: production hardening, CI gates, and smoke tests.
