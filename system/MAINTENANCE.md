# Pflege-Protokoll Mission Control

## Automatische Pflege

### Bei jeder Änderung durch Ray
- Task wird in Mission Control erfasst (Tasks → Inbox)
- Zuständiger Agent wird assigned
- Status: todo → doing → review → done
- Memory-Eintrag wird erstellt

### Bei jeder Änderung durch Harvey
- Commit mit Prefix: "Harvey: [beschreibung]"
- Push zu GitHub
- Update in Mission Control (System → Logs)
- Bericht an Ray falls relevant

## Manuelle Pflege

### Täglich (19:00)
- [ ] Dashboard-Daten prüfen
- [ ] Neue Tasks aus Memos erstellen
- [ ] Offene Approvals checken
- [ ] Memory aktualisieren

### Wöchentlich (Sonntag)
- [ ] Backup aller JSON-Daten
- [ ] Team-Status review
- [ ] Radar aktualisieren
- [ ] Pipeline review

### Monatlich
- [ ] Archivierung alter Tasks
- [ ] Performance-Review
- [ ] OKR-Check

## Änderungs-Tracking

| Datum | Wer | Was | Sektion | Status |
|-------|-----|-----|---------|--------|
| 2026-03-15 | Harvey | Initial Build | All | Done |
| | | | | |
