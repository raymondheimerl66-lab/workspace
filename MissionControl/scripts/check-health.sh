#!/bin/bash
# check-health.sh - System-Health-Check
# Autor: Harvey
# Update: alle 30 Minuten

set -e

DATA_FILE="/Users/harvey/.openclaw/workspace/MissionControl/data/health.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "🏥 Checking system health..."

# System-Infos
HOSTNAME=$(hostname)
OS=$(uname -s)
UPTIME=$(uptime | awk -F'up ' '{print $2}' | awk -F',' '{print $1}')

# CPU Usage
CPU_USAGE=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//' || echo "N/A")

# Memory Usage (macOS)
MEMORY_INFO=$(vm_stat 2>/dev/null || echo "")
if [ -n "$MEMORY_INFO" ]; then
    PAGE_SIZE=$(vm_stat | grep "page size" | awk '{print $8}' || echo "4096")
    [ -z "$PAGE_SIZE" ] && PAGE_SIZE=4096
    
    FREE_PAGES=$(echo "$MEMORY_INFO" | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
    ACTIVE_PAGES=$(echo "$MEMORY_INFO" | grep "Pages active" | awk '{print $3}' | sed 's/\.//')
    INACTIVE_PAGES=$(echo "$MEMORY_INFO" | grep "Pages inactive" | awk '{print $3}' | sed 's/\.//')
    WIRED_PAGES=$(echo "$MEMORY_INFO" | grep "Pages wired down" | awk '{print $4}' | sed 's/\.//')
    
    # macOS: inactive pages sind cache (können freigegeben werden)
    # Real memory pressure = wired + active (nicht inactive)
    FREE_MB=$((FREE_PAGES * PAGE_SIZE / 1024 / 1024))
    WIRED_MB=$((WIRED_PAGES * PAGE_SIZE / 1024 / 1024))
    ACTIVE_MB=$((ACTIVE_PAGES * PAGE_SIZE / 1024 / 1024))
    INACTIVE_MB=$((INACTIVE_PAGES * PAGE_SIZE / 1024 / 1024))
    
    USED_MB=$((WIRED_MB + ACTIVE_MB))
    CACHE_MB=$INACTIVE_MB
    TOTAL_MB=$((FREE_MB + USED_MB + CACHE_MB))
    
    # Memory pressure: nur wired+active, nicht cache
    MEM_PERCENT=$((USED_MB * 100 / TOTAL_MB))
else
    MEM_PERCENT="N/A"
    USED_MB="N/A"
    TOTAL_MB="N/A"
fi

# Disk Usage
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//' || echo "N/A")
DISK_AVAIL=$(df -h / | tail -1 | awk '{print $4}' || echo "N/A")

# OpenClaw Gateway Status
GATEWAY_STATUS=$(openclaw gateway status 2>/dev/null | grep -o "running\|stopped\|unknown" || echo "unknown")

# Load Average
LOAD_AVG=$(uptime | awk -F'load averages:' '{print $2}' | awk '{print $1}' | sed 's/,//' || echo "N/A")

# Heartbeat-Status checken
HEARTBEAT_FILE="/Users/harvey/.openclaw/workspace/memory/heartbeat-state.json"
if [ -f "$HEARTBEAT_FILE" ]; then
    LAST_HEARTBEAT=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$HEARTBEAT_FILE" 2>/dev/null || echo "unknown")
else
    LAST_HEARTBEAT="never"
fi

# JSON erstellen
cat > "${DATA_FILE}" << EOJSON
{
  "last_updated": "${TIMESTAMP}",
  "system": {
    "hostname": "${HOSTNAME}",
    "os": "${OS}",
    "uptime": "${UPTIME}"
  },
  "resources": {
    "cpu_percent": "${CPU_USAGE}",
    "memory_percent": "${MEM_PERCENT}",
    "memory_used_mb": "${USED_MB}",
    "memory_total_mb": "${TOTAL_MB}",
    "disk_percent": "${DISK_USAGE}",
    "disk_available": "${DISK_AVAIL}",
    "load_average": "${LOAD_AVG}"
  },
  "openclaw": {
    "gateway_status": "${GATEWAY_STATUS}",
    "last_heartbeat": "${LAST_HEARTBEAT}"
  },
  "status": "$([ "$DISK_USAGE" -lt 90 ] && [ -z "$(echo "$MEM_PERCENT" | grep N)" ] && [ "$MEM_PERCENT" -lt 90 ] && echo "healthy" || echo "warning")"
}
EOJSON

echo "✅ Health data saved to ${DATA_FILE}"
echo "   Status: $(cat ${DATA_FILE} | grep '"status"' | cut -d'"' -f4)"
