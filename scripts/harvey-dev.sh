#!/bin/bash
PROJECT_NAME=$1
PROJECT_DESC=$2
PROJECT_DIR=~/harvey-projects/$PROJECT_NAME

if [ -z "$PROJECT_NAME" ]; then
  echo "Fehler: Projektname fehlt"
  exit 1
fi

echo "🦞 Harvey Dev Pipeline gestartet"
echo "📁 Projekt: $PROJECT_NAME"

mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"
git init 2>/dev/null
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore

cat > MASTERPROMPT.md << PROMPT
# $PROJECT_NAME

## Auftrag
$PROJECT_DESC

## Technische Anforderungen
- Node.js 20, sauberer professioneller Code
- Responsives modernes Design falls Frontend
- Vollständige Fehlerbehandlung
- README.md mit Setup-Anleitung
- package.json mit allen Dependencies
- Procfile: web: node server.js
- .env.example mit allen benötigten Keys
- Deployment-ready für Railway

## Qualitätskriterien
- Komplett lauffähig, kein Placeholder-Code
- Alle Features vollständig implementiert
PROMPT

echo "✅ Masterprompt erstellt"
echo "🤖 Starte Claude Code Agent..."

NODE_TLS_REJECT_UNAUTHORIZED=0 claude --dangerously-skip-permissions --print "$(cat MASTERPROMPT.md)"

echo ""
echo "✅ Claude Code fertig"
echo "📁 $PROJECT_DIR"
echo "▶ Deploye: harvey-deploy.sh $PROJECT_NAME"
