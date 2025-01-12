#!/bin/bash

# Exit on error
set -e

# Set up environment
WORKSPACE="/Users/jeff/Documents/GitHub/roon-wrapped"
SERVICE_DIR="/usr/local/var/roon-wrapped"
SERVICE_NAME="com.cackles.roon-wrapped"
PLIST_PATH="$HOME/Library/LaunchAgents/$SERVICE_NAME.plist"

# Create service directory with proper permissions
sudo mkdir -p "$SERVICE_DIR"
sudo chown -R jeff:staff "$SERVICE_DIR"
sudo chmod -R 755 "$SERVICE_DIR"

# Create log files with proper permissions
sudo touch "$SERVICE_DIR/output.log" "$SERVICE_DIR/error.log"
sudo chown jeff:staff "$SERVICE_DIR/output.log" "$SERVICE_DIR/error.log"
sudo chmod 666 "$SERVICE_DIR/output.log" "$SERVICE_DIR/error.log"

# Ensure the workspace has proper permissions
sudo chown -R jeff:staff "$WORKSPACE"
sudo chmod -R 755 "$WORKSPACE"

# Ensure node executable has proper permissions
sudo chmod 755 /Users/jeff/.nvm/versions/node/v20.11.1/bin/node

# Install dependencies
cd "$WORKSPACE"
npm install

# Build the Next.js app
npm run build

# Stop any existing node processes
pkill -f "node.*server/index.js" || true

# Unload the service if it exists
launchctl unload "$PLIST_PATH" 2>/dev/null || true

# Copy the plist file to LaunchAgents
mkdir -p "$HOME/Library/LaunchAgents"
cp "$WORKSPACE/$SERVICE_NAME.plist" "$PLIST_PATH"
chmod 644 "$PLIST_PATH"

# Load the service
launchctl load "$PLIST_PATH"

echo "Service setup complete. Check logs at $SERVICE_DIR" 