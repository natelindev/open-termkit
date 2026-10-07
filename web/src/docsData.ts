export type DocSection = {
  id: string;
  category: "Getting Started" | "Tutorials" | "Guides & Reference";
  title: string;
  summary: string;
  badge?: string;
  content: DocBlock[];
};

export type DocBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "code"; language: string; code: string; title?: string }
  | { type: "callout"; variant: "tip" | "note" | "warning"; title?: string; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

export const docsSections: DocSection[] = [
  {
    id: "introduction",
    category: "Getting Started",
    title: "Introduction to Open Termkit",
    summary: "Overview of Open Termkit, core philosophy, and architecture.",
    badge: "Overview",
    content: [
      {
        type: "paragraph",
        text: "Open Termkit is a production-grade, self-hosted local and web terminal environment built around wterm and Go. It combines local PTY-backed interactive shell sessions with an enterprise-ready management plane for terminal profiles, SSH connections, AI coding agents, and persistent tmux workspaces."
      },
      {
        type: "callout",
        variant: "tip",
        title: "Single Binary Architecture",
        text: "Open Termkit compiles into a single, self-contained Go binary with an embedded React frontend, requiring zero external runtime dependencies like Node or Python at runtime."
      },
      {
        type: "heading",
        level: 2,
        text: "Key Capabilities"
      },
      {
        type: "list",
        items: [
          "Multi-Tab Terminal Workspace: Concurrent PTY sessions with independent buffers, live ping telemetry, and output follow locking.",
          "SSH Host & Key Manager: Manage remote hosts, generate Ed25519 key pairs, test network latency, and launch 1-click SSH terminal sessions.",
          "AI Coding Agents Hub: Auto-detect, install, and launch CLI agents including Claude Code, Codex CLI, OpenCode, and Pi.",
          "Geist Design System: Precision-crafted UI adhering to Vercel Geist design tokens with native light and dark modes.",
          "Offline-First & Local-Safe: Configuration stored in SQLite; private keys never leave local filesystem permissions (0600).",
          "Production Deployment Ready: Native systemd scripts, Docker support with named volumes, and reverse-proxy WebSocket compatibility."
        ]
      },
      {
        type: "heading",
        level: 2,
        text: "System Architecture"
      },
      {
        type: "paragraph",
        text: "The backend server provides WebSocket endpoints connected directly to OS pseudo-terminals (PTYs) via creack/pty. Frontend rendering is handled by the high-performance wterm engine via @wterm/react and @wterm/dom."
      },
      {
        type: "code",
        language: "text",
        title: "Data Flow Diagram",
        code: `[Browser Client]
  └── React UI + wterm Virtual Terminal
        │
        ├── (HTTP REST API) ──> Go Router ──> SQLite DB (~/.open-termkit/open-termkit.db)
        │                                  ──> Managed SSH (~/.ssh/open-termkit/config)
        │
        └── (WebSocket /ws) ──> PTY WS Handler ──> creack/pty ──> Local Shell (zsh/bash/tmux)`
      }
    ]
  },
  {
    id: "quickstart",
    category: "Getting Started",
    title: "Quickstart Guide",
    summary: "Get Open Termkit up and running in under two minutes.",
    badge: "Start Here",
    content: [
      {
        type: "paragraph",
        text: "Follow these steps to launch Open Termkit on your local machine or remote server."
      },
      {
        type: "heading",
        level: 2,
        text: "1. Build and Run from Source"
      },
      {
        type: "paragraph",
        text: "Prerequisites: Go 1.22+ and Node.js 18+ (for frontend build). Once built, the binary requires no Node runtime."
      },
      {
        type: "code",
        language: "bash",
        title: "Terminal",
        code: `# Clone repository
git clone https://github.com/open-termkit/open-termkit.git
cd open-termkit

# Build embedded binary
make build

# Launch the service
./bin/open-termkit serve --port 8765`
      },
      {
        type: "paragraph",
        text: "Open your browser to http://127.0.0.1:8765. Your default local shell (Zsh or Bash) will be pre-configured."
      },
      {
        type: "heading",
        level: 2,
        text: "2. Quick CLI Setup"
      },
      {
        type: "paragraph",
        text: "Run the setup command to automatically detect installed shells, tmux, and developer utilities:"
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
        title: "Docker Alternative",
        text: "You can also run Open Termkit via Docker with pre-packaged OpenSSH: 'make docker-run' or 'docker run -p 8765:8765 -v open-termkit-data:/home/open-termkit/.open-termkit open-termkit:local'."
      }
    ]
  },
  {
    id: "tutorial-multi-tab",
    category: "Tutorials",
    title: "Tutorial 1: Multi-Tab Terminal Sessions",
    summary: "Master concurrent terminal sessions, tab lifecycle, and productivity controls.",
    badge: "Tutorial",
    content: [
      {
        type: "paragraph",
        text: "Open Termkit includes a multi-tab session manager that maintains background PTY processes while you switch tasks. Background tabs remain connected and continue receiving command output."
      },
      {
        type: "heading",
        level: 2,
        text: "Managing Tabs"
      },
      {
        type: "list",
        items: [
          "Create a Tab: Click the '+' button in the terminal header. To choose a specific profile, use the dropdown arrow next to '+'.",
          "Switch Tabs: Click any tab tab in the top tab bar. Background tabs preserve their full terminal state and scrollback.",
          "Rename a Tab: Double-click any tab title to edit it inline, or press Enter when focused to save.",
          "Close a Tab: Click the '×' button on the tab. The associated backend PTY session is terminated cleanly."
        ]
      },
      {
        type: "heading",
        level: 2,
        text: "Terminal Control Bar"
      },
      {
        type: "paragraph",
        text: "Each terminal tab has an interactive quick-action toolbar located on the right side of the frame:"
      },
      {
        type: "table",
        headers: ["Action", "Icon / Control", "Description"],
        rows: [
          ["Clear Screen", "Clear button", "Clears the terminal viewport buffer."],
          ["Restart Session", "Restart button", "Closes the current PTY connection and opens a fresh shell session."],
          ["Font Scaling", "A- / A+", "Adjusts terminal font size in real time (from 11px to 22px)."],
          ["Follow Output", "Lock / Down Arrow", "Toggles auto-scrolling to bottom when new command output arrives."],
          ["Zen Fullscreen", "Expand / Maximize", "Expands the terminal canvas to fill the entire window viewport."]
        ]
      },
      {
        type: "heading",
        level: 2,
        text: "Command Palette (Cmd+K / Ctrl+K)"
      },
      {
        type: "paragraph",
        text: "Press Cmd+K (macOS) or Ctrl+K (Linux/Windows) at any time to summon the Command Palette. You can jump directly to open tabs, launch tools, connect to SSH hosts, or toggle theme modes instantly."
      }
    ]
  },
  {
    id: "tutorial-ssh-management",
    category: "Tutorials",
    title: "Tutorial 2: SSH Keys & 1-Click Remote Connections",
    summary: "Generate Ed25519 keys, manage hosts, test latency, and connect instantly.",
    badge: "Tutorial",
    content: [
      {
        type: "paragraph",
        text: "Open Termkit provides an SSH profile manager that writes standard OpenSSH config files while offering a web-based connection workflow."
      },
      {
        type: "heading",
        level: 2,
        text: "Step 1: Generate an Ed25519 Key Pair"
      },
      {
        type: "paragraph",
        text: "Instead of manually creating keys in the terminal, you can generate modern Ed25519 keys directly in the SSH view:"
      },
      {
        type: "list",
        items: [
          "Navigate to the SSH view from the primary navigation.",
          "Click 'Generate Key Pair'.",
          "Provide a key name (e.g., 'id_ed25519_prod') and a comment identifier.",
          "Open Termkit securely generates the key pair in '~/.ssh/open-termkit/' with 0600 permissions.",
          "Copy the displayed public key to add to your remote server's '~/.ssh/authorized_keys'."
        ]
      },
      {
        type: "heading",
        level: 2,
        text: "Step 2: Add and Test Remote Hosts"
      },
      {
        type: "paragraph",
        text: "Fill in the SSH Profile form with Host, User, Port (default 22), Identity File, and optional ProxyJump jump host. Once saved:"
      },
      {
        type: "list",
        items: [
          "Click 'Test' on any profile card to verify network reachability. Open Termkit tests TCP connectivity and displays round-trip ping latency.",
          "Click 'Connect' to immediately spawn a new terminal tab running 'ssh <profile>'."
        ]
      },
      {
        type: "heading",
        level: 2,
        text: "Step 3: Writing Managed SSH Config"
      },
      {
        type: "paragraph",
        text: "Click 'Write Config' to generate '~/.ssh/open-termkit/config'. Enable the 'Include in ~/.ssh/config' checkbox to automatically add an 'Include ~/.ssh/open-termkit/config' line to your user's main SSH configuration."
      },
      {
        type: "code",
        language: "ssh-config",
        title: "~/.ssh/open-termkit/config",
        code: `# Managed by open-termkit. Edit profiles in open-termkit instead of this file.

Host prod-app
  HostName app.production.internal
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
    summary: "Integrate Claude Code, OpenAI Codex, OpenCode, and Pi in your terminal.",
    badge: "Tutorial",
    content: [
      {
        type: "paragraph",
        text: "Open Termkit is optimized for developers using autonomous AI coding agents. The Tools catalog automatically scans for installed CLI agents and provides 1-click installation and launch profiles."
      },
      {
        type: "heading",
        level: 2,
        text: "Supported Agents & Detection"
      },
      {
        type: "table",
        headers: ["Agent", "Binary", "Install Command", "Category"],
        rows: [
          ["Claude Code", "claude", "npm install -g @anthropic-ai/claude-code", "AI Agent"],
          ["Codex CLI", "codex", "npm install -g @openai/codex", "AI Agent"],
          ["OpenCode", "opencode", "npm install -g opencode-ai", "AI Agent"],
          ["Pi", "pi", "npm install -g @earendil-works/pi-coding-agent", "AI Agent"]
        ]
      },
      {
        type: "heading",
        level: 2,
        text: "Launching an Agent"
      },
      {
        type: "paragraph",
        text: "In the Tools view, click 'Launch' on any installed agent card. Open Termkit automatically creates a dedicated terminal profile and opens an interactive terminal session running the agent inside the wterm environment."
      },
      {
        type: "callout",
        variant: "tip",
        title: "Environment Variables for Agents",
        text: "To configure API keys (such as ANTHROPIC_API_KEY or OPENAI_API_KEY), navigate to the Profiles view, edit the agent profile, and add your keys in the Environment Variables section."
      }
    ]
  },
  {
    id: "tutorial-tmux-workspaces",
    category: "Tutorials",
    title: "Tutorial 4: Persistent Workspaces with Tmux",
    summary: "Keep processes running across browser reloads and network disconnects.",
    badge: "Tutorial",
    content: [
      {
        type: "paragraph",
        text: "While Open Termkit maintains WebSocket connections during normal tab navigation, running long tasks (like Docker builds, test suites, or training runs) is best handled by tmux. With tmux, even if your browser closes, your shell process continues running on the host."
      },
      {
        type: "heading",
        level: 2,
        text: "Configuring the Tmux Preset"
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
        text: "The '-A' flag instructs tmux to attach to the existing 'main' session if it already exists, or create it if it does not. This means every time you open this profile, you instantly resume your exact workspace."
      },
      {
        type: "heading",
        level: 2,
        text: "Essential Tmux Shortcuts"
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
    title: "Tutorial 5: Production Deployment & Reverse Proxy",
    summary: "Deploy Open Termkit natively with systemd, Docker, and Nginx/Caddy TLS.",
    badge: "Tutorial",
    content: [
      {
        type: "paragraph",
        text: "Learn how to deploy Open Termkit in production environments with persistent storage, non-root security isolation, and HTTPS reverse proxying."
      },
      {
        type: "heading",
        level: 2,
        text: "Option A: Native Systemd Deployment"
      },
      {
        type: "paragraph",
        text: "For native Linux hosts (Debian, Ubuntu, Arch, RHEL), use the deployment script to install the binary and systemd service:"
      },
      {
        type: "code",
        language: "bash",
        title: "Deploying via SSH",
        code: `# Deploy to remote Linux server as dedicated non-root user
scripts/deploy-systemd.sh user@your-server.com

# Inspect service status
ssh user@your-server.com "sudo systemctl status open-termkit"`
      },
      {
        type: "heading",
        level: 2,
        text: "Option B: Production Docker Deployment"
      },
      {
        type: "code",
        language: "bash",
        title: "Docker Run",
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
        text: "Reverse Proxy Configuration (Nginx)"
      },
      {
        type: "paragraph",
        text: "To safely expose Open Termkit behind HTTPS, configure WebSocket proxying in Nginx:"
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

        # WebSocket timeout
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}`
      },
      {
        type: "callout",
        variant: "warning",
        title: "Authentication Recommendation",
        text: "Always place Open Termkit behind an authenticated access layer such as Tailscale, Cloudflare Access, or HTTP Basic Auth when exposing it to public networks."
      }
    ]
  },
  {
    id: "tutorial-customization",
    category: "Tutorials",
    title: "Tutorial 6: Customizing Themes & Terminal Font",
    summary: "Configure 12 color schemes, custom fonts, and wterm settings.",
    badge: "Tutorial",
    content: [
      {
        type: "paragraph",
        text: "Open Termkit provides first-class terminal theming with 12 handcrafted color schemes optimized for readability in both light and dark ambient lighting."
      },
      {
        type: "heading",
        level: 2,
        text: "Available Terminal Schemes"
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
      },
      {
        type: "heading",
        level: 2,
        text: "Switching Schemes"
      },
      {
        type: "paragraph",
        text: "You can switch color schemes globally using the 'Scheme' dropdown in the top bar, or customize each profile independently in the Profiles view."
      }
    ]
  },
  {
    id: "tutorial-sync-bundle",
    category: "Tutorials",
    title: "Tutorial 7: Sync Bundles & Team Workflows",
    summary: "Export profiles, backup databases, and migrate to new machines.",
    badge: "Tutorial",
    content: [
      {
        type: "paragraph",
        text: "Open Termkit includes a zero-leak sync bundle mechanism. You can export all your terminal profiles, SSH host configurations, and settings to a JSON bundle to import on another machine."
      },
      {
        type: "heading",
        level: 2,
        text: "Private Key Safety Guarantee"
      },
      {
        type: "paragraph",
        text: "Sync bundles strictly export metadata and file paths; private key contents are never embedded into export bundles, ensuring credentials are never accidentally committed to git or exposed."
      },
      {
        type: "heading",
        level: 2,
        text: "Exporting and Importing via CLI"
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
    id: "cli-reference",
    category: "Guides & Reference",
    title: "CLI Command Reference",
    summary: "Complete reference for the open-termkit command line interface.",
    badge: "Reference",
    content: [
      {
        type: "paragraph",
        text: "The 'open-termkit' binary includes a rich command-line interface powered by Cobra."
      },
      {
        type: "table",
        headers: ["Command", "Flags", "Description"],
        rows: [
          ["open-termkit serve", "--host, --port", "Starts the web server, API, and WebSocket handler (default port 8765)."],
          ["open-termkit setup", "", "Runs automatic detection and creates preset terminal profiles."],
          ["open-termkit doctor", "", "Prints full system diagnostics, path statuses, and memory statistics."],
          ["open-termkit profile list", "", "Lists all terminal profiles stored in SQLite."],
          ["open-termkit profile create", "--name, --shell, --arg, --cwd, --theme", "Creates a new terminal profile."],
          ["open-termkit profile update <id>", "--name, --shell, --cwd, etc.", "Updates an existing terminal profile."],
          ["open-termkit profile delete <id>", "", "Deletes a terminal profile."],
          ["open-termkit ssh list", "", "Lists all configured SSH profiles."],
          ["open-termkit ssh create", "--host, --user, --port, --identity", "Adds a new SSH host entry."],
          ["open-termkit ssh write-config", "--include", "Generates managed SSH config snippet."],
          ["open-termkit tools list", "", "Lists catalog tools and their local detection status."],
          ["open-termkit tools install <name>", "--yes", "Installs a detected catalog tool."],
          ["open-termkit sync export", "--file", "Exports configuration bundle."],
          ["open-termkit sync import", "--file", "Imports configuration bundle."]
        ]
      }
    ]
  },
  {
    id: "api-reference",
    category: "Guides & Reference",
    title: "REST & WebSocket API Reference",
    summary: "Comprehensive endpoints and payload schema documentation.",
    badge: "Reference",
    content: [
      {
        type: "paragraph",
        text: "Open Termkit provides a clean JSON HTTP API and WebSocket protocol."
      },
      {
        type: "heading",
        level: 2,
        text: "HTTP Endpoints"
      },
      {
        type: "table",
        headers: ["Method", "Path", "Description"],
        rows: [
          ["GET", "/api/health", "Health check returning version and database path."],
          ["GET", "/api/doctor", "Comprehensive system diagnostics, memory, shells, and DB stats."],
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
      },
      {
        type: "heading",
        level: 2,
        text: "WebSocket Protocol (/api/terminals/ws)"
      },
      {
        type: "paragraph",
        text: "The WebSocket connection initiates a real-time PTY session. Query parameters: 'profile_id', 'cols' (default 80), 'rows' (default 24)."
      },
      {
        type: "code",
        language: "json",
        title: "Client -> Server Messages",
        code: `// Send keystroke / input data
{ "type": "input", "data": "ls -la\\n" }

// Window resize event
{ "type": "resize", "cols": 120, "rows": 36 }

// Heartbeat ping
{ "type": "ping", "data": "1719876543210" }`
      },
      {
        type: "code",
        language: "json",
        title: "Server -> Client Messages",
        code: `// Terminal output data
{ "type": "output", "data": "total 48\\ndrwxr-xr-x..." }

// Heartbeat pong
{ "type": "pong", "data": "1719876543210" }

// Process exit
{ "type": "exit", "code": 0 }

// Error notification
{ "type": "error", "error": "executable file not found in $PATH" }`
      }
    ]
  }
];
