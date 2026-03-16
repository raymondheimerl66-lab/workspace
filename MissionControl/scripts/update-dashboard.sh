#!/bin/bash
# update-dashboard.sh - Aktualisiert Live-Daten im Dashboard
# Autor: Harvey

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="/Users/harvey/.openclaw/workspace"
MC_DIR="${WORKSPACE}/MissionControl"
DATA_DIR="${MC_DIR}/data"
DASHBOARD="${MC_DIR}/dashboard.md"
TMP_DASHBOARD="${DASHBOARD}.tmp"

echo "🎯 Updating Mission Control Live Data..."
echo "   $(date '+%Y-%m-%d %H:%M:%S')"

# 1. Daten aktualisieren
echo ""
echo "📊 Refreshing data sources..."

bash "${SCRIPT_DIR}/check-health.sh" || echo "⚠️  Health check failed"
bash "${SCRIPT_DIR}/fetch-weather.sh" || echo "⚠️  Weather fetch failed"
bash "${SCRIPT_DIR}/fetch-github.sh" || echo "⚠️  GitHub fetch failed"

# 2. Daten laden
HEALTH_FILE="${DATA_DIR}/health.json"
if [ -f "$HEALTH_FILE" ]; then
    HEALTH_STATUS=$(grep -o '"status": "[^"]*"' "$HEALTH_FILE" | cut -d'"' -f4)
    CPU=$(grep -o '"cpu_percent": "[^"]*"' "$HEALTH_FILE" | cut -d'"' -f4)
    MEM=$(grep -o '"memory_percent": "[^"]*"' "$HEALTH_FILE" | cut -d'"' -f4)
    MEM_USED=$(grep -o '"memory_used_mb": "[^"]*"' "$HEALTH_FILE" | cut -d'"' -f4)
    MEM_TOTAL=$(grep -o '"memory_total_mb": "[^"]*"' "$HEALTH_FILE" | cut -d'"' -f4)
    DISK=$(grep -o '"disk_percent": "[^"]*"' "$HEALTH_FILE" | cut -d'"' -f4)
    GATEWAY=$(grep -o '"gateway_status": "[^"]*"' "$HEALTH_FILE" | cut -d'"' -f4)
    UPTIME=$(grep -o '"uptime": "[^"]*"' "$HEALTH_FILE" | cut -d'"' -f4)
    LOAD=$(grep -o '"load_average": "[^"]*"' "$HEALTH_FILE" | cut -d'"' -f4)
else
    HEALTH_STATUS="unknown"; CPU="N/A"; MEM="N/A"; MEM_USED="N/A"; MEM_TOTAL="N/A"
    DISK="N/A"; GATEWAY="unknown"; UPTIME="unknown"; LOAD="N/A"
fi

WEATHER_FILE="${DATA_DIR}/weather.json"
if [ -f "$WEATHER_FILE" ]; then
    WEATHER_TEMP=$(grep -o '"temp_C": "[^"]*"' "$WEATHER_FILE" | head -1 | cut -d'"' -f4)
    WEATHER_FEELS=$(grep -o '"FeelsLikeC": "[^"]*"' "$WEATHER_FILE" | head -1 | cut -d'"' -f4)
    WEATHER_COND=$(grep -o '"value": "[^"]*"' "$WEATHER_FILE" | head -1 | cut -d'"' -f4)
    [ -z "$WEATHER_COND" ] && WEATHER_COND="unknown"
else
    WEATHER_COND="unknown"; WEATHER_TEMP="N/A"; WEATHER_FEELS="N/A"
fi

GH_FILE="${DATA_DIR}/github.json"
if [ -f "$GH_FILE" ]; then
    GH_STATUS=$(grep -o '"github_status": "[^"]*"' "$GH_FILE" | cut -d'"' -f4)
    GH_NOTIFS=$(grep -o '"notifications": [0-9]*' "$GH_FILE" | grep -o '[0-9]*')
    [ -z "$GH_NOTIFS" ] && GH_NOTIFS=0
else
    GH_STATUS="unknown"; GH_NOTIFS=0
fi

# 3. Dashboard aktualisieren
echo ""
echo "📝 Updating dashboard..."

# Status-Icons
STATUS_ICON=$([ "$HEALTH_STATUS" = "healthy" ] && echo "🟢" || echo "🟡")
GATEWAY_ICON=$([ "$GATEWAY" = "running" ] && echo "🟢" || echo "🟡")

# Python-Skript für Marker-Ersetzung (robuster als awk mit newlines)
python3 << EOF
import re

with open("${DASHBOARD}", "r") as f:
    content = f.read()

# System Status ersetzen
system_status = """| 💻 **Mac mini** | ${STATUS_ICON} Online | ${UPTIME} Uptime |
| 🧠 **Memory** | ${STATUS_ICON} ${MEM}% | ${MEM_USED}MB / ${MEM_TOTAL}MB |
| 💾 **Disk** | ${STATUS_ICON} ${DISK}% | ${DISK}% belegt |
| ⚡ **Gateway** | ${GATEWAY_ICON} ${GATEWAY} | PID aktiv |
| 🔥 **Load** | ${STATUS_ICON} ${LOAD} | 3 CPUs |"""

content = re.sub(
    r'<!-- SYSTEM_STATUS_START -->.*?<!-- SYSTEM_STATUS_END -->',
    f'<!-- SYSTEM_STATUS_START -->\\n{system_status}\\n<!-- SYSTEM_STATUS_END -->',
    content,
    flags=re.DOTALL
)

# Timestamp
timestamp = "*Letzter Check: $(date '+%Y-%m-%d %H:%M')*"
content = re.sub(
    r'<!-- TIMESTAMP_START -->.*?<!-- TIMESTAMP_END -->',
    f'<!-- TIMESTAMP_START -->\\n{timestamp}\\n<!-- TIMESTAMP_END -->',
    content,
    flags=re.DOTALL
)

# Weather
weather = "🌤️ **Luzern:** ${WEATHER_COND}, ${WEATHER_TEMP}°C (gefühlt ${WEATHER_FEELS}°C) *(06:00 aktualisiert)*"
content = re.sub(
    r'<!-- WEATHER_START -->.*?<!-- WEATHER_END -->',
    f'<!-- WEATHER_START -->\\n{weather}\\n<!-- WEATHER_END -->',
    content,
    flags=re.DOTALL
)

# GitHub
github = "| **GitHub API** | ${GH_STATUS} | ${GH_NOTIFS} Notifications |"
content = re.sub(
    r'<!-- GITHUB_START -->.*?<!-- GITHUB_END -->',
    f'<!-- GITHUB_START -->\\n{github}\\n<!-- GITHUB_END -->',
    content,
    flags=re.DOTALL
)

with open("${DASHBOARD}", "w") as f:
    f.write(content)

print("✅ Dashboard updated successfully")
EOF

echo ""
echo "✅ Mission Control aktualisiert!"
echo "   Memory: ${MEM}% | Disk: ${DISK}% | Gateway: ${GATEWAY}"
