# Quickstart Guide

This guide will walk you through building and running Open Termkit on your local machine or Linux server.

---

## 1. Prerequisites

- **Go 1.22+** (to compile the backend binary)
- **Node.js 18+ & npm** (only needed when compiling `web/dist`)
- **Git**

Once built, the resulting binary under `bin/open-termkit` is entirely standalone and does not require Node.js or any external web server at runtime.

---

## 2. Installation & Build

```bash
# Clone repository
git clone https://github.com/open-termkit/open-termkit.git
cd open-termkit

# Build both frontend assets and Go binary
make build
```

The build task performs the following:
1. Installs npm dependencies in `web/` and bundles static assets into `web/dist/`.
2. Compiles `cmd/open-termkit` with the embedded `web/dist` filesystem into `bin/open-termkit`.

---

## 3. Starting the Server

Start the local web UI and API server:

```bash
./bin/open-termkit serve --port 8765
```

Terminal output:
```text
open-termkit listening at http://127.0.0.1:8765
```

Open your browser to <http://127.0.0.1:8765>. Open Termkit automatically initializes your default shell (Zsh or Bash) and creates an initial SQLite database at `~/.open-termkit/open-termkit.db`.

---

## 4. Automatic System Setup

To automatically discover installed shells, tmux, and developer utilities, run:

```bash
./bin/open-termkit setup
```

Or click **"Run Setup"** in the Setup view in the web UI.

---

## 5. Running with Docker

If you prefer running Open Termkit inside a container with pre-configured OpenSSH and persistent volumes:

```bash
# Build Docker image
make docker-build

# Run container with named volumes
make docker-run
```

Access the app at <http://127.0.0.1:8765>.
