# Morning Desk

Local dashboard: Growatt solar, weather, Sky News live, Daily Maverick and CNN.

## Docker (Proxmox LXC or any host)

git clone https://github.com/GunsToy/morning-desk.git
cd morning-desk
cp config.example.json config.json
nano config.json
docker compose up -d --build

Dashboard: `http://<host>:4123`

`config.json` is gitignored and mounted into the container so the token is not committed.
