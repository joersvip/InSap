#!/bin/bash

# ==============================================================================
# DATABASE BACKUP SCRIPT - INTELLIGENCE WHATSAPP ANALYZER
# Automated or manual database backups
# ==============================================================================

BACKUP_DIR="$(dirname "$0")/storage/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"
GZIP_FILE="$BACKUP_FILE.gz"

# Ensure the backup directory exists
mkdir -p "$BACKUP_DIR"

echo "=== Starting PostgreSQL Database Backup ==="
echo "Timestamp: $(date)"

# Check if the database container is running
if ! docker ps | grep -q "wa_intel_db"; then
    echo "[ERROR] Database container 'wa_intel_db' is not running!"
    exit 1
fi

# Run pg_dump inside the container and compress it on the host
docker exec -t wa_intel_db pg_dump -U intel_admin -d whatsapp_analyzer > "$BACKUP_FILE"

if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
    # Compress the SQL dump
    gzip "$BACKUP_FILE"
    echo "[SUCCESS] Backup completed: $GZIP_FILE"
    echo "Size: $(du -sh "$GZIP_FILE" | cut -f1)"
    
    # Update permissions
    chmod 644 "$GZIP_FILE"
    
    # --------------------------------------------------------------------------
    # Automatic Backup Retention Policy: Keep backups for 30 days
    # --------------------------------------------------------------------------
    echo "Applying retention policy (pruning backups older than 30 days)..."
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +30 -delete
    echo "Backup retention check done."
else
    echo "[ERROR] Database backup failed!"
    rm -f "$BACKUP_FILE"
    exit 1
fi
