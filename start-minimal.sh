#!/bin/bash

# Exit on error
set -e

# Set up environment
export HOME="/Users/jeff"
export PATH="/Users/jeff/.nvm/versions/node/v18.18.2/bin:$PATH"
export NODE_PATH="/Users/jeff/.nvm/versions/node/v18.18.2/lib/node_modules"

# Change to the app directory
cd "$(dirname "$0")"

# Create logs directory if it doesn't exist
mkdir -p logs

# Install dependencies if needed
npm install --silent

# Start only the server (not the Next.js app)
exec node server/index.js 2>> logs/error.log >> logs/output.log 