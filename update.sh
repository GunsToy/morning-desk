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

# Only deploy a commit whose tests passed on GitHub (.github/workflows/test.yml, job "test").
# Failed, still running, or GitHub unreachable: keep the current version and try again next run.
# SKIP_TEST_CHECK=1 ./update.sh deploys without asking.
if [ "${SKIP_TEST_CHECK:-0}" != 1 ]; then
  SLUG="$(git remote get-url origin | sed -E 's#^.*github\.com[:/]##; s#\.git$##')"
  if ! curl -fsS --max-time 20 "https://api.github.com/repos/$SLUG/commits/$REMOTE/check-runs?check_name=test" \
      | grep -q '"conclusion": *"success"'; then
    log "Tests have not passed on GitHub for $REMOTE (failed, still running, or GitHub unreachable). Not updating."
    exit 0
  fi
  log "Tests passed on GitHub"
fi

# Fast-forward to exactly the commit that was checked, not whatever main is by now.
git merge --ff-only --quiet "$REMOTE"

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
