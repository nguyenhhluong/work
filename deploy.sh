#!/bin/bash

# OmniChat 1-Click Deploy Script
# This script automates the Docker build and deployment process.

set -e

echo "🚀 Starting OmniChat Deployment..."

# Check for .env file
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating template..."
    echo "GEMINI_API_KEY=your_key_here" > .env
    echo "Please edit the .env file with your Gemini API Key before proceeding."
    exit 1
fi

# Load variables
export $(grep -v '^#' .env | xargs)

echo "📦 Building Docker containers..."
docker-compose down || true
docker-compose build --no-cache

echo "🚢 Launching OmniChat in production mode..."
docker-compose up -d

echo "✅ Deployment Successful!"
echo "🌐 App is now running at: http://localhost:3000"
echo "🛠️  Check logs with: docker-compose logs -f"
