export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string; id: string }
  | { type: "code"; language: string; code: string; title?: string }
  | { type: "callout"; variant: "tip" | "note" | "warning"; title?: string; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "component"; componentName: "ThemePlayground" | "ArchitectureDiagram" };

export type DocPage = {
  id: string;
  category: "Getting Started" | "Tutorials" | "Core Architecture" | "Deployment & Operations" | "Reference";
  title: string;
  summary: string;
  badge?: string;
  estimatedReadTime: string;
  blocks: ContentBlock[];
};

export const docPages: DocPage[] = [
  {
    id: "introduction",
    category: "Getting Started",
    title: "Introduction & Overview",
    summary: "Welcome to Open Termkit: a production-grade, self-hosted web terminal and developer control plane.",
    badge: "v1.0.0",
    estimatedReadTime: "3 min read",
    blocks: [
      {
        type: "paragraph",
        text: "Open Termkit is an enterprise-grade terminal environment built with Go, React 18, wterm, and SQLite. It packages real-time PTY allocation, multi-tab terminal management, an SSH connection plane, autonomous AI coding agent detection, and persistent tmux workspaces into a single, self-contained binary."
      },
      {
        type: "callout",
        variant: "tip",
        title: "Single Binary Philosophy",
        text: "Open Termkit compiles all backend logic, database migrations, and production web assets into one binary. There is zero runtime dependency on Node.js, Python, or external databases."
      },
      {
        type: "heading",
        level: 2,
        id: "core-pillars",
        text: "Core Architectural Pillars"
      },
      {
        type: "list",
        items: [
          "True PTY Virtual Terminal: Allocates native OS pseudo-terminals via creack/pty with GPU-accelerated canvas rendering via wterm.",
          "Multi-Tab Background Persistence: Open multiple concurrent sessions. Background tabs stay connected and keep running without dropping socket connections.",
          "Integrated SSH Manager: Natively generate Ed25519 keys, test TCP host latency, and launch 1-click interactive SSH terminal tabs.",
          "Autonomous Agent Hub: Auto-detect, install, and provision launch profiles for Claude Code, OpenAI Codex CLI, OpenCode, and Pi.",
          "Persistent Tmux Multiplexing: Built-in tmux presets prevent lost work when closing browser windows or encountering network disconnects.",
          "Geist Design System: Precision-crafted monochrome UI adhering to Vercel Geist design tokens with flawless dark/light mode support."
        ]
      },
      {
        type: "heading",
        level: 2,
        id: "architecture-summary",
        text: "High-Level Architecture"
      },
      {
        type: "paragraph",
        text: "The diagram below illustrates how client interactions flow between the React frontend, the Go HTTP router, SQLite storage, and OS pseudo-terminals:"
      },
      {
        type: "component",
        componentName: "ArchitectureDiagram"
      }
    ]
  },
  {
    id: "quickstart",
    category: "Getting Started",
    title: "Quickstart Guide",
    summary: "Get Open Termkit up and running in under two minutes from source or Docker.",
    badge: "Start Here",
    estimatedReadTime: "4 min read",
    blocks: [
      {
        type: "paragraph",
        text: "This guide covers launching Open Termkit locally or on a remote Linux server."
      },
      {
        type: "heading",
        level: 2,
        id: "prerequisites",
        text: "1. Prerequisites"
      },
      {
        type: "paragraph",
        text: "To build from source, ensure you have Go 1.22+ and Node.js 18+ installed on your system. Once compiled, the resulting binary is completely standalone."
      },
      {
        type: "heading",
        level: 2,
        id: "build-from-source",
        text: "2. Build & Launch"
      },
      {
        type: "code",
        language: "bash",
        title: "Terminal",
        code: `# Clone repository
git clone https://github.com/open-termkit/open-termkit.git
cd open-termkit

# Build both frontend assets and Go binary
make build

# Start Open Termkit server
./bin/open-termkit serve --port 8765`
      },
      {
        type: "paragraph",
        text: "Open your browser to http://127.0.0.1:8765. Your default login shell (Zsh or Bash) will be pre-configured."
      },
      {
        type: "heading",
        level: 2,
        id: "automated-setup",
        text: "3. Automated Tool & Preset Setup"
      },
      {
        type: "paragraph",
        text: "Run the CLI setup command to scan for installed shells, tmux, and developer utilities:"
      },
      {
        type: "code",
        language: "bash",
        title: "Terminal",
        code: `./bin/open-termkit setup`
      },
      {
        type: "callout",
        variant: "note",
        title: "Web Setup Dashboard",
        text: "You can also navigate to the 'Setup' view in the web UI and click 'Run Complete Setup' to view live execution logs and discovery diagnostics."
      }
    ]
  },
  {
    id: "tutorial-multi-tab",
    category: "Tutorials",
    title: "Tutorial 1: Multi-Tab Terminal Sessions",
    summary: "Master concurrent terminal sessions, background job persistence, and productivity controls.",
    badge: "Tutorial",
    estimatedReadTime: "5 min read",
    blocks: [
      {
        type: "paragraph",
        text: "Open Termkit provides a multi-tab terminal management engine that runs concurrent PTY sessions on the host while allowing instant tab switching without session interruption."
      },
      {
        type: "heading",
        level: 2,
        id: "tab-management",
        text: "1. Creating and Organizing Tabs"
      },
      {
        type: "list",
        items: [
          "New Tab: Click '+' in the top tab bar to spawn a new shell with your default profile.",
          "Profile Picker: Click the chevron arrow next to '+' to select a specific profile (such as Zsh, Bash, tmux, or an AI agent).",
          "Tab Switching: Click any tab tab. Background tabs preserve their active processes, terminal buffers, and running jobs.",
          "Inline Renaming: Double-click any tab title to edit its name inline, then press Enter to save.",
          "Tab Closing: Click '×' on any tab to disconnect its WebSocket and terminate the host PTY process cleanly."
        ]
      },
      {
        type: "heading",
        level: 2,
        id: "terminal-toolbar",
        text: "2. Real-Time Terminal Controls"
      },
      {
        type: "paragraph",
        text: "Each active tab includes a toolbar with real-time session controls:"
      },
      {
        type: "table",
        headers: ["Control", "Shortcut / Action", "Description"],
        rows: [
          ["Clear Screen", "Clear / Ctrl+L", "Sends form-feed escape sequence to clear terminal viewport."],
          ["Restart Session", "Restart", "Gracefully closes the WebSocket and spawns a fresh shell process."],
          ["Font Scaling", "A- / A+", "Dynamically adjusts terminal font size between 10px and 24px."],
          ["Output Follow", "Follow: On / Off", "Locks or unlocks auto-scrolling when new stdout arrives."],
          ["Zen Mode", "Fullscreen Toggle", "Expands terminal viewport to fill the entire window."]
        ]
      },
      {
        type: "heading",
        level: 2,
        id: "command-palette",
        text: "3. Keyboard Navigation with Command Palette"
      },
      {
        type: "paragraph",
        text: "Press Cmd+K (macOS) or Ctrl+K (Linux/Windows) anywhere in the application to summon the Command Palette. Quickly switch between open tabs, jump across views, connect to SSH hosts, or switch themes using arrow keys and Enter."
      }
    ]
  },
  {
    id: "tutorial-ssh",
    category: "Tutorials",
    title: "Tutorial 2: SSH Keys & Remote Host Management",
    summary: "Generate Ed25519 keys, manage remote hosts, test network latency, and connect in 1 click.",
    badge: "Tutorial",
    estimatedReadTime: "6 min read",
    blocks: [
      {
        type: "paragraph",
        text: "Open Termkit provides an SSH profile manager that writes standard OpenSSH configuration files while offering a web-based connection workflow."
      },
      {
        type: "heading",
        level: 2,
        id: "key-generation",
        text: "1. In-App Ed25519 Key Generation"
      },
      {
        type: "list",
        items: [
          "Open the SSH view from the primary navigation bar.",
          "Under the Authentication section, click 'Generate Key'.",
          "Specify a key name (e.g., id_ed25519_prod) and a comment identifier.",
          "Click 'Generate Key'. Open Termkit creates the key pair inside ~/.ssh/open-termkit/ with strict 0600 permissions.",
          "Click 'Copy' next to the public key to append it to your remote server's ~/.ssh/authorized_keys."
        ]
      },
      {
        type: "heading",
        level: 2,
        id: "host-profiles",
        text: "2. Adding and Testing Remote Hosts"
      },
      {
        type: "paragraph",
        text: "Configure host parameters including Name, Host, Port (default: 22), User, Identity File, and optional ProxyJump jump host. Once saved:"
      },
      {
        type: "list",
        items: [
          "Click 'Test' on any profile card to verify network reachability. Open Termkit initiates a TCP dial and displays round-trip ping latency in milliseconds.",
          "Click 'Connect' to immediately spawn a new terminal tab running 'ssh <profile>'."
        ]
      },
      {
        type: "heading",
        level: 2,
        id: "managed-config",
        text: "3. Writing Managed OpenSSH Config"
      },
      {
        type: "paragraph",
        text: "Click 'Write Config' to generate ~/.ssh/open-termkit/config. Enable the 'Include in ~/.ssh/config' option to automatically add an 'Include ~/.ssh/open-termkit/config' line to your user's main SSH configuration."
      },
      {
        type: "code",
        language: "ssh-config",
        title: "~/.ssh/open-termkit/config",
        code: `# Managed by open-termkit. Edit profiles in open-termkit instead of this file.

Host prod-api
  HostName api.production.internal
  User ubuntu
  Port 2222
  IdentityFile ~/.ssh/open-termkit/id_ed25519_prod
  IdentitiesOnly yes`
      }
    ]
  },
  {
    id: "tutorial-ai-agents",
    category: "Tutorials",
    title: "Tutorial 3: Setting Up AI Coding Agents",
    summary: "Integrate Claude Code, OpenAI Codex, OpenCode, and Pi in your terminal environment.",
    badge: "Tutorial",
    estimatedReadTime: "5 min read",
    blocks: [
      {
        type: "paragraph",
        text: "Open Termkit is optimized for developers using autonomous AI coding agents. The Tools catalog automatically detects installed CLI agents and provides 1-click installation and launch profiles."
      },
      {
        type: "heading",
        level: 2,
        id: "supported-agents",
        text: "1. Supported Agents & Detection"
      },
      {
        type: "table",
        headers: ["Agent", "Binary", "Description", "Installer"],
        rows: [
          ["Claude Code", "claude", "Anthropic's terminal agentic coding tool", "npm install -g @anthropic-ai/claude-code"],
          ["Codex CLI", "codex", "OpenAI's command-line coding agent", "npm install -g @openai/codex"],
          ["OpenCode", "opencode", "Open-source terminal AI coding assistant", "npm install -g opencode-ai"],
          ["Pi", "pi", "Minimalist AI pair-programming assistant", "npm install -g @earendil-works/pi-coding-agent"]
        ]
      },
      {
        type: "heading",
        level: 2,
        id: "install-modal",
        text: "2. Safe In-App Installation"
      },
      {
        type: "paragraph",
        text: "In the Tools view, click 'Install' on any uninstalled agent. A modal confirms the exact package manager command to execute. Once confirmed, an in-app log viewer shows the installation output in real time."
      },
      {
        type: "heading",
        level: 2,
        id: "agent-api-keys",
        text: "3. Configuring API Keys & Environments"
      },
      {
        type: "paragraph",
        text: "To supply API keys (e.g., ANTHROPIC_API_KEY or OPENAI_API_KEY), navigate to the Profiles view, edit the corresponding agent profile, and add your keys under the Environment Variables table."
      }
    ]
  },
  {
    id: "tutorial-tmux",
    category: "Tutorials",
    title: "Tutorial 4: Persistent Workspaces with Tmux",
    summary: "Keep processes running across browser reloads, laptop closures, and network drops.",
    badge: "Tutorial",
    estimatedReadTime: "4 min read",
    blocks: [
      {
        type: "paragraph",
        text: "While Open Termkit maintains WebSocket connections during normal tab navigation, running long tasks (like Docker builds, test suites, or training runs) is best handled by tmux. With tmux, even if your browser closes, your shell process continues running on the host."
      },
      {
        type: "heading",
        level: 2,
        id: "tmux-preset",
        text: "1. Built-in Tmux Preset"
      },
      {
        type: "paragraph",
        text: "Open Termkit ships with a built-in tmux preset profile that runs:"
      },
      {
        type: "code",
        language: "bash",
        title: "Preset Profile Command",
        code: `tmux new-session -A -s main`
      },
      {
        type: "paragraph",
        text: "The '-A' flag instructs tmux to attach to the existing 'main' session if it already exists, or create it if it does not. Every time you open this profile, you instantly resume your exact workspace."
      },
      {
        type: "heading",
        level: 2,
        id: "tmux-shortcuts",
        text: "2. Essential Shortcuts"
      },
      {
        type: "list",
        items: [
          "Prefix key: Ctrl+b",
          "Split horizontal: Ctrl+b %",
          "Split vertical: Ctrl+b \"",
          "Switch panes: Ctrl+b Arrow keys",
          "Detach session: Ctrl+b d"
        ]
      }
    ]
  },
  {
    id: "tutorial-production-deploy",
    category: "Tutorials",
    title: "Tutorial 5: Production Deployment & Remote Access",
    summary: "Deploy Open Termkit natively with systemd, Docker, and Nginx/Caddy TLS reverse proxying.",
    badge: "Tutorial",
    estimatedReadTime: "7 min read",
    blocks: [
      {
        type: "paragraph",
        text: "Learn how to deploy Open Termkit in production on a remote Linux server using native systemd or Docker, configuring HTTPS reverse proxying with Nginx or Caddy, and adding access control."
      },
      {
        type: "heading",
        level: 2,
        id: "systemd-deploy",
        text: "1. Native Systemd Deployment"
      },
      {
        type: "code",
        language: "bash",
        title: "Deploying via SSH Helper",
        code: `# Deploy to remote Linux server as dedicated non-root user
scripts/deploy-systemd.sh user@your-server.com

# Inspect service status
ssh user@your-server.com "sudo systemctl status open-termkit"`
      },
      {
        type: "heading",
        level: 2,
        id: "docker-deploy",
        text: "2. Production Docker Deployment"
      },
      {
        type: "code",
        language: "bash",
        title: "Docker Container Launch",
        code: `docker run -d --name open-termkit \\
  --restart unless-stopped \\
  -p 127.0.0.1:8765:8765 \\
  -v open-termkit-data:/home/open-termkit/.open-termkit \\
  -v open-termkit-ssh:/home/open-termkit/.ssh \\
  open-termkit:local`
      },
      {
        type: "heading",
        level: 2,
        id: "nginx-reverse-proxy",
        text: "3. Nginx Reverse Proxy with WebSocket Upgrade"
      },
      {
        type: "code",
        language: "nginx",
        title: "/etc/nginx/sites-available/termkit.conf",
        code: `server {
    listen 443 ssl http2;
    server_name term.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/term.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/term.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8765;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}`
      }
    ]
  },
  {
    id: "tutorial-customization",
    category: "Tutorials",
    title: "Tutorial 6: Customizing Themes & Typography",
    summary: "Explore 12 curated terminal color schemes, font scaling, and Geist design tokens.",
    badge: "Interactive",
    estimatedReadTime: "3 min read",
    blocks: [
      {
        type: "paragraph",
        text: "Open Termkit provides first-class terminal theming with 12 handcrafted color schemes optimized for readability in both light and dark ambient lighting."
      },
      {
        type: "heading",
        level: 2,
        id: "theme-simulator",
        text: "1. Interactive Color Scheme Simulator"
      },
      {
        type: "paragraph",
        text: "Try out each of the 12 color schemes in the live simulator below to preview terminal syntax highlighting and contrast:"
      },
      {
        type: "component",
        componentName: "ThemePlayground"
      },
      {
        type: "heading",
        level: 2,
        id: "scheme-list",
        text: "2. Color Scheme Catalog"
      },
      {
        type: "list",
        items: [
          "Monokai (Default high-contrast developer theme)",
          "Tokyo Night (Cool midnight indigo palette)",
          "Catppuccin Mocha (Soothing pastel dark aesthetic)",
          "Dracula (Vibrant cyberpunk gothic palette)",
          "Nord (Arctic blue minimalist tones)",
          "Gruvbox Dark (Warm retro earth tones)",
          "One Dark (Atom editor inspired balanced palette)",
          "GitHub Dark (Clean low-saturation chrome)",
          "Rose Pine (Rosy muted aesthetic)",
          "Solarized Dark & Solarized Light",
          "Light (High-contrast paper reading scheme)"
        ]
      }
    ]
  },
  {
    id: "tutorial-sync-bundle",
    category: "Tutorials",
    title: "Tutorial 7: Backup, Export & Team Sync Bundles",
    summary: "Export profiles, backup databases, and migrate to new machines without leaking private keys.",
    badge: "Tutorial",
    estimatedReadTime: "4 min read",
    blocks: [
      {
        type: "paragraph",
        text: "Open Termkit includes a zero-leak sync bundle mechanism. You can export all your terminal profiles, SSH host configurations, and settings to a JSON bundle to import on another machine."
      },
      {
        type: "heading",
        level: 2,
        id: "private-key-safety",
        text: "1. Zero-Leak Security Guarantee"
      },
      {
        type: "paragraph",
        text: "Sync bundles strictly export metadata and file paths; private key contents are never embedded into export bundles, ensuring credentials are never accidentally committed to git or exposed."
      },
      {
        type: "heading",
        level: 2,
        id: "cli-export-import",
        text: "2. Exporting and Importing via CLI"
      },
      {
        type: "code",
        language: "bash",
        title: "Terminal",
        code: `# Export bundle to file
open-termkit sync export --file my-termkit-backup.json

# Import bundle on a new workstation
open-termkit sync import --file my-termkit-backup.json`
      }
    ]
  },
  {
    id: "architecture-deep-dive",
    category: "Core Architecture",
    title: "Architecture Deep Dive",
    summary: "Detailed look at the PTY engine, WebSocket protocol, wterm, and SQLite schema.",
    badge: "Deep Dive",
    estimatedReadTime: "6 min read",
    blocks: [
      {
        type: "paragraph",
        text: "This document explores the technical design decisions behind Open Termkit's high-performance terminal streaming and state management."
      },
      {
        type: "heading",
        level: 2,
        id: "pty-allocation",
        text: "1. Unix PTY Allocation"
      },
      {
        type: "paragraph",
        text: "Using creack/pty, the backend opens master and slave pseudo-terminal file descriptors. The child shell process is executed with standard file descriptors pointing to the slave device, and TERM environment variables set to xterm-256color and truecolor."
      },
      {
        type: "heading",
        level: 2,
        id: "websocket-protocol",
        text: "2. WebSocket Message Framing"
      },
      {
        type: "paragraph",
        text: "Communication over /api/terminals/ws uses JSON-framed events for input, resize, ping/pong, and process exit codes, enabling sub-millisecond responsiveness."
      },
      {
        type: "heading",
        level: 2,
        id: "sqlite-schema",
        text: "3. SQLite Database Schema"
      },
      {
        type: "paragraph",
        text: "State is maintained in tables for terminal_profiles, ssh_profiles, tools, settings, and setup_state with PRAGMA foreign_keys = ON and single-connection safety."
      }
    ]
  },
  {
    id: "cli-reference",
    category: "Reference",
    title: "CLI Command Reference",
    summary: "Complete command-line interface documentation and flags.",
    badge: "Reference",
    estimatedReadTime: "5 min read",
    blocks: [
      {
        type: "paragraph",
        text: "The open-termkit binary includes a complete command-line interface powered by Cobra."
      },
      {
        type: "table",
        headers: ["Command", "Arguments / Flags", "Description"],
        rows: [
          ["open-termkit serve", "--host, --port", "Starts web UI and API server (default port 8765)."],
          ["open-termkit setup", "", "Runs automatic tool detection and provisions preset profiles."],
          ["open-termkit doctor", "", "Prints full system telemetry, storage paths, and diagnostics."],
          ["open-termkit profile list", "", "Lists all terminal profiles stored in SQLite."],
          ["open-termkit profile create", "--name, --shell, --arg, --cwd, --theme", "Creates a terminal profile."],
          ["open-termkit profile update <id>", "--name, --shell, etc.", "Updates an existing terminal profile."],
          ["open-termkit profile delete <id>", "", "Deletes a terminal profile."],
          ["open-termkit ssh list", "", "Lists all configured SSH host profiles."],
          ["open-termkit ssh create", "--name, --host, --user, --port", "Adds a new SSH host entry."],
          ["open-termkit ssh write-config", "--include", "Generates managed OpenSSH config snippet."],
          ["open-termkit tools list", "", "Lists catalog tools and local installation status."],
          ["open-termkit tools install <name>", "--yes", "Installs a catalog tool via local package manager."],
          ["open-termkit sync export", "--file", "Exports configuration bundle to JSON."],
          ["open-termkit sync import", "--file", "Imports configuration bundle from JSON."]
        ]
      }
    ]
  },
  {
    id: "api-reference",
    category: "Reference",
    title: "REST & WebSocket API Reference",
    summary: "HTTP REST API schemas, headers, status codes, and WebSocket protocol.",
    badge: "Reference",
    estimatedReadTime: "6 min read",
    blocks: [
      {
        type: "paragraph",
        text: "Open Termkit provides a clean JSON HTTP API and real-time WebSocket protocol."
      },
      {
        type: "heading",
        level: 2,
        id: "api-endpoints-table",
        text: "API Endpoints Summary"
      },
      {
        type: "table",
        headers: ["Method", "Path", "Description"],
        rows: [
          ["GET", "/api/health", "Health check returning version and DB path."],
          ["GET", "/api/doctor", "System diagnostics, memory, shells, and DB stats."],
          ["GET", "/api/settings", "Returns application paths and configuration."],
          ["GET / POST", "/api/profiles", "List terminal profiles or create a new profile."],
          ["GET / PUT / DELETE", "/api/profiles/{id}", "Manage individual terminal profile."],
          ["GET / POST", "/api/ssh", "List SSH profiles or create a new host."],
          ["GET / PUT / DELETE", "/api/ssh/{id}", "Manage individual SSH profile."],
          ["POST", "/api/ssh/test", "Test TCP network connectivity and latency to remote host."],
          ["POST", "/api/ssh/{id}/test", "Test connection to a saved SSH profile."],
          ["POST", "/api/ssh/generate-key", "Generate a new Ed25519 key pair with comment."],
          ["POST", "/api/ssh/import-key", "Upload and import a private key into ~/.ssh/open-termkit."],
          ["POST", "/api/ssh/write-config", "Write ~/.ssh/open-termkit/config snippet."],
          ["GET", "/api/tools", "List tool catalog with installation detection."],
          ["POST", "/api/tools/{name}/install", "Execute package manager installer for a tool."],
          ["GET / POST", "/api/setup/run", "Run automated system setup and preset provisioning."],
          ["GET", "/api/sync/export", "Download sync bundle as JSON file attachment."],
          ["POST", "/api/sync/import", "Upload and merge sync bundle JSON."]
        ]
      }
    ]
  }
];
