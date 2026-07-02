#!/bin/bash

# Start the Intelligence WhatsApp Analyzer containers
echo "Starting Intelligence WhatsApp Analyzer services..."
cd "$(dirname "$0")/docker"
docker compose up -d

if [ $? -eq 0 ]; then
    echo "Services started successfully."
    echo "App is available at http://localhost"
else
    echo "Error starting services. Check docker compose logs."
fi
