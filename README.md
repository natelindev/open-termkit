# Open Termkit

<p align="center">
  <img src="docs/images/open-termkit-logo.png" alt="Open Termkit logo" width="96" />
</p>

<p align="center">
  <strong>Production-Grade Web Terminal & Developer Control Plane</strong><br>
  Built with Go, React 18, wterm, and SQLite.
</p>

<p align="center">
  <a href="#quickstart"><img src="https://img.shields.io/badge/go-1.22+-00ADD8?style=flat&logo=go" alt="Go Version" /></a>
  <a href="#quickstart"><img src="https://img.shields.io/badge/react-18-61DAFB?style=flat&logo=react" alt="React 18" /></a>
  <a href="#quickstart"><img src="https://img.shields.io/badge/vite-6-646CFF?style=flat&logo=vite" alt="Vite 6" /></a>
  <a href="#themes"><img src="https://img.shields.io/badge/design-Geist-000000?style=flat" alt="Geist Design System" /></a>
  <a href="#docker"><img src="https://img.shields.io/badge/docker-ready-2496ED?style=flat&logo=docker" alt="Docker Ready" /></a>
  <a href="docs/README.md"><img src="https://img.shields.io/badge/docs-tutorials-0070F3?style=flat" alt="Documentation & Tutorials" /></a>
</p>

---

`open-termkit` is a self-hosted terminal environment and developer workstation control plane. It compiles as a single, self-contained Go binary that serves an embedded React web application, hosts real-time pseudo-terminals (PTY) over WebSockets, manages SSH hosts and Ed25519 keys, provisions autonomous AI coding agents, and maintains persistent tmux workspaces.

---

## Screenshots

### Light Theme
![Open Termkit Light Theme](docs/images/open-termkit-light.png)

### Dark Theme
![Open Termkit Dark Theme](docs/images/open-termkit-dark.png)

---

## Key Features

- **Multi-Tab Terminal Workspace**: Run multiple concurrent PTY sessions with independent buffers, live ping telemetry, font scaling, auto-scroll locking, and fullscreen Zen mode.
- **Background Session Persistence**: Switch tabs without dropping connections or restarting tasks.
- **SSH Host & Key Manager**: 
  - Manage remote servers with custom ports, users, and ProxyJump hosts.
  - Generate modern Ed25519 key pairs in 1 click directly from the UI.
  - Test TCP reachability and round-trip ping latency.
  - 1-Click "Connect" spawns an interactive SSH terminal tab immediately.
  - Generates managed OpenSSH config snippets (`~/.ssh/open-termkit/config`).
- **AI Coding Agents Hub**: Detect, install, and launch autonomous coding agents including **Anthropic Claude Code**, **OpenAI Codex CLI**, **OpenCode**, and **Pi**.
- **Persistent Tmux Workspaces**: Built-in tmux presets (`tmux new-session -A -s main`) keep jobs running on the host across browser closes and disconnects.
- **Interactive Setup & Onboarding**: Categorized diagnostics for login shells (Zsh, Bash, Fish), developer utilities (Git, GitHub CLI, Docker, ripgrep, fzf, htop), SSH configs, and database storage.
- **System Doctor & Diagnostics**: Real-time host telemetry covering CPU cores, Goroutines, memory allocations, garbage collection cycles, and database file metrics.
- **Command Palette (`Cmd+K` / `Ctrl+K`)**: Keyboard-driven launcher to jump between tabs, profiles, tools, SSH hosts, and theme modes.
- **Geist Design System**: Vercel-inspired aesthetic featuring hairline borders, elevated monochrome chrome, 12 curated terminal color schemes, and first-class light/dark theme contrast.
- **In-App Documentation & Tutorials**: Complete documentation center built right into `/docs` with 7 step-by-step tutorials and reference guides.
- **Zero-Leak Sync Bundles**: Export and import profiles safely—private key contents are never exported.

---

## Quickstart

### 1. Build and Run from Source

Prerequisites: Go 1.22+ and Node.js 18+ (only for the build step).

```bash
# Clone the repository
git clone https://github.com/natelindev/open-termkit.git
cd open-termkit

# Build frontend and binary
make build

# Start Open Termkit
./bin/open-termkit serve --port 8765
```

Open your browser to <http://127.0.0.1:8765>.

### 2. Development Mode

Run the backend and Vite dev server with live hot-reloading:

```bash
make dev
```

The Vite dev server runs at <http://localhost:5173> and proxies API and WebSocket requests to `http://127.0.0.1:8765`.

---

## Docker Deployment

Build and run Open Termkit with persistent named volumes for SQLite database state and SSH keys:

```bash
# Build production Docker image
make frontend
make docker-build

# Run container
make docker-run
```

Or run Docker directly:

```bash
docker run -d \
  --name open-termkit \
  --restart unless-stopped \
  -p 127.0.0.1:8765:8765 \
  -v open-termkit-data:/home/open-termkit/.open-termkit \
  -v open-termkit-ssh:/home/open-termkit/.ssh \
  open-termkit:local
```

Smoke test the container:
```bash
make docker-smoke
```

---

## Native Linux Systemd Deployment

For production deployments on Linux servers without Docker, use the automated deployment script:

```bash
scripts/deploy-systemd.sh user@your-server.com
```

This compiles a Linux AMD64 binary, sets up a dedicated `open-termkit` service user, stores state under `/var/lib/open-termkit`, and activates the systemd unit.

To intentionally expose a root shell behind an authenticated reverse proxy:
```bash
scripts/deploy-systemd.sh --run-as root user@your-server.com
```

See [`docs/tutorials/05-production-deployment.md`](docs/tutorials/05-production-deployment.md) for Nginx/Caddy reverse proxy configurations with TLS and WebSocket support.

---

## CLI Reference

The `open-termkit` binary includes a Cobra command-line interface:

| Command | Arguments / Flags | Description |
| :--- | :--- | :--- |
| `serve` | `--host`, `--port` | Start web UI and API server (default port: `8765`) |
| `setup` | — | Automatically detect shells, tmux, and generate profile presets |
| `doctor` | — | Print comprehensive system diagnostics, paths, and tool statuses |
| `profile list` | — | List all terminal profiles in SQLite |
| `profile create` | `--name`, `--shell`, `--arg`, `--cwd`, `--theme`, `--default` | Create a new terminal profile |
| `profile update` | `<id>` | Update an existing terminal profile |
| `profile delete` | `<id>` | Delete a terminal profile |
| `ssh list` | — | List all configured SSH host profiles |
| `ssh create` | `--name`, `--host`, `--user`, `--port`, `--identity` | Create an SSH profile |
| `ssh import-key` | `<path>`, `--name` | Import a private key into `~/.ssh/open-termkit` |
| `ssh write-config`| `--include` | Write managed SSH config snippet |
| `tools list` | — | List tool catalog with local installation status |
| `tools detect` | — | Re-scan local tool catalog |
| `tools install` | `<name>`, `--yes` | Install a catalog tool via local package manager |
| `sync export` | `--file` | Export configuration bundle |
| `sync import` | `--file` | Import configuration bundle |

---

## Documentation & Tutorials

Comprehensive documentation is available both in the repo and within the app at `/docs`:

- **Portal Overview**: [`docs/README.md`](docs/README.md)
- **Quickstart Guide**: [`docs/getting-started/quickstart.md`](docs/getting-started/quickstart.md)
- **Architecture Overview**: [`docs/getting-started/architecture.md`](docs/getting-started/architecture.md)
- **Tutorial 1**: [Multi-Tab Terminal Sessions](docs/tutorials/01-multi-tab-terminals.md)
- **Tutorial 2**: [SSH Keys & Remote Host Management](docs/tutorials/02-ssh-keys-and-remote-hosts.md)
- **Tutorial 3**: [Setting Up AI Coding Agents](docs/tutorials/03-ai-coding-agents.md)
- **Tutorial 4**: [Persistent Workspaces with Tmux](docs/tutorials/04-tmux-persistent-sessions.md)
- **Tutorial 5**: [Production Deployment & Remote Access](docs/tutorials/05-production-deployment.md)
- **Tutorial 6**: [Customizing Themes & Typography](docs/tutorials/06-customizing-themes.md)
- **Tutorial 7**: [Backup, Export & Team Sync Bundles](docs/tutorials/07-sync-bundles-and-backups.md)
- **CLI Reference**: [`docs/reference/cli.md`](docs/reference/cli.md)
- **API Reference**: [`docs/reference/api.md`](docs/reference/api.md)

---

## License

MIT License. See [LICENSE](LICENSE) for details.
