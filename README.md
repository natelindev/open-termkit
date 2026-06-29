# open-termkit

<p align="center">
  <img src="docs/images/open-termkit-logo.png" alt="open-termkit logo" width="96" />
</p>

`open-termkit` is a local terminal environment built around wterm. It ships as a single Go binary that serves a static web UI, opens local PTY-backed shell sessions, stores profiles in SQLite, and manages setup presets for shells, SSH, tmux, and coding agents.

## Keywords

Local terminal, web terminal, PTY shell, developer tools, local-first CLI, SSH profile manager, tmux setup, React terminal UI, Go web app, SQLite profiles, WebSocket terminal, light theme, dark theme.

## Screenshots

### Light theme

![open-termkit light theme](docs/images/open-termkit-light.png)

### Dark theme

![open-termkit dark theme](docs/images/open-termkit-dark.png)

## Current shape

- Go backend and CLI
- SQLite database at `~/.open-termkit/open-termkit.db`
- React + Vite frontend served by Go
- wterm terminal rendering in the browser
- Local PTY sessions over WebSocket
- Terminal profile CRUD
- SSH profile CRUD, key import, and config snippet generation
- Local sync export/import excluding private key contents
- Tool detection/install catalog for tmux, Codex CLI, Claude Code, opencode, and Pi

## Development

```sh
make dev-backend
make dev-frontend
```

The Vite dev server proxies API calls to `http://127.0.0.1:8765`.

## Build

```sh
make build
./bin/open-termkit serve
```

The frontend build output under `web/dist` is embedded into the Go binary at build time.
