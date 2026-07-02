#!/bin/bash

# Stop the Intelligence WhatsApp Analyzer containers
echo "Stopping Intelligence WhatsApp Analyzer services..."
cd "$(dirname "$0")/docker"
docker compose down

if [ $? -eq 0 ]; then
    echo "Services stopped successfully."
else
    echo "Error stopping services."
fi
