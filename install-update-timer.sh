#!/bin/sh
# Install a systemd timer that checks the repo every day at 04:15.
# Run once, from the Morning Desk clone, as root (or with sudo).

set -eu

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
chmod +x "$APP_DIR/update.sh"

cat > /etc/systemd/system/morning-desk-update.service << EOF
[Unit]
Description=Update Morning Desk from GitHub
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=oneshot
WorkingDirectory=$APP_DIR
ExecStart=$APP_DIR/update.sh
EOF

cat > /etc/systemd/system/morning-desk-update.timer << EOF
[Unit]
Description=Daily Morning Desk update check

[Timer]
OnCalendar=*-*-* 04:15:00
Persistent=true
RandomizedDelaySec=10m

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now morning-desk-update.timer
systemctl start morning-desk-update.service || true

echo "Timer installed. Check with:"
echo "  systemctl status morning-desk-update.timer"
echo "  journalctl -u morning-desk-update.service"
