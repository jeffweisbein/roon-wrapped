#!/bin/bash

# Enable debug output
set -x

# Export NVM directory
export NVM_DIR="$HOME/.nvm"

# Source NVM
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Set working directory
cd "$(dirname "$0")"
pwd

# Print environment
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Current directory: $(pwd)"
echo "PATH: $PATH"

# Build the Next.js app first
npm run build

# Start the backend server in the background
node server/index.js &
BACKEND_PID=$!

# Wait a moment for the backend to start
sleep 5

# Start the Next.js server
npm run start

# If Next.js exits, kill the backend
kill $BACKEND_PID 