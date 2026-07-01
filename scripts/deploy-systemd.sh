#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/deploy-systemd.sh <ssh-host>

Build a Linux Open Termkit binary, upload it to a host, install the tracked
systemd unit, restart the service, and verify the localhost health endpoint.

Defaults:
  service name: open-termkit
  service user: open-termkit
  service home: /var/lib/open-termkit
  binary path: /var/lib/open-termkit/bin/open-termkit
  bind address: 127.0.0.1:8765
USAGE
}

log() {
  printf '[deploy-systemd] %s\n' "$*" >&2
}

fail() {
  printf '[deploy-systemd] error: %s\n' "$*" >&2
  exit 1
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

HOST="${1:-${SYSTEMD_HOST:-}}"
[[ -n "$HOST" ]] || { usage >&2; exit 2; }

SERVICE_NAME="open-termkit"
SERVICE_USER="open-termkit"
SERVICE_HOME="/var/lib/open-termkit"
SERVICE_PORT="8765"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNIT_FILE="$ROOT_DIR/deploy/systemd/open-termkit.service"
BUILD_DIR="$ROOT_DIR/tmp/deploy-systemd"

[[ -f "$UNIT_FILE" ]] || fail "missing unit file: $UNIT_FILE"
command -v ssh >/dev/null 2>&1 || fail "ssh is required"
command -v scp >/dev/null 2>&1 || fail "scp is required"
command -v go >/dev/null 2>&1 || fail "go is required"
command -v npm >/dev/null 2>&1 || fail "npm is required"

log "probing $HOST"
remote_probe="$(ssh -o BatchMode=yes "$HOST" 'set -eu; printf "%s %s\n" "$(uname -s)" "$(uname -m)"')"
remote_os="${remote_probe%% *}"
remote_machine="${remote_probe#* }"
[[ "$remote_os" == "Linux" ]] || fail "remote OS must be Linux, got $remote_os"

case "$remote_machine" in
  x86_64|amd64) GOARCH=amd64 ;;
  aarch64|arm64) GOARCH=arm64 ;;
  armv7l|armv7) GOARCH=arm ;;
  *) fail "unsupported remote architecture: $remote_machine" ;;
esac

log "remote architecture: $remote_machine -> GOARCH=$GOARCH"
log "building frontend"
make -C "$ROOT_DIR" frontend

mkdir -p "$BUILD_DIR"
ARTIFACT="$BUILD_DIR/open-termkit-linux-$GOARCH"
log "building Linux binary: $ARTIFACT"
(
  cd "$ROOT_DIR"
  GOOS=linux GOARCH="$GOARCH" CGO_ENABLED=0 \
    go build -trimpath -ldflags="-s -w" -o "$ARTIFACT" ./cmd/open-termkit
)

remote_tmp="$(ssh "$HOST" 'mktemp -d /tmp/open-termkit-deploy.XXXXXX')"
cleanup_remote() {
  ssh "$HOST" "rm -rf '$remote_tmp'" >/dev/null 2>&1 || true
}
trap cleanup_remote EXIT

log "uploading artifact and unit to $HOST:$remote_tmp"
scp "$ARTIFACT" "$HOST:$remote_tmp/open-termkit" >/dev/null
scp "$UNIT_FILE" "$HOST:$remote_tmp/open-termkit.service" >/dev/null

log "installing service on $HOST"
ssh "$HOST" \
  "REMOTE_TMP='$remote_tmp' SERVICE_NAME='$SERVICE_NAME' SERVICE_USER='$SERVICE_USER' SERVICE_HOME='$SERVICE_HOME' SERVICE_PORT='$SERVICE_PORT' bash -s" <<'REMOTE'
set -euo pipefail

if [[ "$(id -u)" == "0" ]]; then
  SUDO=()
else
  SUDO=(sudo -n)
fi

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    printf 'missing required command on remote host: %s\n' "$1" >&2
    exit 1
  }
}

need_cmd systemctl
need_cmd bash
need_cmd install
need_cmd getent

if ! getent group "$SERVICE_USER" >/dev/null; then
  "${SUDO[@]}" groupadd --system "$SERVICE_USER"
fi

if ! id "$SERVICE_USER" >/dev/null 2>&1; then
  "${SUDO[@]}" useradd --system \
    --gid "$SERVICE_USER" \
    --home-dir "$SERVICE_HOME" \
    --create-home \
    --shell /bin/bash \
    "$SERVICE_USER"
else
  "${SUDO[@]}" usermod --shell /bin/bash "$SERVICE_USER"
fi

"${SUDO[@]}" install -d -o "$SERVICE_USER" -g "$SERVICE_USER" -m 0750 "$SERVICE_HOME"
"${SUDO[@]}" install -d -o "$SERVICE_USER" -g "$SERVICE_USER" -m 0700 "$SERVICE_HOME/.open-termkit" "$SERVICE_HOME/.ssh"
"${SUDO[@]}" install -d -o root -g "$SERVICE_USER" -m 0750 "$SERVICE_HOME/bin"
"${SUDO[@]}" install -o root -g "$SERVICE_USER" -m 0750 "$REMOTE_TMP/open-termkit" "$SERVICE_HOME/bin/open-termkit"
"${SUDO[@]}" install -o root -g root -m 0644 "$REMOTE_TMP/open-termkit.service" "/etc/systemd/system/$SERVICE_NAME.service"

"${SUDO[@]}" systemctl daemon-reload
"${SUDO[@]}" systemctl enable "$SERVICE_NAME" >/dev/null
"${SUDO[@]}" systemctl restart "$SERVICE_NAME"
"${SUDO[@]}" systemctl is-active --quiet "$SERVICE_NAME"

if command -v curl >/dev/null 2>&1; then
  healthy=0
  for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
    if curl -fsS "http://127.0.0.1:$SERVICE_PORT/api/health" >/dev/null 2>&1; then
      healthy=1
      break
    fi
    sleep 1
  done
  [[ "$healthy" == "1" ]] || {
    printf 'health endpoint did not become ready: http://127.0.0.1:%s/api/health\n' "$SERVICE_PORT" >&2
    exit 1
  }
else
  printf 'curl not installed on remote host, skipped health endpoint check\n' >&2
fi

"${SUDO[@]}" systemctl status "$SERVICE_NAME" --no-pager --lines=12
REMOTE

printf 'deployed host=%s service=%s url=http://127.0.0.1:%s\n' "$HOST" "$SERVICE_NAME" "$SERVICE_PORT"
