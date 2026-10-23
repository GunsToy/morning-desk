#!/bin/bash
# Morning Desk — create a Proxmox LXC and install it.
# Run on the Proxmox host as root:
#   bash install-proxmox.sh
#
# - next free CTID
# - static IP, or blank for DHCP
# - Docker + Morning Desk + daily auto-update
# - container root has no password; open a shell from the host with: pct enter <ctid>

set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root on the Proxmox host."
  exit 1
fi

if ! command -v pct >/dev/null 2>&1; then
  echo "pct not found. This script must run on a Proxmox host."
  exit 1
fi

HOSTNAME="${HOSTNAME_CT:-morningdesk}"
MEMORY="${MEMORY:-512}"
CORES="${CORES:-1}"
DISK_GB="${DISK_GB:-8}"
BRIDGE="${BRIDGE:-vmbr0}"
# Set TEMPLATE_STORAGE / ROOTFS_STORAGE to skip the prompts
TEMPLATE_STORAGE="${TEMPLATE_STORAGE:-}"
ROOTFS_STORAGE="${ROOTFS_STORAGE:-}"
REPO="${REPO:-https://github.com/GunsToy/morning-desk.git}"
TEMPLATE_NAME="debian-12-standard_12.7-1_amd64.tar.zst"

# Messages go to stderr so functions called as "$(...)" return only their value.
log() { printf '\033[1;36m==>\033[0m %s\n' "$*" >&2; }

next_ctid() {
  if command -v pvesh >/dev/null 2>&1; then
    pvesh get /cluster/nextid
    return
  fi
  local id=100
  while pct status "$id" >/dev/null 2>&1; do
    id=$((id + 1))
  done
  echo "$id"
}


list_storages() {
  local content="$1"
  # pvesm status -content <type> prints storage rows (skip header)
  pvesm status -content "$content" 2>/dev/null | awk 'NR>1 {print $1}'
}

select_storage() {
  local content="$1"
  local prompt="$2"
  local current="$3"
  if [ -n "$current" ]; then
    echo "$current"
    return
  fi
  local -a stores=()
  while IFS= read -r line; do
    [ -n "$line" ] && stores+=("$line")
  done < <(list_storages "$content")
  if [ "${#stores[@]}" -eq 0 ]; then
    echo "No storage with content type '$content' found." >&2
    exit 1
  fi
  echo >&2
  echo "$prompt" >&2
  local i=1
  for s in "${stores[@]}"; do
    printf '  %d) %s\n' "$i" "$s" >&2
    i=$((i + 1))
  done
  local choice
  while true; do
    read -r -p "Choice [1-${#stores[@]}]: " choice
    if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le "${#stores[@]}" ]; then
      echo "${stores[$((choice - 1))]}"
      return
    fi
    echo "Invalid choice." >&2
  done
}

ensure_template() {
  local dir="/var/lib/vz/template/cache"
  mkdir -p "$dir"

  # Prefer a known short name if it already exists.
  local name=""
  if [ -f "$dir/$TEMPLATE_NAME" ]; then
    name="$TEMPLATE_NAME"
  else
    # Pick the newest debian-12-standard already on disk.
    local found
    found="$(ls -1t "$dir"/debian-12-standard_*.tar.zst 2>/dev/null | head -1 || true)"
    if [ -n "$found" ]; then
      name="$(basename "$found")"
    fi
  fi

  if [ -z "$name" ]; then
    log "Downloading Debian 12 template"
    pveam update >/dev/null 2>&1 || true
    local avail
    # pveam available prints: section  filename
    avail="$(pveam available --section system 2>/dev/null | awk '/debian-12-standard/ {print $2; exit}')"
    if [ -z "$avail" ]; then
      {
        echo "No debian-12-standard template available."
        echo "Download one with:"
        echo "  pveam update && pveam available --section system | grep debian-12"
        echo "  pveam download local debian-12-standard_12.7-1_amd64.tar.zst"
      } >&2
      exit 1
    fi
    # Strip any path prefix; we only want the filename.
    name="$(basename "$avail")"
    pveam download "$TEMPLATE_STORAGE" "$name" >&2
  fi

  if [ ! -f "$dir/$name" ]; then
    echo "Template file missing after download: $dir/$name" >&2
    exit 1
  fi
  echo "${TEMPLATE_STORAGE}:vztmpl/${name}"
}
prompt_ip() {
  echo
  echo "Network on $BRIDGE"
  echo "Enter a static IP with prefix (example: 192.168.0.50/24)"
  echo "Leave blank for DHCP."
  read -r -p "IP: " IP_INPUT
  IP_INPUT="${IP_INPUT// /}"
  if [ -z "$IP_INPUT" ]; then
    NET="name=eth0,bridge=${BRIDGE},ip=dhcp"
    echo "Using DHCP."
  else
    case "$IP_INPUT" in
      */*) ;;
      *)
        echo "Add a prefix, for example ${IP_INPUT}/24"
        exit 1
        ;;
    esac
    read -r -p "Gateway (example: 192.168.0.1): " GW
    GW="${GW// /}"
    if [ -z "$GW" ]; then
      echo "Gateway is required for a static IP."
      exit 1
    fi
    NET="name=eth0,bridge=${BRIDGE},ip=${IP_INPUT},gw=${GW}"
    echo "Using static ${IP_INPUT} via ${GW}."
  fi
}

CTID="$(next_ctid)"
log "Next CTID: $CTID"
TEMPLATE_STORAGE="$(select_storage vztmpl "Template storage (where CT templates are stored):" "$TEMPLATE_STORAGE")"
ROOTFS_STORAGE="$(select_storage rootdir "Root disk storage (where the container disk will live):" "$ROOTFS_STORAGE")"
log "Template storage: $TEMPLATE_STORAGE"
log "Rootfs storage:   $ROOTFS_STORAGE"
prompt_ip

if pct status "$CTID" >/dev/null 2>&1; then
  echo "CTID $CTID already exists."
  exit 1
fi

TEMPLATE="$(ensure_template)"
log "Using template $TEMPLATE"

# Refuse a storage that is not actually present
if ! pvesm status -storage "$ROOTFS_STORAGE" >/dev/null 2>&1; then
  echo "Storage '$ROOTFS_STORAGE' does not exist on this node."
  echo "Available rootdir storages:"
  pvesm status -content rootdir 2>/dev/null | awk 'NR>1 {print "  " $1}' || true
  exit 1
fi

log "Creating container $CTID ($HOSTNAME)"
pct create "$CTID" "$TEMPLATE" \
  --hostname "$HOSTNAME" \
  --memory "$MEMORY" \
  --cores "$CORES" \
  --rootfs "${ROOTFS_STORAGE}:${DISK_GB}" \
  --net0 "$NET" \
  --features nesting=1,keyctl=1 \
  --unprivileged 1 \
  --onboot 1 \
  --start 0

log "Starting container"
pct start "$CTID"
# Wait until the guest answers.
for _ in $(seq 1 30); do
  if pct exec "$CTID" -- true >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

log "Installing dependencies inside the container"
pct exec "$CTID" -- bash -lc '
  set -euo pipefail
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install -y ca-certificates curl git
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker || service docker start
'

log "Cloning Morning Desk and installing"
pct exec "$CTID" -- bash -lc "
  set -euo pipefail
  cd /root
  if [ ! -d morning-desk/.git ]; then
    git clone ${REPO} morning-desk
  fi
  cd morning-desk
  if [ ! -f config.json ]; then
    cp config.example.json config.json
  fi
  chmod +x install.sh update.sh install-update-timer.sh
  docker compose up -d --build
  ./install-update-timer.sh
"

IP_SHOW="$(pct exec "$CTID" -- hostname -I 2>/dev/null | awk '{print $1}')"
echo
log "Morning Desk container $CTID is up"
echo "  Hostname: $HOSTNAME"
echo "  IP:       ${IP_SHOW:-see pct exec $CTID -- hostname -I}"
echo "  Dashboard: http://${IP_SHOW:-<container-ip>}:4123"
echo "  Shell:    pct enter $CTID   (root has no password; set one with: pct exec $CTID -- passwd)"
echo "  Edit the Growatt token:"
echo "    pct enter $CTID"
echo "    nano /root/morning-desk/config.json"
echo "    cd /root/morning-desk && docker compose up -d --build"
