# REST & WebSocket API Reference

Open Termkit exposes a RESTful JSON API and a real-time WebSocket protocol.

---

## Base URL & Headers

Default address: `http://127.0.0.1:8765`  
All API responses include `X-Content-Type-Options: nosniff` and `Content-Type: application/json`.

---

## Health & Diagnostics

### `GET /api/health`
Health check endpoint.
```json
{
  "ok": true,
  "app": "open-termkit",
  "dbPath": "/home/user/.open-termkit/open-termkit.db",
  "version": 1
}
```

### `GET /api/doctor`
Returns runtime diagnostics, host information, database size, memory usage, and tool detection.
```json
{
  "os": "darwin",
  "arch": "arm64",
  "goVersion": "go1.22.4",
  "numCPU": 8,
  "numGoroutine": 12,
  "uptimeSeconds": 340,
  "memory": {
    "allocMB": 18.2,
    "totalAllocMB": 42.5,
    "sysMB": 32.1,
    "numGC": 4
  },
  "database": {
    "exists": true,
    "sizeBytes": 32768
  },
  "terminalProfilesCount": 3,
  "sshProfilesCount": 2,
  "tools": [...]
}
```

---

## Terminal Profiles

### `GET /api/profiles`
Returns all terminal profiles.

### `POST /api/profiles`
Creates a terminal profile.
Body:
```json
{
  "name": "Zsh Custom",
  "shellCommand": "/bin/zsh",
  "args": ["-l"],
  "env": { "EDITOR": "nvim" },
  "cwd": "/path/to/project",
  "theme": "tokyo-night",
  "fontFamily": "JetBrains Mono, monospace",
  "fontSize": 14,
  "isDefault": false
}
```

### `GET /api/profiles/{id}`
Returns profile by ID.

### `PUT /api/profiles/{id}`
Updates existing profile by ID.

### `DELETE /api/profiles/{id}`
Deletes profile by ID.

---

## SSH Management

### `GET /api/ssh`
Returns all SSH profiles.

### `POST /api/ssh`
Creates an SSH profile.

### `PUT /api/ssh/{id}`
Updates an SSH profile.

### `DELETE /api/ssh/{id}`
Deletes an SSH profile.

### `POST /api/ssh/test` (or `POST /api/ssh/{id}/test`)
Tests TCP connectivity and measures round-trip latency to a host.
Response:
```json
{
  "reachable": true,
  "host": "example.com",
  "port": 22,
  "latencyMs": 18
}
```

### `POST /api/ssh/generate-key`
Generates a new Ed25519 key pair.
Request:
```json
{
  "name": "id_ed25519_prod",
  "comment": "user@example.com"
}
```
Response:
```json
{
  "path": "/home/user/.ssh/open-termkit/id_ed25519_prod",
  "publicKey": "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5... user@example.com"
}
```

### `POST /api/ssh/write-config`
Writes managed SSH config snippet to `~/.ssh/open-termkit/config`.
Request:
```json
{
  "ensureInclude": true
}
```

---

## Tools Catalog

### `GET /api/tools`
Scans and returns all tools with detection status.

### `POST /api/tools/{name}/install`
Installs tool using detected package manager.
Request:
```json
{
  "commandIndex": 0
}
```

---

## WebSocket Terminal Protocol (`/api/terminals/ws`)

Initiates an interactive PTY session.
Query parameters:
- `profile_id`: ID of the terminal profile (defaults to default profile if omitted).
- `cols`: Terminal columns (default: 80).
- `rows`: Terminal rows (default: 24).

### Client -> Server Messages
- Keystroke input: `{ "type": "input", "data": "string" }`
- Resize: `{ "type": "resize", "cols": 120, "rows": 36 }`
- Heartbeat ping: `{ "type": "ping", "data": "timestamp" }`

### Server -> Client Messages
- Output: `{ "type": "output", "data": "raw text or escape sequences" }`
- Pong: `{ "type": "pong", "data": "timestamp" }`
- Exit: `{ "type": "exit", "code": 0 }`
- Error: `{ "type": "error", "error": "message" }`
