# Morning Desk

Local dashboard: Growatt solar, weather, Sky News live, Daily Maverick and CNN.

## Docker (Proxmox LXC or any host)

```bash
cp config.example.json config.json
# edit config.json and paste your Growatt OpenAPI token
docker compose up -d --build
```

Dashboard: `http://<host>:4123`

`config.json` is gitignored and mounted into the container so the token is not committed.
