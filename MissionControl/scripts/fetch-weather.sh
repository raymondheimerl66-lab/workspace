#!/bin/bash
# fetch-weather.sh - Wetterdaten für Luzern abrufen
# Autor: Harvey
# Update: täglich 06:00

set -e

LOCATION="Lucerne,Switzerland"
DATA_FILE="/Users/harvey/.openclaw/workspace/MissionControl/data/weather.json"

echo "🌤️  Fetching weather for ${LOCATION}..."

# Aktuelles Wetter
CURRENT=$(curl -s "wttr.in/${LOCATION}?format=j1" 2>/dev/null || echo '{}')

# Forecast für heute und morgen
TODAY=$(curl -s "wttr.in/${LOCATION}?0" 2>/dev/null || echo 'N/A')
TOMORROW=$(curl -s "wttr.in/${LOCATION}?1" 2>/dev/null || echo 'N/A')

# Formatierte Daten erstellen
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# JSON-Output mit wttr.in Daten
cat > "${DATA_FILE}" << EOJSON
{
  "location": "${LOCATION}",
  "last_updated": "${TIMESTAMP}",
  "source": "wttr.in",
  "current": ${CURRENT},
  "forecast": {
    "today_text": "$(echo "$TODAY" | tr '\n' ' ' | sed 's/"/\\"/g')",
    "tomorrow_text": "$(echo "$TOMORROW" | tr '\n' ' ' | sed 's/"/\\"/g')"
  }
}
EOJSON

echo "✅ Weather data saved to ${DATA_FILE}"
