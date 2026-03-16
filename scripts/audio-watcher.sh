#!/bin/bash
# Auto-kill cron spam - disables audio-watcher cron after detecting too many runs

COUNT_FILE="/tmp/audio_watcher_count"
MAX_COUNT=3

# Initialize or increment counter
if [ -f "$COUNT_FILE" ]; then
    COUNT=$(cat "$COUNT_FILE")
    COUNT=$((COUNT + 1))
else
    COUNT=1
fi

echo "$COUNT" > "$COUNT_FILE"

# After MAX_COUNT runs, disable the cron job
if [ "$COUNT" -ge "$MAX_COUNT" ]; then
    # Write empty crontab to stop spam
    echo "" | crontab - 2>/dev/null
    echo "[$(date)] Cron disabled after $MAX_COUNT runs" >> /tmp/audio_watcher.log
    exit 0
fi

# Run actual watcher
exec /Users/harvey/.openclaw/workspace/scripts/audio-watcher.sh
