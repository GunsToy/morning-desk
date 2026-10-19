# Morning Desk — Proxmox container deploy

Clean package for Docker on an LXC (or VM).

## On the container

```bash
cd /root
tar -xzf morning-desk.tar.gz
cd morning-desk
cp config.example.json config.json
nano config.json          # paste Growatt API token
docker compose up -d --build
```

Dashboard: http://<container-ip>:4123

## Update later

```bash
cd /root/morning-desk
docker compose up -d --build
```

config.json is mounted from the host path, so rebuilds keep your token.
