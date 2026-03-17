#!/bin/bash

echo "🧪 Mission Control PRO API Tests"
echo "================================"
echo ""

BASE_URL="http://localhost:3000"

echo "1️⃣  Health Check"
curl -s $BASE_URL/api/health | jq .
echo ""

echo "2️⃣  Weather"
curl -s $BASE_URL/api/weather | jq '{temp, description, location}'
echo ""

echo "3️⃣  Projects"
curl -s $BASE_URL/api/projects | jq '.[] | {name, status, priority}'
echo ""

echo "4️⃣  Tasks"
curl -s $BASE_URL/api/tasks | jq '.[] | {title, status, priority}'
echo ""

echo "5️⃣  Notes"
curl -s $BASE_URL/api/notes | jq '.[] | {content, category}'
echo ""

echo "6️⃣  Events"
curl -s $BASE_URL/api/events | jq '.[] | {title, date, type}'
echo ""

echo "7️⃣  Settings"
curl -s $BASE_URL/api/settings | jq .
echo ""

echo "✅ All tests completed!"
