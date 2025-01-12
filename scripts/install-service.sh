#!/bin/bash

# Ensure script is run with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Please run with sudo"
    exit 1
fi

# Get the actual user who ran sudo
ACTUAL_USER=$(logname)
USER_HOME=$(eval echo ~$ACTUAL_USER)

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Navigate to project directory
cd "$(dirname "$0")/.."

# Ensure all dependencies are installed
echo "Installing dependencies..."
npm install

# Build the Next.js application
echo "Building Next.js application..."
npm run build

# Start the application with PM2
echo "Starting application with PM2..."
pm2 start ecosystem.config.js

# Save the PM2 process list
echo "Saving PM2 process list..."
pm2 save

# Setup PM2 to start on boot
echo "Setting up PM2 startup script..."
pm2 startup | grep "sudo env" > startup_command.txt
STARTUP_CMD=$(cat startup_command.txt)
eval "$STARTUP_CMD"
rm startup_command.txt

# Set proper ownership
chown -R $ACTUAL_USER:$ACTUAL_USER "$USER_HOME/.pm2"

echo "Installation complete!"
echo "The application will now start automatically on system boot."
echo "You can manage the application with these commands:"
echo "  pm2 status            - View status"
echo "  pm2 logs roon-wrapped - View logs"
echo "  pm2 restart roon-wrapped - Restart application" 