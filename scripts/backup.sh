#!/bin/bash
# DealDoor - Database Backup Script

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_PATH="./db/dev.db"
BACKUP_FILE="$BACKUP_DIR/dealdoor_$TIMESTAMP.db"

echo "💾 Backing up database..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Database not found at $DB_PATH"
    exit 1
fi

# Create backup
cp "$DB_PATH" "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

echo "✅ Backup created: ${BACKUP_FILE}.gz"

# Keep only last 30 backups
ls -t "$BACKUP_DIR"/dealdoor_*.db.gz 2>/dev/null | tail -n +31 | xargs rm -f 2>/dev/null

echo "📁 Backups in $BACKUP_DIR:"
ls -lh "$BACKUP_DIR"/dealdoor_*.db.gz 2>/dev/null | tail -5
