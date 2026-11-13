#!/bin/sh
# Original Morning Desk install: config, Docker, and daily auto-update.
# Run as root from the clone directory.

set -eu

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

chmod +x update.sh install-update-timer.sh 2>/dev/null || true

if [ ! -f config.json ]; then
  cp config.example.json config.json
  chmod 600 config.json # it will hold password hashes and solar tokens
  echo "Created config.json from the example."
  echo "Edit it and paste your Growatt API token, then re-run this script."
  echo "  nano config.json"
  exit 0
fi

# .env holds the settings docker-compose.yml passes to the app. It is readable by root only and never in git.
# Only missing settings are asked for, so re-running this script keeps the ones already there.
GENERATED_PASSWORD=""
touch .env
chmod 600 .env
if ! grep -q '^ADMIN_PASSWORD=' .env; then
  while :; do
    printf 'Admin password (8 to 200 characters, no single quotes; leave blank to generate one): '
    stty -echo 2>/dev/null || true; read -r PASSWORD; stty echo 2>/dev/null || true; echo
    if [ -z "$PASSWORD" ]; then
      PASSWORD="$(head -c 18 /dev/urandom | base64 | tr -d '/+=')"
      GENERATED_PASSWORD="$PASSWORD"
      break
    fi
    if [ "${#PASSWORD}" -lt 8 ] || [ "${#PASSWORD}" -gt 200 ]; then echo "The password must be 8 to 200 characters."; continue; fi
    case "$PASSWORD" in *"'"*) echo "Single quotes cannot be used in the password."; continue ;; esac
    printf 'Type it again: '
    stty -echo 2>/dev/null || true; read -r CONFIRM; stty echo 2>/dev/null || true; echo
    [ "$PASSWORD" = "$CONFIRM" ] && break
    echo "The passwords did not match."
  done
  # Single quotes: Docker Compose then reads the value literally, so characters like $ or # stay as typed.
  printf "ADMIN_PASSWORD='%s'\n" "$PASSWORD" >> .env
fi
if ! grep -q '^TRUST_PROXY=' .env; then
  while :; do
    printf 'Address of the proxy in front of Morning Desk (nginx, Cloudflare tunnel), e.g. 192.168.0.20.\nComma-separate several; leave blank if there is none: '
    read -r PROXY
    case "$PROXY" in *[!0-9A-Fa-f.:/,\ ]*) echo "Use IP addresses or ranges only, e.g. 192.168.0.20, 173.245.48.0/20."; continue ;; esac
    break
  done
  printf "TRUST_PROXY='%s'\n" "$PROXY" >> .env
fi

echo "Starting Morning Desk"
docker compose up -d --build

echo "Installing daily auto-update (04:15)"
./install-update-timer.sh

echo
echo "Morning Desk is up."
echo "Dashboard: http://$(hostname -I 2>/dev/null | awk '{print $1}'):4123"
if [ -n "$GENERATED_PASSWORD" ]; then
  echo
  echo "Admin password (generated): $GENERATED_PASSWORD"
  echo "Sign in as \"admin\" with it. It is saved in $APP_DIR/.env; store it in your password manager."
fi
