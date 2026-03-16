# 🎯 Mission Control Dashboard

Live dashboard for system health, projects, tasks, and memory. Central hub to manage the Therapeuten-Plattform project and internal operations.

## 📁 Structure

```
MissionControl/
├── README.md              # This file
├── dashboard.md           # Live dashboard (auto-generated)
├── config/
│   ├── projects.json      # Project definitions
│   └── modules.json       # Active modules & settings
├── data/                  # Auto-generated data files
│   ├── weather.json
│   ├── health.json
│   └── github.json
├── scripts/               # Update scripts
│   ├── update-dashboard.sh    # Main refresh
│   ├── fetch-weather.sh       # Weather data
│   ├── check-health.sh        # System health
│   └── fetch-github.sh        # GitHub status
└── templates/
    └── dashboard.template.md  # Template
```

## 🔄 Auto-Refresh Schedule

| Script | Schedule | Cron |
|--------|----------|------|
| Weather | Daily 06:00 | `0 6 * * *` |
| GitHub | Hourly | `0 * * * *` |
| Health | Every 30 min | `*/30 * * * *` |
| Dashboard | Daily 07:00 | `0 7 * * *` |

## 🚀 Quick Start

### Manual Refresh
```bash
# Full dashboard update
bash MissionControl/scripts/update-dashboard.sh

# Individual modules
bash MissionControl/scripts/fetch-weather.sh
bash MissionControl/scripts/check-health.sh
bash MissionControl/scripts/fetch-github.sh
```

### View Dashboard
```bash
cat MissionControl/dashboard.md
```

## 📝 Modules

- **🏥 Health** - System metrics (CPU, memory, disk, OpenClaw gateway)
- **🌤️ Weather** - Current weather for Luzern
- **📁 Projects** - Active project status from config
- **✅ Tasks** - Today's priorities and inbox
- **🐙 GitHub** - Issues, PRs, notifications
- **🧠 Memory** - Recent memory entries
- **🚀 Quick Actions** - Common commands

## ⚙️ Configuration

Edit `config/modules.json` to enable/disable modules.
Edit `config/projects.json` to add/modify projects.

## 🔗 Integration

- Reads from `/memory/` for daily notes
- Reads from `/Projects/` for project files
- Updates via `HEARTBEAT.md` routine
