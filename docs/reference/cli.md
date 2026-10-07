# CLI Reference

The `open-termkit` binary includes a Cobra command-line interface.

---

## Global Flags

| Flag | Type | Description |
| :--- | :--- | :--- |
| `--db` | `string` | Custom path to SQLite database (default: `~/.open-termkit/open-termkit.db`) |
| `-h`, `--help` | `bool` | Help for open-termkit |

---

## Commands

### `open-termkit serve`
Starts the local web server, API, and WebSocket handler.

```bash
open-termkit serve [flags]
```

Flags:
- `--host string`: Host interface to bind (default: `"127.0.0.1"`)
- `--port int`: Port to bind (default: `8765`, use `0` for an auto-assigned port)

---

### `open-termkit setup`
Runs tool detection and creates preset terminal profiles for shells, tmux, and agents.

```bash
open-termkit setup
```

---

### `open-termkit doctor`
Prints system diagnostics, paths, database metrics, and detected tools.

```bash
open-termkit doctor
```

---

### `open-termkit profile`
Manage terminal profiles.

```bash
# List all profiles
open-termkit profile list

# Get profile by ID
open-termkit profile get <id>

# Create profile
open-termkit profile create --name "Zsh" --shell "/bin/zsh" --theme "monokai" --default

# Update profile
open-termkit profile update <id> --name "Renamed Shell"

# Delete profile
open-termkit profile delete <id>
```

---

### `open-termkit ssh`
Manage SSH profiles and keys.

```bash
# List SSH profiles
open-termkit ssh list

# Create SSH profile
open-termkit ssh create --name "prod" --host "example.com" --user "ubuntu" --port 22

# Update SSH profile
open-termkit ssh update <id> --port 2222

# Delete SSH profile
open-termkit ssh delete <id>

# Import private key into managed store
open-termkit ssh import-key /path/to/key --name id_ed25519_prod

# Write managed config snippet
open-termkit ssh write-config --include
```

---

### `open-termkit tools`
Inspect and install developer and agent tools.

```bash
# List tools and detection status
open-termkit tools list

# Re-scan tool detection
open-termkit tools detect

# Install a tool
open-termkit tools install tmux --yes
```

---

### `open-termkit sync`
Export and import configuration bundles.

```bash
# Export bundle
open-termkit sync export --file backup.json

# Import bundle
open-termkit sync import --file backup.json
```
