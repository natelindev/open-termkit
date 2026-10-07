# Architecture Overview

Open Termkit is engineered as a modern, self-hosted web terminal and developer control plane. This document explains the internal subsystems, communication protocols, and design principles.

---

## 1. High-Level Architecture

Open Termkit uses a decoupled, local-first architecture:

```text
[ Browser Client ]
  │
  ├── React 18 UI (Vercel Geist Design System)
  ├── wterm Canvas Virtual Terminal Engine
  │
  ├── (HTTP REST API) ──> Go Standard Library http.ServeMux
  │                          │
  │                          ├── SQLite Storage (~/.open-termkit/open-termkit.db)
  │                          └── SSH Config Engine (~/.ssh/open-termkit/config)
  │
  └── (WebSocket /ws) ──> PTY WebSocket Handler (Gorilla WebSocket)
                             │
                             └── creack/pty ──> Host PTY ──> Local Process (zsh/bash/tmux/agent)
```

---

## 2. Subsystems

### Backend Server (`internal/server`)
- Written in pure Go with minimal dependencies.
- Embeds the React application via `io/fs` and Go's `//go:embed`.
- Provides RESTful JSON API endpoints for terminal profiles, SSH hosts, catalog tools, system diagnostics, and sync bundles.
- Employs structured request logging and panic recovery middleware with standard `X-Content-Type-Options: nosniff` headers.

### PTY & WebSocket Engine (`internal/ptyws`)
- Uses `github.com/creack/pty` to allocate true Unix pseudo-terminals on macOS and Linux.
- Establishes a bidirectional WebSocket channel (`/api/terminals/ws`) with binary/JSON message frames.
- Supports dynamic window resizing (`SIGWINCH`), heartbeat pings with sub-millisecond round-trip time calculation, and graceful process exit handling.

### Storage Engine (`internal/store`)
- Backed by SQLite via `modernc.org/sqlite` (pure Go SQLite implementation without CGO).
- Auto-migrates database schema on boot.
- Stores profiles, tool detection records, settings, and setup state.
- Ensures a valid default shell profile is always available.

### SSH Manager (`internal/sshconfig`)
- Manages SSH host definitions, ports, identity files, and jump hosts.
- Natively generates Ed25519 key pairs using `ssh-keygen`.
- Enforces strict Unix file permissions (`0600`) on all private keys and config snippets.
- Writes a dedicated snippet to `~/.ssh/open-termkit/config` and safely manages the `Include` directive in `~/.ssh/config`.

### Frontend Engine (`web/`)
- Built with React 18, TypeScript, and Vite.
- Implements the Vercel-inspired Geist design system (`design.md`) with CSS custom properties for instant dark and light mode switching.
- Uses `@wterm/react` and `@wterm/dom` for GPU-accelerated terminal emulation with truecolor support.
- Multi-Tab Session Manager preserves background WebSocket connections and shell state while switching tabs.
- Includes a global Command Palette (`Cmd+K` / `Ctrl+K`) for keyboard-driven navigation.
