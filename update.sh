#!/bin/sh
# Check the Morning Desk repo for updates and refresh the local install.
# Run from the clone directory, or set APP_DIR.
# Keeps config.json. Rebuilds the Docker container only when main moved.

set -eu

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")" && pwd)}"
cd "$APP_DIR"

BRANCH="${BRANCH:-main}"

log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  log "Not a git checkout: $APP_DIR"
  exit 1
fi

log "Fetching $BRANCH from origin"
git fetch --quiet origin "$BRANCH"

LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse "origin/$BRANCH")"

if [ "$LOCAL" = "$REMOTE" ]; then
  log "Already up to date ($LOCAL)"
  exit 0
fi

log "Update available: $LOCAL -> $REMOTE"
git pull --ff-only origin "$BRANCH"

if command -v docker >/dev/null 2>&1; then
  if docker compose version >/dev/null 2>&1; then
    log "Rebuilding container"
    docker compose up -d --build
  elif command -v docker-compose >/dev/null 2>&1; then
    log "Rebuilding container (docker-compose)"
    docker-compose up -d --build
  else
    log "Docker is installed but compose is missing. Files updated; rebuild manually."
  fi
else
  log "Docker not found. Files updated; start the app manually."
fi

log "Done"
