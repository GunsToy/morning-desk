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

```bash
git clone https://github.com/GunsToy/morning-desk.git
cd morning-desk
cp config.example.json config.json
nano config.json
docker compose up -d --build
```

## Auto-update

`update.sh` checks GitHub and, only if `main` has new commits, pulls and rebuilds the container. `config.json` is left alone.

Run once by hand:

```bash
./update.sh
```

Install a daily check at 04:15 (as root, from the clone):

```bash
chmod +x update.sh install-update-timer.sh
./install-update-timer.sh
```
