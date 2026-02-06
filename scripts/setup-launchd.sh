#!/bin/bash
set -e

# Roon Wrapped - Launch Agent Setup Script
# Run this to auto-start the server on boot

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PLIST_NAME="com.roon-wrapped.server.plist"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME"
NODE_PATH=$(which node)

echo "🎵 Roon Wrapped - Launch Agent Setup"
echo "======================================"
echo "Project: $PROJECT_DIR"
echo "Node: $NODE_PATH"
echo ""

# Check if node exists
if [ -z "$NODE_PATH" ]; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

# Stop existing service if running
if launchctl list | grep -q "com.roon-wrapped.server"; then
    echo "⏹️  Stopping existing service..."
    launchctl unload "$PLIST_PATH" 2>/dev/null || true
fi

# Create the plist file
echo "📝 Creating launch agent..."
cat > "$PLIST_PATH" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.roon-wrapped.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NODE_PATH</string>
        <string>$PROJECT_DIR/server/index.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$PROJECT_DIR/logs/server.log</string>
    <key>StandardErrorPath</key>
    <string>$PROJECT_DIR/logs/server.error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
</dict>
</plist>
PLIST

# Load the service
echo "🚀 Starting service..."
launchctl load "$PLIST_PATH"

# Wait and check status
sleep 2
if launchctl list | grep -q "com.roon-wrapped.server"; then
    echo ""
    echo "✅ Roon Wrapped server is running!"
    echo ""
    echo "Useful commands:"
    echo "  View logs:    tail -f $PROJECT_DIR/logs/server.log"
    echo "  Stop:         launchctl unload $PLIST_PATH"
    echo "  Start:        launchctl load $PLIST_PATH"
    echo "  Restart:      launchctl unload $PLIST_PATH && launchctl load $PLIST_PATH"
else
    echo "❌ Failed to start. Check logs at $PROJECT_DIR/logs/"
    exit 1
fi
