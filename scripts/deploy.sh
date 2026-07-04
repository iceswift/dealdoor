#!/bin/bash
# DealDoor - Deploy Script

set -e

echo "🚀 Deploying DealDoor..."
echo ""

# Run tests
echo "🧪 Running tests..."
pnpm test || true

# Build application
echo "🔨 Building application..."
pnpm build

# Backup database
echo "💾 Backing up database..."
./scripts/backup.sh || true

# Restart application (if using PM2)
if command -v pm2 &> /dev/null; then
    echo "🔄 Restarting application..."
    pm2 restart dealdoor || pm2 start ecosystem.config.js
else
    echo "⚠️ PM2 not found. Starting with node..."
    node dist/server/entry.mjs &
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Application should be running at:"
echo "   http://localhost:4321"
