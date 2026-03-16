# 🎯 Mission Control

**Ray's Kommandozentrum** — *Alles auf einen Blick, alles unter Kontrolle*

---

## 🚨 Aktive Alerts

<!-- ALERTS_START -->
✅ **System nominal** — Keine kritischen Issues
<!-- ALERTS_END -->

---

## 📊 System Status

| Komponente | Status | Details |
|------------|--------|---------|
<!-- SYSTEM_STATUS_START -->
| 💻 **Mac mini** | 🟢 Online | 9 days Uptime |
| 🧠 **Memory** | 🟢 57% | 8395MB / 14508MB |
| 💾 **Disk** | 🟢 2% | 2% belegt |
| ⚡ **Gateway** | 🟡 unknown | PID aktiv |
| 🔥 **Load** | 🟢 1.46 | 3 CPUs |
<!-- SYSTEM_STATUS_END -->

<!-- TIMESTAMP_START -->
*Letzter Check: 2026-03-16 11:05*
<!-- TIMESTAMP_END -->

---

## 🎯 Aktive Projekte

| Projekt | Phase | Nächster Meilenstein | Status |
|---------|-------|---------------------|--------|
| **[Therapeuten-Plattform CH](Projects/therapeuten-plattform.md)** | M1: Foundation | M1.3 Hosting-Setup | 🟡 In Progress |
| **[cal.com Eval](Projects/cal-com-evaluation.md)** | Evaluation | Entscheid: Self-host vs SaaS | 🟡 Offen |
| **MissionControl** | Live | Tägliche Nutzung | 🟢 Aktiv |

**Alle Projekte:** [Projects/](Projects/)

---

## ✅ Heutige Prioritäten

### 🔥 Muss heute
- [ ] MissionControl Dashboard erweitern
- [ ] Therapeuten-Plattform: M1.2 Review

### 📥 INBOX (Neue Ideen)
- [ ] GitHub Integration für Issues
- [ ] Kalender-Import (ICS)
- [ ] Therapeuten-Plattform: Domain prüfen

### 📋 Backlog
- [ ] cal.com: Hosting-Kosten vergleichen
- [ ] Datenschutz-Dokumentation (DSGVO)
- [ ] Design-System definieren

---

## 📅 Termine & Deadlines

| Wann | Was | Projekt |
|------|-----|---------|
| Heute | MissionControl Finalisierung | Internal |
| Diese Woche | M1.2 Review | Therapeuten-Plattform |
| Offen | cal.com Entscheid | Evaluation |

**Kalender:** Noch nicht verbunden (ICS-URL in config/calendar.json)

---

## 🐙 GitHub & Code

| Repo | Issues | PRs | Status |
|------|--------|-----|--------|
<!-- GITHUB_START -->
| **GitHub API** | unknown | 0 Notifications |
<!-- GITHUB_END -->

**Schnell:**
- Neues Issue: `gh issue create --title "..."`
- Repo erstellen: `gh repo create therapeuten-plattform`

---

## 🧠 Memory & Wissen

**Letzte Einträge:**
- [memory/2026-03-12.md](memory/2026-03-12.md) — Projekt-Kontext
- [memory/PROJECT_MEMORY.md](memory/PROJECT_MEMORY.md) — Long-term

**Wichtige Docs:**
- [AGENTS.md](AGENTS.md) — Wie wir arbeiten
- [HEARTBEAT.md](HEARTBEAT.md) — Tägliche Routine
- [SOUL.md](SOUL.md) — Harvey's Kern

---

## 🚀 Quick Actions

### Dashboard
```bash
bash MissionControl/scripts/update-dashboard.sh    # Aktualisieren
bash MissionControl/scripts/check-health.sh        # Health-Check
```

### Projekte
```bash
ls Projects/                    # Alle Projekte
code Projects/therapeuten-plattform.md  # Bearbeiten
```

### Git
```bash
git status                      # Status
git add -A && git commit -m "..." && git push  # Commit & Push
```

### OpenClaw
```bash
openclaw gateway status         # Gateway Status
openclaw gateway restart        # Restart
```

---

## 📡 Radar (Extern)

<!-- WEATHER_START -->
🌤️ **Luzern:** Partly cloudy, 7°C (gefühlt 7°C) *(06:00 aktualisiert)*
<!-- WEATHER_END -->

**Markt:** CH Hosting-Advantage aktiv

**Tech:** cal.com v4.7 released

---

## 📝 Notizen & Ideen

<!-- Ideen hier sammeln -->
- Dashboard als Startseite im Terminal?
- Telegram-Bot für Alerts?
- Weekly Review automatisch?

---

*Mission Control — Generiert: 2026-03-16 11:05*  
*Auto-refresh: 07:00 täglich | Health: alle 30min | GitHub: stündlich*
