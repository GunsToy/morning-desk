#!/bin/sh
set -e

# If no config was mounted, seed one from the example so the app can start.
if [ ! -f /app/config.json ]; then
  cp /app/config.example.json /app/config.json
  echo "Created /app/config.json from example. Edit it (or use the gear icon) to add your Growatt token."
fi

# The app runs as node, not root. It must be able to write config.json (settings and sessions are saved there),
# so hand the file to node on every start; this also fixes a file that was created by root on the host.
chown node:node /app/config.json
chmod 600 /app/config.json # password hashes and solar tokens: readable by node only, also on the host
exec su-exec node node server.mjs
