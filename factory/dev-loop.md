# Development Loop — SOP

## Workflow
1. Auftrag analysieren, detaillierten Masterprompt schreiben
2. `harvey-dev.sh "projektname" "masterprompt"` — Claude Code baut den Code
3. Ergebnis kontrollieren, ggf. Korrekturen
4. `harvey-deploy.sh "projektname"` — Push auf GitHub + Deploy auf Railway
5. GitHub URL + Railway URL an Ray melden

## Bestätigt
- Test erfolgreich: todo-app → https://web-production-f375e.up.railway.app
- Ab sofort autonom einsetzbar für neue Projekte

## Regeln
- Keine Rückfragen — analysieren, bauen, deployen, melden
- Masterprompt muss detailliert und vollständig sein (Architektur, Stack, Features, Edge Cases)
