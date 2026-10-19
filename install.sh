#!/bin/sh
# Original Morning Desk install: config, Docker, and daily auto-update.
# Run as root from the clone directory.

set -eu

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

chmod +x update.sh install-update-timer.sh 2>/dev/null || true

if [ ! -f config.json ]; then
  cp config.example.json config.json
  echo "Created config.json from the example."
  echo "Edit it and paste your Growatt API token, then re-run this script."
  echo "  nano config.json"
  exit 0
fi

echo "Starting Morning Desk"
docker compose up -d --build

echo "Installing daily auto-update (04:15)"
./install-update-timer.sh

echo
echo "Morning Desk is up."
echo "Dashboard: http://$(hostname -I 2>/dev/null | awk '{print $1}'):4123"
