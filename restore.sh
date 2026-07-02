#!/bin/bash

# ==============================================================================
# DATABASE RESTORE SCRIPT - INTELLIGENCE WHATSAPP ANALYZER
# Usage: ./restore.sh <path_to_backup_file.sql.gz>
# ==============================================================================

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore.sh <path_to_backup_file.sql.gz>"
    echo "Available backups in storage/backups/:"
    ls -l "$(dirname "$0")/storage/backups"/*.sql.gz 2>/dev/null || echo "No backups found."
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "[ERROR] Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if database container is running
if ! docker ps | grep -q "wa_intel_db"; then
    echo "[ERROR] Database container 'wa_intel_db' is not running!"
    exit 1
fi

echo "=== WARNING ==="
echo "This will OVERWRITE the current local database with the contents of $BACKUP_FILE!"
read -p "Are you absolutely sure you want to proceed? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

# Decompress backup file temporarily
TEMP_SQL="/tmp/restore_temp.sql"
echo "Decompressing backup..."
gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"

if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to decompress backup file."
    exit 1
fi

echo "Restoring database structure & data..."
# Drop and recreate database to ensure clean slate
docker exec -t wa_intel_db psql -U intel_admin -d postgres -c "DROP DATABASE IF EXISTS whatsapp_analyzer;"
docker exec -t wa_intel_db psql -U intel_admin -d postgres -c "CREATE DATABASE whatsapp_analyzer;"

# Pipe the SQL commands into the postgres container
docker exec -i wa_intel_db psql -U intel_admin -d whatsapp_analyzer < "$TEMP_SQL"

if [ $? -eq 0 ]; then
    echo "[SUCCESS] Database restored successfully from $BACKUP_FILE!"
else
    echo "[ERROR] Restore failed!"
fi

# Clean up temp file
rm -f "$TEMP_SQL"
