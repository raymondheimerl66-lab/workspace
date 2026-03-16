#!/bin/bash
# Harvey Deploy Pipeline
# Verwendung: ./harvey-deploy.sh "Projektname"

PROJECT_NAME=$1
PROJECT_DIR=~/harvey-projects/$PROJECT_NAME

if [ -z "$PROJECT_NAME" ]; then
  echo "Fehler: Projektname fehlt"
  exit 1
fi

if [ ! -d "$PROJECT_DIR" ]; then
  echo "Fehler: Projektordner nicht gefunden: $PROJECT_DIR"
  exit 1
fi

cd "$PROJECT_DIR"

echo "🦞 Harvey Deploy Pipeline"
echo "📁 Projekt: $PROJECT_NAME"

# 1. Dependencies installieren
if [ -f "package.json" ]; then
  echo "📦 Installiere Dependencies..."
  npm config set strict-ssl false && npm install && npm config set strict-ssl true
fi

# 2. GitHub Repo erstellen und pushen
echo "🐙 Pushe auf GitHub..."
git add .
git commit -m "Harvey: initial build — $PROJECT_NAME"
gh repo create "$PROJECT_NAME" --private --source=. --push
GITHUB_URL="https://github.com/raymondheimerl66-lab/$PROJECT_NAME"
echo "✅ GitHub: $GITHUB_URL"

# 3. Procfile prüfen
if [ ! -f "Procfile" ]; then
  echo "web: node server.js" > Procfile
  git add Procfile
  git commit -m "Harvey: add Procfile"
  git push
fi

# 4. Railway deployment
echo "🚂 Deploye auf Railway..."
echo "Öffne Railway Dashboard..."
open "https://railway.app/new"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deploy bereit!"
echo "GitHub: $GITHUB_URL"
echo "Railway: Wähle $PROJECT_NAME im Dashboard"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
