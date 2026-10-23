# Demo deployment on Railway

This environment contains sample data only. Never point the demo at a production database.

## Runtime

The Docker image uses Bun to install/build and Node 22 to run Astro and better-sqlite3. `scripts/start-server.mjs` starts normally unless `DEMO_MODE=true`. Demo startup applies SQLite migrations and seeds an empty database. Subsequent restarts preserve data.

Attach a persistent volume at `/data` and configure:

```dotenv
DEMO_MODE=true
DEMO_ALLOW_REGISTRATION=false
DEMO_ALLOW_UPLOADS=false
DB_DRIVER=sqlite
DATABASE_URL=/data/dealdoor-demo.db
MEDIA_LOCAL_ROOT=/data/media
STORAGE_DRIVER=local
HOST=0.0.0.0
NODE_ENV=production
```

Railway supplies `PORT`. Use `/api/health` for readiness checks. New Railway services may ignore the legacy `railway.toml`; the root Dockerfile and service dashboard settings are authoritative.

## Custom domain builds

For the Home server, build the image with `--build-arg PUBLIC_SITE_URL=https://dealdoor.suwiwat.com` (or Compose `build.args.PUBLIC_SITE_URL`). This is a public, non-secret build-time value used for Astro site metadata, structured data, and sharing defaults. Setting only a container runtime environment variable does not rebuild the client bundle or Astro site setting. Rebuild the image when changing domains. Do not change sample account email addresses or invent replacement support/legal mailboxes; those are separate configuration/content decisions.

Keep localhost bound to `127.0.0.1:4321` with the existing host cloudflared service forwarding HTTP to it. Verify HTTPS cookies, canonical/alternate links, QR targets, and notification SSE through the actual hostname before advertising the demo.

## Sample accounts

| Access | Email | Password |
| --- | --- | --- |
| Free merchant | `free-demo@dealdoor.co` | `password123` |
| Pro merchant | `test@dealdoor.co` | `password123` |
| Read-only Admin | `admin@dealdoor.co` | `password123` |

The Admin restriction is enforced server-side for modifying requests, with login/logout allowed. Merchant edits are shared with other visitors. Saved deals remain browser-local. Payment providers are not configured.

There is no scheduled data reset in this initial deployment. Demo initialization only runs for an empty database; restarting the service does not reset merchant edits or replenish spent Boost credits. Back up or export data before any intentional reset.

The Free plan has limited monthly credits, memory, and storage. It can sleep or stop when credits are exhausted. It should not be presented as an always-on production service.

## Readiness checks

Run from the repository root after installing dependencies:

```sh
bun run test
bun run build
bun build db/seed.ts --target=node --packages=external --outfile=dist/demo-seed.mjs
bun run smoke:demo
node scripts/smoke-demo.mjs --allow-demo-writes
```

The smoke script starts and stops its own production Node server on an available loopback port. It always creates a new SQLite database and local media directory under ignored `tmp/demo-smoke-*`, ignoring the caller's database/storage paths. It never resets an existing database or contacts the hosted demo. Fixtures are retained for inspection.

Coverage includes public pages, three sample logins, merchant dashboard routes, API edits, cross-merchant ownership, server-enforced Admin read-only errors, logout invalidation, internal-job access denial, QR responses, media path traversal rejection, real PNG-to-WebP upload, and account/edit/media persistence after restart. QR unit tests check the encoded destination uses the current origin rather than a hardcoded production host.

These checks do not verify a Railway build, live HTTPS/proxy cookies, map-provider availability, visual layout, or real payment/email delivery. Repeat live login, QR scanning on a phone, and media checks once the service is online.

## Public demo safety and limitations

- Use sample data only. Do not add personal information, real customer records, real payment credentials, or production storage credentials.
- The shared merchant accounts intentionally allow edits. Visitors can change or pause sample deals and spend sample Boost credits; other visitors see those changes. Admin is inspection-only, not a way to exercise moderation writes.
- Per-file image limits and request throttling exist, but there is no aggregate demo storage quota or periodic cleanup. Monitor the volume and do not present this as an abuse-proof public sandbox.
- With `DEMO_MODE=true`, registration and file uploads are disabled by default, including direct API calls. The signup page redirects to login and image controls show existing samples without file inputs or remove buttons. Shop/deal text editing and viewing sample images remain available.
- Only for private testing, set `DEMO_ALLOW_REGISTRATION=true` or `DEMO_ALLOW_UPLOADS=true` to opt in independently. Do not enable these on the public demo. With demo mode off, normal registration/upload behavior is unchanged. The optional smoke flag tests these opt-ins against disposable local fixtures.
- There is no automatic reset/replenishment or guaranteed isolated session per visitor. Blocking file uploads prevents visitors from adding local media files; it is not a total disk quota. Content edits, analytics, reports, database growth, and logs still require monitoring and retention limits.
- Do not configure external delivery/payment integrations for this demo. Seeded contact links are sample content, not verified businesses.
- Keep Railway credentials outside the repository. The current tracked tree contains environment templates, not live environment files, SQLite databases, or project-token files; this is not a full historical secret audit.

Before advertising the live URL: verify health, all three HTTPS logins, merchant edits, read-only Admin, QR destination, uploads after restart, and current hosting credit/storage availability. A local pass alone does not establish deployment success.
