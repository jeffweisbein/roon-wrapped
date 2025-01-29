#!/bin/bash

# Configuration
DATA_DIR="data"
HISTORY_FILE="$DATA_DIR/listening-history.json"
BACKUP_DIR="$DATA_DIR/backups"

# Function to check if jq is installed (for JSON validation)
check_jq() {
    if ! command -v jq &> /dev/null; then
        echo "Warning: jq is not installed. JSON validation will be skipped."
        return 1
    fi
    return 0
}

# Create directories with proper permissions
echo "Setting up directory structure..."
mkdir -p "$DATA_DIR"
mkdir -p "$BACKUP_DIR"
chmod 755 "$DATA_DIR"
chmod 755 "$BACKUP_DIR"

# Create empty listening history file if it doesn't exist
if [ ! -f "$HISTORY_FILE" ]; then
    echo "Creating empty listening history file..."
    echo "[]" > "$HISTORY_FILE"
    chmod 644 "$HISTORY_FILE"
fi

# Validate JSON structure
if [ -f "$HISTORY_FILE" ]; then
    echo "Validating listening history file..."
    if check_jq; then
        if ! jq empty "$HISTORY_FILE" 2>/dev/null; then
            echo "Error: Invalid JSON structure in $HISTORY_FILE"
            echo "Creating backup and reinitializing..."
            cp "$HISTORY_FILE" "${HISTORY_FILE}.bak-$(date +%Y%m%d%H%M%S)"
            echo "[]" > "$HISTORY_FILE"
        else
            echo "JSON structure is valid."
        fi
    fi
fi

# Create .gitkeep in backup directory
touch "$BACKUP_DIR/.gitkeep"

echo "Setup complete!" 