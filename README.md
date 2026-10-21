# Morning Desk

Local dashboard: Growatt solar, weather, Sky News live, Daily Maverick and CNN.

Dashboard: `http://<host>:4123`

`config.json` is gitignored and mounted into the container so the Growatt tokens are not committed.

## Profiles and the admin password

A profile bundles a location, a Growatt account (OpenAPI address and token) and a set of news channels. Make one per household, site or person. If there is more than one, a switcher appears in the header. Each device remembers its choice, and `http://<host>:4123/?profile=<id>` opens a specific profile, which is handy for a wall display.

Anyone on the network can view the dashboard, but changing settings needs the admin password:

- On the first visit, **Settings** asks you to choose the password. Until you do, anyone who opens the page can claim it, so do this straight after installing, or set `ADMIN_PASSWORD` (see below) instead.
- The password is stored as a salted scrypt hash in `config.json`. Sessions last 12 hours, are cleared when the app restarts, and eight wrong passwords from one address lock it out for ten minutes.
- To set the password from the environment instead, uncomment `ADMIN_PASSWORD` in `docker-compose.yml`. It then replaces the stored one and cannot be changed from the settings screen.
- Growatt tokens never leave the server: the browser only learns whether a token is saved.
- If you put nginx in front, pass `Host` and `X-Forwarded-Proto` so the login cookie and the same-site check work: `proxy_set_header Host $host;` and `proxy_set_header X-Forwarded-Proto $scheme;`.
- Forgot the password? Delete the `"admin"` block from `config.json` and restart; the next visit lets you choose a new one.

An older single-profile `config.json` is upgraded automatically on first save: its location and token become a profile called after the location.

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
