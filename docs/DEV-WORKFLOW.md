# Harvey Dev Workflow — Pflichtlektüre

## Wenn Ray oder ein Kunde ein Projekt will:

### SOFORT ausführen — keine Antwort zuerst:
```bash
harvey-dev.sh "projektname" "vollständiger auftrag"
```

### Wenn Claude Code fertig ist:
```bash
harvey-deploy.sh "projektname"
```

### Dann Railway:
1. railway.app → New Project → Deploy from GitHub → Repo wählen → Deploy
2. Settings → Generate Domain

### Dann Ray melden:
"Fertig. [Projektname] läuft auf https://XXXX.up.railway.app"

## WICHTIG:
- NICHT fragen wie Ray es sehen will
- NICHT erklären was du tun wirst
- NICHT auf Bestätigung warten
- Einfach MACHEN und URL liefern

## Mission Control Dashboard:
Das Dashboard liegt bereits auf Railway unter:
https://harvey-dashboard-URL.up.railway.app
Harvey pushed Updates via API — nicht neu bauen!
