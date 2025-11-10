#!/bin/bash

# Function to kill process by port
kill_port() {
    local port=$1
    local pid=$(lsof -ti :$port)
    if [ ! -z "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)"
        kill -9 $pid
    else
        echo "No process found on port $port"
    fi
}

# Function to stop PM2 processes
stop_pm2() {
    if command -v pm2 &> /dev/null; then
        echo "Stopping PM2 processes..."
        pm2 stop all
        pm2 delete all
        pm2 kill
    else
        echo "PM2 not found"
    fi
}

# Kill processes on specific ports
echo "Cleaning up ports..."
kill_port 8080  # Next.js
kill_port 3003  # Roon server

# Stop PM2 processes
stop_pm2

echo "Cleanup complete" 