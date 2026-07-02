#!/bin/bash

# Restart the Intelligence WhatsApp Analyzer containers
echo "Restarting Intelligence WhatsApp Analyzer services..."
cd "$(dirname "$0")/docker"
docker compose restart

if [ $? -eq 0 ]; then
    echo "Services restarted successfully."
else
    echo "Error restarting services."
fi
