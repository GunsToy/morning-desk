# Morning Desk

Local dashboard: Growatt solar, weather, Sky News live, Daily Maverick and CNN.

Dashboard: `http://<host>:4123`

`config.json` is gitignored and mounted into the container so the Growatt token is not committed.

## Minimum container requirements

| Resource | Minimum |
|----------|---------|
| CPU | 1 vCPU |
| RAM | 512 MB |
| Disk | 2 GB |
| OS | Debian 12 or Ubuntu 24.04 |
| Features | Nesting enabled (required for Docker in an LXC) |
| Ports | 4123/tcp |

Docker (or Docker Engine + Compose plugin) must be installed in the container.

## Install

Starts the dashboard and installs the daily auto-update (checks GitHub at 04:15, pulls and rebuilds only when `main` changed, leaves `config.json` alone).

```bash
git clone https://github.com/GunsToy/morning-desk.git
cd morning-desk
cp config.example.json config.json
nano config.json
chmod +x install.sh update.sh install-update-timer.sh
./install.sh
```

Check the update timer:

```bash
systemctl status morning-desk-update.timer
journalctl -u morning-desk-update.service
```
