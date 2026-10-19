# Morning Desk

Local dashboard: Growatt solar, weather, Sky News live, Daily Maverick and CNN.

Dashboard: `http://<host>:4123`

`config.json` is gitignored and mounted into the container so the Growatt token is not committed.

## Minimum container requirements

| Resource | Minimum |
|----------|---------|
| CPU | 1 vCPU |
| RAM | 512 MB |
| Disk | 8 GB |
| OS | Debian 12 |
| Features | Nesting enabled (required for Docker in an LXC) |
| Ports | 4123/tcp |

## Install on Proxmox (creates the container)

Run on the Proxmox host as root. It takes the next free CTID, downloads the Debian 12 template if needed, installs Docker and Morning Desk, and copies the Proxmox root password into the container.

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/GunsToy/morning-desk/main/install-proxmox.sh)"
```

When asked for an IP, enter a static address with a prefix (`192.168.0.50/24`) or leave it blank for DHCP.

The repo is private, so this curl only works if the repository is public or you pass a token:

```bash
bash -c "$(curl -fsSL -H 'Authorization: Bearer YOUR_TOKEN' https://raw.githubusercontent.com/GunsToy/morning-desk/main/install-proxmox.sh)"
```

## Install inside an existing container

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
