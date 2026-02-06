#!/bin/bash

PLIST_PATH="$HOME/Library/LaunchAgents/com.roon-wrapped.server.plist"

echo "🛑 Stopping Roon Wrapped server..."
launchctl unload "$PLIST_PATH" 2>/dev/null || true

if [ -f "$PLIST_PATH" ]; then
    rm "$PLIST_PATH"
    echo "✅ Launch agent removed"
else
    echo "ℹ️  Launch agent was not installed"
fi
