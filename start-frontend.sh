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

# Start the Next.js server
npm run start 