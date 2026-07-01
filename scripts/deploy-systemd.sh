#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/deploy-systemd.sh [--run-as open-termkit|root] <ssh-host>

Build a Linux Open Termkit binary, upload it to a host, install the selected
systemd unit, restart the service, and verify the localhost health endpoint.

Defaults:
  service name: open-termkit
  run as: open-termkit
  non-root home: /var/lib/open-termkit
  root home: /root
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

RUN_AS="open-termkit"
HOST=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --run-as)
      [[ $# -ge 2 ]] || fail "--run-as requires open-termkit or root"
      RUN_AS="$2"
      shift 2
      ;;
    --run-as=*)
      RUN_AS="${1#--run-as=}"
      shift
      ;;
    --)
      shift
      [[ $# -le 1 ]] || fail "expected one ssh host"
      HOST="${1:-}"
      shift $(( $# > 0 ? 1 : 0 ))
      ;;
    -*)
      fail "unknown option: $1"
      ;;
    *)
      [[ -z "$HOST" ]] || fail "expected one ssh host"
      HOST="$1"
      shift
      ;;
  esac
done

HOST="${HOST:-${SYSTEMD_HOST:-}}"
[[ -n "$HOST" ]] || { usage >&2; exit 2; }

SERVICE_NAME="open-termkit"
SERVICE_PORT="8765"
BINARY_DIR="/var/lib/open-termkit/bin"
BINARY_PATH="$BINARY_DIR/open-termkit"

case "$RUN_AS" in
  open-termkit)
    SERVICE_USER="open-termkit"
    SERVICE_GROUP="open-termkit"
    SERVICE_HOME="/var/lib/open-termkit"
    UNIT_BASENAME="open-termkit.service"
    ;;
  root)
    SERVICE_USER="root"
    SERVICE_GROUP="root"
    SERVICE_HOME="/root"
    UNIT_BASENAME="open-termkit-root.service"
    ;;
  *)
    fail "unsupported --run-as value: $RUN_AS"
    ;;
esac

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNIT_FILE="$ROOT_DIR/deploy/systemd/$UNIT_BASENAME"
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
log "selected unit: $UNIT_BASENAME, user: $SERVICE_USER"
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
  "REMOTE_TMP='$remote_tmp' SERVICE_NAME='$SERVICE_NAME' SERVICE_USER='$SERVICE_USER' SERVICE_GROUP='$SERVICE_GROUP' SERVICE_HOME='$SERVICE_HOME' SERVICE_PORT='$SERVICE_PORT' BINARY_DIR='$BINARY_DIR' BINARY_PATH='$BINARY_PATH' RUN_AS='$RUN_AS' bash -s" <<'REMOTE'
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

if [[ "$RUN_AS" != "root" ]]; then
  if ! getent group "$SERVICE_GROUP" >/dev/null; then
    "${SUDO[@]}" groupadd --system "$SERVICE_GROUP"
  fi

  if ! id "$SERVICE_USER" >/dev/null 2>&1; then
    "${SUDO[@]}" useradd --system \
      --gid "$SERVICE_GROUP" \
      --home-dir "$SERVICE_HOME" \
      --create-home \
      --shell /bin/bash \
      "$SERVICE_USER"
  else
    "${SUDO[@]}" usermod --shell /bin/bash "$SERVICE_USER"
  fi
fi

if [[ "$RUN_AS" == "root" ]]; then
  "${SUDO[@]}" install -d -o root -g root -m 0700 "$SERVICE_HOME"
else
  "${SUDO[@]}" install -d -o "$SERVICE_USER" -g "$SERVICE_GROUP" -m 0750 "$SERVICE_HOME"
fi
"${SUDO[@]}" install -d -o "$SERVICE_USER" -g "$SERVICE_GROUP" -m 0700 "$SERVICE_HOME/.open-termkit" "$SERVICE_HOME/.ssh"
"${SUDO[@]}" install -d -o root -g root -m 0755 /var/lib/open-termkit
"${SUDO[@]}" install -d -o root -g root -m 0755 "$BINARY_DIR"
"${SUDO[@]}" install -o root -g root -m 0755 "$REMOTE_TMP/open-termkit" "$BINARY_PATH"
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

printf 'deployed host=%s service=%s run_as=%s url=http://127.0.0.1:%s\n' "$HOST" "$SERVICE_NAME" "$RUN_AS" "$SERVICE_PORT"
