# 🎯 Mission Control PRO

Ray's Kommandozentrale - Ein voll funktionsfähiges, interaktives Dashboard für Projektmanagement.

## Features

### Dashboard
- **System Status** - Live System-Metriken (Load, Memory, Disk, Uptime)
- **Wetter Widget** - Aktuelles Wetter für Luzern
- **Quick Actions** - Schnelles Erstellen von Tasks, Notizen, Projekten

### Projekte
- Übersicht aller Projekte mit Status
- Milestone-Tracking mit Fortschrittsbalken
- Priorisierung (1-5)
- Deadline-Tracking

### Tasks
- Interaktive Task-Liste mit Checkboxes
- Filter nach Status und Projekt
- Suchfunktion
- Drag & Drop (vorbereitet)
- Prioritäten und Deadlines

### Notizen
- Post-it Style Notiz-Board
- Kategorien: Ideen, Meeting, Random
- Farbige Notizen

### GitHub Integration
- Live Issues aus dem Repository
- Pull Requests
- Recent Commits (letzte 7 Tage)

### Events
- Kommende Termine und Deadlines
- Kalender-View mit Datum

## API Endpunkte

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/api/health` | System Health Status |
| GET | `/api/weather` | Aktuelles Wetter |
| GET | `/api/github` | GitHub Issues/PRs/Commits |
| GET | `/api/projects` | Alle Projekte |
| POST | `/api/projects` | Neues Projekt |
| PUT | `/api/projects/:id` | Projekt aktualisieren |
| GET | `/api/tasks` | Alle Tasks |
| POST | `/api/tasks` | Neuer Task |
| PUT | `/api/tasks/:id` | Task aktualisieren |
| DELETE | `/api/tasks/:id` | Task löschen |
| GET | `/api/notes` | Alle Notizen |
| POST | `/api/notes` | Neue Notiz |
| DELETE | `/api/notes/:id` | Notiz löschen |
| GET | `/api/events` | Alle Events |
| POST | `/api/events` | Neues Event |
| GET | `/api/settings` | Alle Settings |
| PUT | `/api/settings/:key` | Setting aktualisieren |
| POST | `/api/update-dashboard` | Cache leeren & refresh |

## Installation

```bash
# Dependencies installieren
npm install

# Datenbank initialisieren
npm run init-db

# Server starten
npm start
```

## Environment Variables

```bash
# Für Railway Deployment
GITHUB_TOKEN=ghp_xxx
GITHUB_REPO=Rayze64/therapeuten-plattform
WEATHER_LOCATION=Luzern,CH
PORT=3000
```

## Datenbank Schema

SQLite Datenbank mit folgenden Tabellen:
- `tasks` - Aufgaben mit Status, Priorität, Projekt
- `projects` - Projekte mit Milestones (JSON)
- `notes` - Notizen mit Kategorien
- `events` - Termine und Deadlines
- `settings` - Konfiguration

## Deployment auf Railway

1. Repository verbinden
2. Environment Variables setzen
3. Deploy

Die App läuft dann unter: `https://missioncontrol-pro.up.railway.app`

## Testing

```bash
# Health Check
curl https://missioncontrol-pro.up.railway.app/api/health

# Alle Tasks
curl https://missioncontrol-pro.up.railway.app/api/tasks

# Neuer Task
curl -X POST https://missioncontrol-pro.up.railway.app/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","priority":1}'
```

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Frontend**: Vanilla JavaScript + CSS
- **Icons**: FontAwesome 6
- **Font**: Inter (Google Fonts)

## Lizenz

MIT
