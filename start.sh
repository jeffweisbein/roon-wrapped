#!/bin/bash

# Ensure logs directory exists
mkdir -p logs

# Kill any existing processes on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Set environment variables
export PORT=3001
export NODE_ENV=production

# Start PM2 with the ecosystem config
pm2 start ecosystem.config.js 