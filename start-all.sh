#!/bin/bash

# Roon Wrapped Unified Start Script
# Usage: ./start-all.sh [frontend|server|minimal|all]

# Default mode
MODE=${1:-"all"}

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Function to check if a process is running
is_running() {
    pgrep -f "$1" >/dev/null
}

# Function to start the server
start_server() {
    echo -e "${BLUE}Starting Roon Wrapped server...${NC}"
    if is_running "node server.js"; then
        echo -e "${RED}Server is already running${NC}"
    else
        NODE_ENV=production node server.js &
        echo -e "${GREEN}Server started${NC}"
    fi
}

# Function to start the frontend
start_frontend() {
    echo -e "${BLUE}Starting Roon Wrapped frontend...${NC}"
    if is_running "next"; then
        echo -e "${RED}Frontend is already running${NC}"
    else
        npm run build
        NODE_ENV=production npm run start &
        echo -e "${GREEN}Frontend started${NC}"
    fi
}

# Function to start minimal mode (server only with reduced features)
start_minimal() {
    echo -e "${BLUE}Starting Roon Wrapped in minimal mode...${NC}"
    if is_running "node server.js"; then
        echo -e "${RED}Server is already running${NC}"
    else
        NODE_ENV=production MINIMAL_MODE=true node server.js &
        echo -e "${GREEN}Minimal mode started${NC}"
    fi
}

# Main execution
case $MODE in
    "server")
        start_server
        ;;
    "frontend")
        start_frontend
        ;;
    "minimal")
        start_minimal
        ;;
    "all")
        start_server
        sleep 2
        start_frontend
        ;;
    *)
        echo -e "${RED}Invalid mode. Use: frontend, server, minimal, or all${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}Done! Check the logs for more details.${NC}" 