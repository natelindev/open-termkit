# Open Termkit Documentation

Welcome to the Open Termkit documentation portal. Open Termkit is a self-hosted web terminal and developer control plane built with Go, React, wterm, and SQLite.

[Public documentation](https://open-termkit.pages.dev/) · [Contributing](../CONTRIBUTING.md)

---

## Table of Contents

### Getting Started
- [Quickstart Guide](getting-started/quickstart.md) — Build and launch Open Termkit from source.
- [Architecture Overview](getting-started/architecture.md) — Under the hood: PTY engine, WebSocket protocol, wterm, and SQLite.

### Step-by-Step Tutorials
1. [Tutorial 1: Multi-Tab Terminal Sessions](tutorials/01-multi-tab-terminals.md) — Multi-tab session management, background persistence, and controls.
2. [Tutorial 2: SSH Keys & Remote Host Management](tutorials/02-ssh-keys-and-remote-hosts.md) — Ed25519 key generation, latency ping testing, and 1-click remote connection.
3. [Tutorial 3: Setting Up AI Coding Agents](tutorials/03-ai-coding-agents.md) — Automatic detection, installation, and launch of Claude Code, Codex, OpenCode, and Pi.
4. [Tutorial 4: Persistent Workspaces with Tmux](tutorials/04-tmux-persistent-sessions.md) — Session recovery across browser reloads and network drops.
5. [Tutorial 5: Production Deployment & Remote Access](tutorials/05-production-deployment.md) — Native systemd, Docker, and Nginx/Caddy reverse proxy with TLS.
6. [Tutorial 6: Customizing Themes & Typography](tutorials/06-customizing-themes.md) — 12 handcrafted terminal color schemes, font scaling, and Geist design tokens.
7. [Tutorial 7: Backup, Export & Team Sync Bundles](tutorials/07-sync-bundles-and-backups.md) — Zero-leak configuration bundles and database migration.

### Reference & Operations
- [CLI Reference](reference/cli.md) — Complete command line guide (`serve`, `profile`, `ssh`, `tools`, `doctor`, `sync`).
- [REST & WebSocket API](reference/api.md) — HTTP API endpoints and WebSocket message schemas.
- [Systemd Deployment Plan](systemd-deployment-plan.md) — Production unit file specification and hardening.

---

## In-App Documentation

Open Termkit also includes an interactive, offline-ready Documentation and Tutorials browser built directly into the web application at `/docs`. Access it from the top navigation bar or via the Command Palette (`Cmd+K` -> "Go to Documentation").
