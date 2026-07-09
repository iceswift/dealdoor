# Local Postgres Options

DealDoor uses Bun as the project runner. Prefer `bun run ...` for all local workflows.

## Option A - Native Postgres

Use this when Docker Desktop feels too heavy for the laptop.

Recommended local connection:

```text
postgres://dealdoor:dealdoor@localhost:5432/dealdoor
```

PowerShell setup:

```powershell
$env:DB_DRIVER="postgres"
$env:DATABASE_URL="postgres://dealdoor:dealdoor@localhost:5432/dealdoor"
bun run db:migrate:pg
bun run db:export:sqlite
bun run db:import:pg:truncate
bun run dev
```

Create the database once with a local Postgres admin user:

```sql
create user dealdoor with password 'dealdoor';
create database dealdoor owner dealdoor;
```

Native Postgres is often lighter than Docker Desktop on Windows because it avoids keeping a Docker/WSL VM running.

## Option B - Docker Postgres

Use this when you want isolation and a known clean environment.

```powershell
bun run db:pg:up
bun run db:check:pg
bun run db:export:sqlite
bun run db:import:pg:truncate
$env:DB_DRIVER="postgres"
$env:DATABASE_URL="postgres://dealdoor:dealdoor@localhost:54329/dealdoor"
bun run dev
```

Stop Docker Postgres:

```powershell
bun run db:pg:down
```

## Option C - SQLite Quick Mode

Use this for fast UI work when database parity is not important.

```powershell
Remove-Item Env:DB_DRIVER -ErrorAction SilentlyContinue
bun run dev
```

SQLite is still useful as a quick fallback, but Postgres local should be preferred before feature QA and deploy checks.
