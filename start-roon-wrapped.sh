#!/bin/bash

# Roon Wrapped Startup Script
# This script starts the Roon Wrapped application at system startup

# Set up environment
export NODE_ENV=development
export PATH="/Users/jeff/.nvm/versions/node/v20.11.1/bin:$PATH"
export NVM_DIR="$HOME/.nvm"

# Source nvm if available
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Change to app directory
cd "/Volumes/SSD RAID/code/roon-wrapped"

# Create logs directory if it doesn't exist
mkdir -p logs

# Log startup
echo "$(date): Starting Roon Wrapped..." >> logs/startup.log

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Use absolute paths for node and npm
NODE_PATH="/Users/jeff/.nvm/versions/node/v20.11.1/bin/node"
NPM_PATH="/Users/jeff/.nvm/versions/node/v20.11.1/bin/npm"
PM2_PATH="/Users/jeff/.nvm/versions/node/v20.11.1/bin/pm2"

# Install dependencies if needed (in case of updates)
if [ ! -d "node_modules" ]; then
    echo "$(date): Installing dependencies..." >> logs/startup.log
    $NPM_PATH install >> logs/startup.log 2>&1
fi

# Kill any existing PM2 processes for this app
echo "$(date): Cleaning up existing processes..." >> logs/startup.log
$NPM_PATH run cleanup >> logs/startup.log 2>&1 || true

# Wait a moment for cleanup
sleep 2

# Start the application
echo "$(date): Starting application..." >> logs/startup.log
if [ "$NODE_ENV" = "production" ]; then
    # Build if needed
    if [ ! -d ".next" ]; then
        echo "$(date): Building Next.js app for production..." >> logs/startup.log
        $NPM_PATH run build >> logs/startup.log 2>&1
    fi
    $NPM_PATH run start >> logs/startup.log 2>&1
else
    # Development mode
    $NPM_PATH run dev >> logs/startup.log 2>&1
fi

# Check if startup was successful
if [ $? -eq 0 ]; then
    echo "$(date): Application started successfully" >> logs/startup.log
else
    echo "$(date): Failed to start application" >> logs/startup.log
    exit 1
fi

# Keep the script running to maintain the launchd job
# PM2 will handle the actual process management
while true; do
    # Check if PM2 processes are running
    if ! $PM2_PATH list | grep -q "roon-wrapped"; then
        echo "$(date): PM2 processes not found, restarting..." >> logs/startup.log
        $NPM_PATH run start >> logs/startup.log 2>&1
    fi
    
    # Sleep for 5 minutes before checking again
    sleep 300
done