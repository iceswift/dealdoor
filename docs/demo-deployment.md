# Demo deployment on Railway

This environment contains sample data only. Never point the demo at a production database.

## Runtime

The Docker image uses Bun to install/build and Node 22 to run Astro and better-sqlite3. `scripts/start-server.mjs` starts normally unless `DEMO_MODE=true`. Demo startup applies SQLite migrations and seeds an empty database. Subsequent restarts preserve data.

Attach a persistent volume at `/data` and configure:

```dotenv
DEMO_MODE=true
DB_DRIVER=sqlite
DATABASE_URL=/data/dealdoor-demo.db
MEDIA_LOCAL_ROOT=/data/media
STORAGE_DRIVER=local
HOST=0.0.0.0
NODE_ENV=production
```

Railway supplies `PORT`. Use `/api/health` for readiness checks. New Railway services may ignore the legacy `railway.toml`; the root Dockerfile and service dashboard settings are authoritative.

## Sample accounts

| Access | Email | Password |
| --- | --- | --- |
| Free merchant | `free-demo@dealdoor.co` | `password123` |
| Pro merchant | `test@dealdoor.co` | `password123` |
| Read-only Admin | `admin@dealdoor.co` | `password123` |

The Admin restriction is enforced server-side for modifying requests, with login/logout allowed. Merchant edits are shared with other visitors. Saved deals remain browser-local. Payment providers are not configured.

There is no scheduled data reset in this initial deployment. Demo initialization only runs for an empty database; restarting the service does not reset merchant edits or replenish spent Boost credits. Back up or export data before any intentional reset.

The Free plan has limited monthly credits, memory, and storage. It can sleep or stop when credits are exhausted. It should not be presented as an always-on production service.
