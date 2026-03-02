#!/bin/bash
set -e

echo "🚀 Starting deployment sequence for TrackyJobby (trackyjobby.com)..."

# Ensure we have the latest code
echo "📦 Pulling latest code from GitHub..."
git pull origin main

# Build and start the Docker containers
echo "🐳 Building and starting Docker containers in detached mode..."
docker compose up --build -d

echo ""
echo "✅ Deployment successful! Containers are running:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "ℹ️  Frontend is internally mapped to 127.0.0.1:3000"
echo "ℹ️  Backend API is internally mapped to 127.0.0.1:3001"
echo "Make sure your host Nginx server block is proxying trackyjobby.com to these internal ports!"
