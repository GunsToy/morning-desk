# Morning Desk — Proxmox container deploy

## On the container

```bash
git clone https://github.com/GunsToy/morning-desk.git
cd morning-desk
cp config.example.json config.json
nano config.json
chmod +x install.sh update.sh install-update-timer.sh
./install.sh
```

`install.sh` starts the dashboard and installs the daily auto-update.

Dashboard: http://<container-ip>:4123

config.json is mounted from the host path, so rebuilds keep your token.
