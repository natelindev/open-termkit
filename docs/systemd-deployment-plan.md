# Native systemd deployment plan

This plan describes how to deploy Open Termkit as a native Linux systemd service. The service binds to localhost by default and is intended to sit behind a reverse proxy, Cloudflare Tunnel, VPN, or another authenticated edge.

## Stage 1: Prepare release artifact

Build the frontend first so the Go binary embeds current static assets, then build a Linux binary for the target architecture.

```sh
make frontend
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o tmp/deploy-systemd/open-termkit ./cmd/open-termkit
```

For ARM64 hosts, use `GOARCH=arm64`.

## Stage 2: Install host prerequisites

On the Linux host:

1. Confirm systemd is available.
2. Confirm `/bin/bash` exists.
3. Create the dedicated service account and state directories.
4. Install the binary to `/var/lib/open-termkit/bin/open-termkit`.
5. Install the unit file to `/etc/systemd/system/open-termkit.service`.

The binary is stored under `/var/lib/open-termkit/bin` instead of `/usr/local/bin` so the deployment also works on appliance-style Linux hosts where `/usr` is mounted read-only.

The service user must have a real shell, or the service must set `SHELL=/bin/bash`, because Open Termkit launches PTY-backed shell sessions.

## Stage 3: Configure systemd

Use the tracked unit file at `deploy/systemd/open-termkit.service`.

Important choices in the unit:

- `ExecStart` runs `/var/lib/open-termkit/bin/open-termkit serve --host 127.0.0.1 --port 8765`.
- Host and port are CLI flags, not environment variables.
- `HOME=/var/lib/open-termkit` keeps the SQLite database and managed SSH files under service-owned state.
- The service uses `Restart=on-failure`.
- Basic sandboxing is enabled while keeping `/var/lib/open-termkit` writable.

## Stage 4: Start and verify

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now open-termkit
sudo systemctl restart open-termkit
sudo systemctl is-active open-termkit
curl -fsS http://127.0.0.1:8765/api/health
```

Expected health response includes `"ok": true`, plus app metadata such as version and database path.

## Stage 5: Put authenticated access in front

Open Termkit is a browser-accessible terminal. Do not expose it directly to the public internet without authentication.

Recommended options:

1. Cloudflare Tunnel with Access policy.
2. VPN-only access.
3. Nginx or Caddy with TLS and an auth layer.

If using Nginx, preserve WebSocket headers and use long read and send timeouts.

```nginx
location / {
    proxy_pass http://127.0.0.1:8765;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
}
```

## Stage 6: Automated deployment triggers

Local trigger:

```sh
scripts/deploy-systemd.sh tnas-cf
```

GitHub Actions trigger:

1. Add the `SYSTEMD_SSH_PRIVATE_KEY` repository secret.
2. Optionally add `SYSTEMD_SSH_KNOWN_HOSTS`; otherwise the workflow uses `ssh-keyscan`.
3. Run the `Deploy native systemd` workflow manually with the target SSH host and user.

The local script and workflow both discover the remote CPU architecture and build the matching Linux binary.

## Agent progress

- [x] Reviewed the CLI and confirmed `serve --host ... --port ...` is required.
- [x] Confirmed host and port are not currently read from environment variables.
- [x] Added a tracked systemd unit file.
- [x] Added a deployment helper script.
- [x] Added a manual GitHub Actions deployment workflow.
- [x] Build the Linux amd64 artifact.
- [x] Install on `tnas-cf`.
- [x] Verify the systemd service and local health endpoint.
- [x] Adjust binary install path to `/var/lib/open-termkit/bin/open-termkit` for hosts with read-only `/usr`.
