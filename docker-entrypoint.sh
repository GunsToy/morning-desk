#!/bin/sh
set -e

# If no config was mounted, seed one from the example so the app can start.
if [ ! -f /app/config.json ]; then
  cp /app/config.example.json /app/config.json
  echo "Created /app/config.json from example. Edit it (or use the gear icon) to add your Growatt token."
fi

exec node server.mjs
