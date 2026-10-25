# Morning Desk

Local dashboard: solar (Growatt), weather, Sky News live and news feeds.

Dashboard: `http://<host>:4123`

`config.json` is gitignored and mounted into the container so the Growatt tokens are not committed.

## Profiles and signing in

A profile bundles a location, a Growatt account (OpenAPI address and token) and a set of news channels. Make one per household, site or person.

Every device signs in on the `/login` page before it sees the dashboard:

- The **house admin** signs in as `admin`. On the very first visit the login page asks you to choose that password. Until you do, anyone who opens the page can claim it, so do this straight after installing, or set `ADMIN_PASSWORD` (see below) instead. The admin sees every profile (a switcher appears in the header, and `/?profile=<id>` opens one) and can create, edit and delete them.
- **Each profile** can have its own sign-in: in **Settings**, the admin gives the profile a username and password. Whoever signs in with it sees only that profile, can change its settings and their own password, and nothing else. Clearing the username removes the sign-in.
- **Remember me** keeps a device signed in for 90 days, which suits a wall display; without it the sign-in ends after 12 hours or when the browser closes. Sign-ins survive restarts and updates (they are kept in `config.json` as hashes, never as the cookie itself).
- Passwords are stored as salted scrypt hashes. Eight wrong passwords from one address lock it out for ten minutes. A new password, a removed sign-in or a deleted profile signs that profile out everywhere.
- To set the password from the environment instead, uncomment `ADMIN_PASSWORD` in `docker-compose.yml`. It then replaces the stored one and cannot be changed from the settings screen.
- Growatt tokens never leave the server: the browser only learns whether a token is saved.
- If you put nginx in front, pass `Host` and `X-Forwarded-Proto` so the login cookie and the same-site check work: `proxy_set_header Host $host;` and `proxy_set_header X-Forwarded-Proto $scheme;`.
- The app only believes `X-Forwarded-*` headers from a proxy it trusts, so nobody on the network can fake their address to dodge the lockout. By default that is a proxy on the same machine as Node (`loopback`). If nginx (or Nginx Proxy Manager) runs elsewhere, set `TRUST_PROXY` in the `.env` file next to `docker-compose.yml` to the address nginx connects from: its LAN address, or for nginx on the Docker host itself the Compose network gateway (`docker network inspect morning-desk_default`, usually `172.18.0.1`). Until then every visitor through the proxy shares one lockout counter.
- Behind Cloudflare's proxy (orange cloud) as well, add Cloudflare's address ranges (https://www.cloudflare.com/ips/) after the proxy's address, separated by commas, so each visitor's own address is used: `TRUST_PROXY=192.168.0.20, 173.245.48.0/20, 103.21.244.0/22, …`. The same goes for a Cloudflare Tunnel: list the address cloudflared connects from. The login cookie is marked secure either way.
- Forgot the password? Delete the `"admin"` block from `config.json` and restart; the next visit lets you choose a new one.

An older single-profile `config.json` is upgraded automatically on first save: its location and token become a profile called after the location.

### Sign in with Poodle House

The login page can also offer **Sign in with Poodle House** (or any OpenID Connect provider), so people use one account for the house site, Recipes and this dashboard. Someone already signed in to Poodle House goes straight through without typing a password. The usernames and passwords above keep working next to it.

1. On the provider, register a client whose return address is `https://<this dashboard>/auth/sso/callback` (the Poodle House theme does this for `morningdesk.poodlehouse.co.za`; see its INSTALL.txt).
2. Next to `docker-compose.yml`, create a `.env` file (it is not in git, so the nightly update never touches it):

   ```
   SSO_ISSUER=https://poodlehouse.co.za/
   SSO_CLIENT_ID=morning-desk
   SSO_CLIENT_SECRET=<the same secret as PH_SSO_DESK_SECRET in wp-config.php>
   SSO_PUBLIC_URL=https://morningdesk.poodlehouse.co.za
   ```

   Optional: `SSO_NAME` (button text, default Poodle House) and `SSO_ADMIN_GROUP` (default `house-admin`).
3. `docker compose up -d` to restart with it. The button appears on the login page.
4. Sign in as the admin, open **Settings**, and in each profile list the Poodle House usernames that open it (for example `julian, partner`). Administrators on the provider (group `house-admin`) always sign in as the house admin; anyone not listed is told to ask the admin.

The sign-in always happens on `SSO_PUBLIC_URL`: a screen that opened the dashboard by its LAN address is moved there first. Unlinking a username signs that profile out everywhere. Signing out of Poodle House does not sign you out of Morning Desk.

## Solar providers

Each profile picks one solar provider and keeps its own credentials for it. Right now that is **Growatt**. The Settings screen draws the form from the provider's field list, saved tokens and passwords are never sent back to the browser, and switching provider keeps the other one's saved details.

A provider is one file in `providers/` that fetches readings from a vendor's cloud and returns them in a common shape. `providers/common.mjs` documents the shape and the field list, and `providers/index.mjs` is where a new provider is registered. A provider with a strict API quota can set `minIntervalMs` so it is polled less often than the dashboard's 15 minutes.

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

Run on the Proxmox host as root. It takes the next free CTID, downloads the Debian 12 template if needed, and installs Docker and Morning Desk. The container's root account has no password: open a shell from the Proxmox host with `pct enter <ctid>`, or set one with `pct exec <ctid> -- passwd` if you want to log in from the Proxmox console.

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

The daily update only installs a commit whose tests passed on GitHub (the **Test** workflow). If they failed, are still running, or GitHub cannot be reached, it keeps the current version and tries again the next day; the journal says which. To update anyway: `SKIP_TEST_CHECK=1 ./update.sh`.
