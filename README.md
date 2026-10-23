# Morning Desk

Local dashboard: solar (Growatt or Victron), weather, Sky News live and news feeds.

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

## Solar providers

Each profile picks one solar provider and keeps its own credentials for it. Right now that is **Growatt** or **Victron VRM**. The Settings screen draws the form from the provider's field list, saved tokens and passwords are never sent back to the browser, and switching provider keeps the other one's saved details.

A provider is one file in `providers/` that fetches readings from a vendor's cloud and returns them in a common shape. `providers/common.mjs` documents the shape and the field list, and `providers/index.mjs` is where a new provider is registered. A provider with a strict API quota can set `minIntervalMs` so it is polled less often than the dashboard's 15 minutes.

### Victron VRM

Reads a Victron system (Cerbo GX / Venus OS, MultiPlus / Quattro, SmartSolar, Smart/BMV shunt) through the VRM portal's API.

1. In VRM go to **Preferences → Integrations → Access tokens → Add**, name it "Morning Desk" and copy the token (it is shown once). A token gives read access to every installation on your account.
2. In Settings choose **Victron VRM** as the provider and paste the token.
3. **Installation ID** can stay blank if your account has a single installation. Otherwise use the number in the VRM address, `vrm.victronenergy.com/installation/<id>/dashboard`.
4. Press **Check connection**. It tries the details you typed without saving them, shows what Morning Desk recognised (battery %, solar, grid, load) and lists every data point VRM returned.

What it reads: battery charge, voltage and current (power = V × A, positive current is charging), solar from your solar chargers plus any AC-coupled PV inverters, grid import from a grid meter, the load from the inverter/charger's AC output, and today's yield. VRM only receives new data every minute or so, so the dashboard shows what VRM last heard, and says so if that is more than 30 minutes old.

**Not yet confirmed against a live installation.** The matching of VRM's data points to dashboard fields is built from Victron's documentation and client libraries and tested against recorded-style responses, but not against real hardware. Different setups (no grid meter, DC-coupled only, several inverters, Fronius or other PV inverters) report slightly differently. If a figure is missing or looks wrong, press **Check connection**, open "All data points" and compare. The matching table sits at the top of `providers/victron.mjs` and is easy to adjust.

`config.json` is now version 3: each profile has a `solar` block (`provider` plus `settings` per provider) in place of the old `growatt` block. Older files are upgraded the next time settings are saved, and your Growatt token is carried over. To roll back to an older release after that, copy the token into the old `growatt` block by hand.

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
