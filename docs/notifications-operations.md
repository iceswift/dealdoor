# Notification Operations

## Local development

Run a scan manually when testing notification rules:

```powershell
bun run notifications:scan
```

The local command uses Node internally because `better-sqlite3` does not run directly under Bun on Windows.

## Production scheduler

`docker-compose.prod.yml` includes a `scheduler` service. It calls the app's protected internal endpoint once per hour by default.

Before deployment, set a long random `NOTIFICATION_SCAN_SECRET` in `.env.production`. The endpoint rejects requests if that value is absent or incorrect.

Useful production checks:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f scheduler
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

Set `NOTIFICATION_SCAN_INTERVAL_SECONDS=900` for a 15-minute scan if near-real-time expiry notices are needed. One hour is the recommended initial setting because the scanner is idempotent and does not need a persistent worker.

## Current delivery channels

The system delivers in-app notifications only. A provider-neutral outbox records delivery state; email and web push can be added later as separate providers with their own verified credentials and opt-in flows.

## Realtime updates

Logged-in users receive in-app unread-count updates through Server-Sent Events at `/api/notifications/stream`. The UI keeps its normal periodic fetch as a fallback, so closing a proxy connection does not hide new notifications.

For Caddy, no additional configuration is required. For a proxy that buffers responses, preserve the `X-Accel-Buffering: no` header and do not buffer `text/event-stream` responses.
