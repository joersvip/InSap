#!/bin/bash

# ==============================================================================
# UPDATE SCRIPT - INTELLIGENCE WHATSAPP ANALYZER
# Pulls latest changes, rebuilds containers, runs migrations
# ==============================================================================

echo "=== Starting System Update ==="

# Check if git repository
if [ -d ".git" ]; then
    echo "Pulling latest code changes from Git..."
    git pull
else
    echo "[INFO] Not a git repository. Skipping git pull."
fi

echo "Rebuilding and restarting docker containers..."
cd "$(dirname "$0")/docker"
docker compose down
docker compose up -d --build

echo "Waiting for database container to boot..."
sleep 5

echo "Running Laravel database migrations..."
docker compose exec -T backend php artisan migrate --force

echo "Clearing application caches..."
docker compose exec -T backend php artisan cache:clear
docker compose exec -T backend php artisan config:clear
docker compose exec -T backend php artisan route:clear

echo "=== [SUCCESS] Intelligence WhatsApp Analyzer updated successfully! ==="
