#!/bin/bash
# fetch-github.sh - GitHub Status abrufen
# Autor: Harvey
# Update: stündlich

set -e

DATA_FILE="/Users/harvey/.openclaw/workspace/MissionControl/data/github.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "🐙 Fetching GitHub status..."

# Prüfe ob gh CLI verfügbar
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found"
    echo '{"error": "gh CLI not installed", "last_updated": "'${TIMESTAMP}'"}' > "${DATA_FILE}"
    exit 1
fi

# Repo-Info (falls Repository existiert)
REPO_ISSUES="[]"
REPO_PRS="[]"
REPO_WORKFLOWS="[]"

# Versuche Issues zu laden (falls Repo existiert)
if gh repo view Rayze64/therapeuten-plattform &>/dev/null; then
    ISSUES=$(gh issue list --repo Rayze64/therapeuten-plattform --json number,title,state,createdAt,labels 2>/dev/null || echo '[]')
    PRS=$(gh pr list --repo Rayze64/therapeuten-plattform --json number,title,state,createdAt 2>/dev/null || echo '[]')
    
    # Workflow runs
    WORKFLOWS=$(gh run list --repo Rayze64/therapeuten-plattform --json name,status,conclusion,createdAt --limit 5 2>/dev/null || echo '[]')
    
    REPO_ISSUES="$ISSUES"
    REPO_PRS="$PRS"
    REPO_WORKFLOWS="$WORKFLOWS"
fi

# Benachrichtigungen
NOTIFICATIONS=$(gh api notifications --jq 'length' 2>/dev/null || echo "0")

# GitHub Status (API Status)
API_STATUS=$(curl -s https://www.githubstatus.com/api/v2/status.json 2>/dev/null | jq -r '.status.description' 2>/dev/null || echo "unknown")

cat > "${DATA_FILE}" << EOJSON
{
  "last_updated": "${TIMESTAMP}",
  "github_status": "${API_STATUS}",
  "notifications": ${NOTIFICATIONS},
  "repos": [
    {
      "name": "therapeuten-plattform",
      "owner": "Rayze64",
      "issues": ${REPO_ISSUES},
      "pull_requests": ${REPO_PRS},
      "workflows": ${REPO_WORKFLOWS}
    }
  ]
}
EOJSON

echo "✅ GitHub data saved to ${DATA_FILE}"
