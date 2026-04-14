#!/usr/bin/env bash
# Idempotent installer for every systemd unit under infra/systemd/.
# Re-run safely on every deploy — copies units, reloads systemd, enables every
# .timer (services are pulled in by their timers).
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SYSTEMD_SRC="$REPO_DIR/infra/systemd"
SYSTEMD_DST="/etc/systemd/system"

if [[ $EUID -ne 0 ]]; then
  echo "must run as root (sudo)" >&2
  exit 1
fi

if [[ ! -d "$SYSTEMD_SRC" ]]; then
  echo "no $SYSTEMD_SRC, nothing to install" >&2
  exit 1
fi

# Copy every .service and .timer unit from the repo into /etc/systemd/system.
shopt -s nullglob
for unit in "$SYSTEMD_SRC"/*.service "$SYSTEMD_SRC"/*.timer; do
  name=$(basename "$unit")
  install -m 644 "$unit" "$SYSTEMD_DST/$name"
  echo "installed $name"
done

systemctl daemon-reload

# Enable + start every .timer unit. Services are invoked by their timers,
# so we never enable a .service directly here.
for timer in "$SYSTEMD_SRC"/*.timer; do
  name=$(basename "$timer")
  systemctl enable --now "$name"
  echo "enabled $name"
done

echo
echo "active SealedHash timers:"
systemctl list-timers --all | grep sealedhash || echo "  (none yet — first daemon-reload may need a moment)"
