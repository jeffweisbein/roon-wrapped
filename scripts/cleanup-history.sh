#!/bin/bash

# Configuration
HISTORY_DIR="data"
BACKUP_PATTERN="listening-history.json.*"
MAX_BACKUPS=3  # Keep last 3 backups

# Find all backup files and sort by modification time (newest first)
backup_files=$(find "$HISTORY_DIR" -name "$BACKUP_PATTERN" -type f -print0 | \
  xargs -0 ls -t)

# Count total backups
total_backups=$(echo "$backup_files" | wc -l)

# If we have more than MAX_BACKUPS, delete the oldest ones
if [ "$total_backups" -gt "$MAX_BACKUPS" ]; then
    echo "Found $total_backups backups, keeping newest $MAX_BACKUPS"
    echo "$backup_files" | tail -n +$((MAX_BACKUPS + 1)) | while read -r file; do
        echo "Deleting old backup: $file"
        rm "$file"
    done
else
    echo "Found $total_backups backups, no cleanup needed"
fi

# Print remaining backups
echo -e "\nRemaining backups:"
find "$HISTORY_DIR" -name "$BACKUP_PATTERN" -type f -exec ls -lh {} \; 