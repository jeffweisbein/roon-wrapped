#!/bin/bash

# Exit on error
set -e

# Set up environment
export HOME="/Users/jeff"
export PATH="/Users/jeff/.nvm/versions/node/v18.18.2/bin:$PATH"

# Change to the app directory
cd "$(dirname "$0")"

# Ensure logs directory exists with proper permissions
mkdir -p logs
touch logs/output.log logs/error.log
chmod 644 logs/output.log logs/error.log

# Start the server with output redirection
exec node server/index.js >> logs/output.log 2>> logs/error.log 