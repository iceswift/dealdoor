# DealDoor — Deployment & DevOps Design

---

## 1. Overview

This document covers deployment strategies, CI/CD, environment configuration, and production setup.

---

## 2. Environments

| Environment | Purpose | URL | Database |
|-------------|---------|-----|----------|
| Local | Development | `localhost:4321` | `dev.db` (local) |
| Staging | Testing | `staging.dealdoor.co` | `staging.db` |
| Production | Live | `dealdoor.co` | `prod.db` / D1 |

---

## 3. Local Development

### 3.1 Setup Script

```bash
#!/bin/bash
# scripts/setup.sh

echo "🚀 Setting up DealDoor..."

# Install dependencies
pnpm install

# Copy env file
cp .env.example .env

# Generate database migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

echo "✅ Setup complete! Run 'pnpm dev' to start."
```

### 3.2 `.env.example`

```env
# Site
SITE_URL=http://localhost:4321
PUBLIC_SITE_URL=http://localhost:4321

# Database
DATABASE_URL=./db/dev.db

# Auth (future)
AUTH_SECRET=your-secret-here

# Image Upload
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=2097152

# External Services (future)
PLAUSIBLE_DOMAIN=localhost
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_DOMAIN=
```

### 3.3 Development Scripts

```json
{
  "scripts": {
    "dev": "astro dev",
    "dev:host": "astro dev --host",
    "build": "astro build",
    "preview": "astro preview",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:seed": "tsx db/seed.ts",
    "db:studio": "drizzle-kit studio",
    "db:reset": "rm -f db/dev.db && pnpm db:push && pnpm db:seed",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

---

## 4. Docker Setup

### 4.1 Dockerfile

```dockerfile
# Dockerfile

FROM node:20-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

RUN addgroup --system --gid 1001 astro
RUN adduser --system --uid 1001 astro

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/db ./db

RUN mkdir -p /app/db /app/public/uploads
RUN chown -R astro:astro /app

USER astro

EXPOSE 4321

CMD ["node", "dist/server/entry.mjs"]
```

### 4.2 Docker Compose

```yaml
# docker-compose.yml

version: '3.8'

services:
  app:
    build: .
    ports:
      - "4321:4321"
    volumes:
      - ./db:/app/db
      - ./public/uploads:/app/public/uploads
    environment:
      - NODE_ENV=production
      - DATABASE_URL=/app/db/prod.db
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4321/"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: Nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - app
```

### 4.3 Docker Compose (Development)

```yaml
# docker-compose.dev.yml

version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "4321:4321"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: pnpm dev --host
```

```dockerfile
# Dockerfile.dev

FROM node:20-alpine
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .

EXPOSE 4321

CMD ["pnpm", "dev", "--host"]
```

---

## 5. CI/CD Pipeline

### 5.1 GitHub Actions

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:unit
      - run: pnpm test:integration

  e2e:
    name: E2E
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: npx playwright install --with-deps
      - run: pnpm test:e2e

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/
```

### 5.2 Deploy Pipeline

```yaml
# .github/workflows/deploy.yml

name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      
      # Deploy to staging (example: Render)
      - name: Deploy to Render
        uses: bounceapp/render-action@0.6.0
        with:
          render-token: ${{ secrets.RENDER_TOKEN }}
          service-id: ${{ secrets.RENDER_STAGING_SERVICE_ID }}
          wait-for-server: true

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      
      # Deploy to production
      - name: Deploy to Render
        uses: bounceapp/render-action@0.6.0
        with:
          render-token: ${{ secrets.RENDER_TOKEN }}
          service-id: ${{ secrets.RENDER_PRODUCTION_SERVICE_ID }}
          wait-for-server: true
```

---

## 6. Platform-Specific Deployment

### 6.1 Render.com

```yaml
# render.yaml

services:
  - type: web
    name: dealdoor
    runtime: node
    buildCommand: pnpm install && pnpm build
    startCommand: node dist/server/entry.mjs
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        value: /opt/render/project/src/db/prod.db
    disk:
      name: dealdoor-db
      mountPath: /opt/render/project/src/db
      sizeGB: 1
```

### 6.2 Railway.app

```toml
# railway.toml

[build]
builder = "nixpacks"
buildCommand = "pnpm install && pnpm build"

[deploy]
startCommand = "node dist/server/entry.mjs"
healthcheckPath = "/"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
```

### 6.3 Fly.io

```toml
# fly.toml

app = "dealdoor"
primary_region = "bkk"

[build]

[env]
  NODE_ENV = "production"
  PORT = "4321"

[http_service]
  internal_port = 4321
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true

[[http_service.checks]]
  grace_period = "10s"
  interval = "30s"
  method = "GET"
  timeout = "5s"
  path = "/"

[mounts]
  source = "dealdoor_data"
  destination = "/app/db"
```

### 6.4 VPS (Nginx + PM2)

```nginx
# /etc/nginx/sites-available/dealdoor

server {
    listen 80;
    server_name dealdoor.co www.dealdoor.co;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dealdoor.co www.dealdoor.co;

    ssl_certificate /etc/letsencrypt/live/dealdoor.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dealdoor.co/privkey.pem;

    location / {
        proxy_pass http://localhost:4321;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        alias /var/www/dealdoor/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

```javascript
// ecosystem.config.js (PM2)

module.exports = {
  apps: [{
    name: 'dealdoor',
    script: 'dist/server/entry.mjs',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4321,
    },
    max_memory_restart: '512M',
    exp_backoff_restart_delay: 100,
  }],
};
```

---

## 7. Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Environment mode |
| `PORT` | No | `4321` | Server port |
| `HOST` | No | `localhost` | Server host |
| `SITE_URL` | Yes | - | Public site URL |
| `DATABASE_URL` | Yes | `./db/dev.db` | SQLite database path |
| `AUTH_SECRET` | Future | - | Authentication secret |
| `UPLOAD_DIR` | No | `./public/uploads` | Image upload directory |
| `MAX_FILE_SIZE` | No | `2097152` | Max upload size (bytes) |
| `R2_ACCOUNT_ID` | Future | - | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Future | - | R2 access key |
| `R2_SECRET_ACCESS_KEY` | Future | - | R2 secret key |
| `R2_BUCKET_NAME` | Future | - | R2 bucket name |
| `R2_DOMAIN` | Future | - | R2 public domain |

---

## 8. Database Backup

### 8.1 Backup Script

```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_PATH="./db/prod.db"

mkdir -p $BACKUP_DIR

# Create backup
sqlite3 $DB_PATH ".backup '$BACKUP_DIR/dealdoor_$TIMESTAMP.db'"

# Compress
gzip "$BACKUP_DIR/dealdoor_$TIMESTAMP.db"

# Keep only last 30 backups
ls -t $BACKUP_DIR/dealdoor_*.db.gz | tail -n +31 | xargs rm -f 2>/dev/null

echo "✅ Backup created: dealdoor_$TIMESTAMP.db.gz"
```

### 8.2 Automated Backups (Cron)

```bash
# Add to crontab: crontab -e

# Daily backup at 3 AM
0 3 * * * /var/www/dealdoor/scripts/backup.sh

# Weekly cleanup
0 4 * * 0 /var/www/dealdoor/scripts/cleanup-uploads.sh
```

---

## 9. Rollback Strategy

### 9.1 Quick Rollback (Render/Railway)

```bash
# Rollback to previous deploy
render deploys rollback --service-id <service-id>
```

### 9.2 Manual Rollback (VPS)

```bash
# Restore database
cp ./backups/dealdoor_20250701_030000.db ./db/prod.db

# Restart app
pm2 restart dealdoor
```

---

## 10. File Structure

```
dealdoor/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── scripts/
│   ├── setup.sh
│   ├── backup.sh
│   └── cleanup-uploads.sh
├── Dockerfile
├── Dockerfile.dev
├── docker-compose.yml
├── docker-compose.dev.yml
├── render.yaml
├── railway.toml
├── fly.toml
├── ecosystem.config.js
├── .env.example
└── .env
```
