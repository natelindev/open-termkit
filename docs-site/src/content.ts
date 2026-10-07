export type Locale = "en" | "zh";

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "image"; src: string; alt: string; caption: string }
  | { type: "heading"; level: 2 | 3; text: string; id: string }
  | { type: "code"; language: string; code: string; title?: string }
  | { type: "callout"; variant: "tip" | "note" | "warning"; title?: string; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "component"; componentName: "ThemePlayground" | "ArchitectureDiagram" };

export type DocPage = {
  id: string;
  category: string;
  title: string;
  navTitle?: string;
  summary: string;
  badge?: string;
  estimatedReadTime: string;
  blocks: ContentBlock[];
};

export const docPagesEn: DocPage[] = [
  {
    id: "introduction",
    category: "Getting Started",
    title: "Introduction & Overview",
    navTitle: "Introduction & Overview",
    summary: "Welcome to Open Termkit: a self-hosted web terminal and developer control plane.",
    estimatedReadTime: "3 min read",
    blocks: [
      { type: "image", src: "./screenshots/open-termkit-dark.png", alt: "Open Termkit running an isolated sample shell in dark mode", caption: "The running application, using an isolated sample terminal." },
      {
        type: "paragraph",
        text: "Open Termkit is a self-hosted terminal environment built with Go, React 18, wterm, and SQLite. It packages real-time PTY allocation, multi-tab terminal management, an SSH connection plane, autonomous AI coding agent detection, and persistent tmux workspaces into a single, self-contained binary."
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
          "Geist Design System: Monochrome UI with persistent light and dark themes."
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
    navTitle: "Quickstart Guide",
    summary: "Build Open Termkit from source and launch your first local terminal.",
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
        text: "To build from source, ensure you have Go 1.26+ and Node.js 22+ installed on your system. Once compiled, the resulting binary is completely standalone."
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
git clone https://github.com/natelindev/open-termkit.git
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
        text: "3. Automated Setup Command"
      },
      {
        type: "paragraph",
        text: "Run the CLI setup command to inspect your environment, scan for installed CLI tools and agents, and initialize default launch profiles in SQLite:"
      },
      {
        type: "code",
        language: "bash",
        title: "Terminal",
        code: `./bin/open-termkit setup`
      }
    ]
  },
  {
    id: "tutorial-multi-tab",
    category: "Tutorials",
    title: "Tutorial 1: Multi-Tab Terminal Sessions",
    navTitle: "1. Multi-Tab Terminals",
    summary: "Master concurrent terminal sessions, background job persistence, and productivity controls.",
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
    navTitle: "2. SSH Keys & Remote Hosts",
    summary: "Generate Ed25519 keys, manage remote hosts, test network latency, and connect in 1 click.",
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
    navTitle: "3. AI Coding Assistants",
    summary: "Integrate Claude Code, OpenAI Codex, OpenCode, and Pi in your terminal environment.",
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
    navTitle: "4. Persistent Sessions (tmux)",
    summary: "Keep processes running across browser reloads, laptop closures, and network drops.",
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
    navTitle: "5. Production Deployment",
    summary: "Run the terminal backend on Linux or Docker behind authenticated access. Host documentation separately.",
    estimatedReadTime: "7 min read",
    blocks: [
      {
        type: "paragraph",
        text: "Learn how to deploy Open Termkit in production on a remote Linux server using native systemd or Docker, and protect remote access with an authenticated proxy. Cloudflare Pages hosts only the documentation; it cannot run the Go PTY backend."
      },
      { type: "callout", variant: "warning", title: "Remote access boundary", text: "Open Termkit has no built-in login or authorization, and currently accepts WebSocket connections from any origin. Keep the backend on loopback. Remote use requires authentication for every HTTP and WebSocket route, TLS, and origin restrictions at the proxy. Run under a dedicated user; terminal sessions inherit that user's permissions. The example proxy below requires your authentication layer before use." },
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
    navTitle: "6. Customizing Themes",
    summary: "Explore 12 curated terminal color schemes, font scaling, and Geist design tokens.",
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
    navTitle: "7. Backup & Sync Bundles",
    summary: "Export profiles, backup databases, and migrate to new machines without leaking private keys.",
    estimatedReadTime: "4 min read",
    blocks: [
      {
        type: "paragraph",
        text: "Open Termkit includes a key-safe sync bundle mechanism. You can export all your terminal profiles, SSH host configurations, and settings to a JSON bundle to import on another machine."
      },
      {
        type: "heading",
        level: 2,
        id: "private-key-safety",
        text: "1. Key-Safe Security Guarantee"
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
    navTitle: "Architecture Deep Dive",
    summary: "Detailed look at the PTY engine, WebSocket protocol, wterm, and SQLite schema.",
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
    navTitle: "CLI Reference",
    summary: "Complete command-line interface documentation and flags.",
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
    navTitle: "REST & WebSocket API",
    summary: "HTTP REST API schemas, headers, status codes, and WebSocket protocol.",
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

export const docPagesZh: DocPage[] = [
  {
    id: "introduction",
    category: "快速入门",
    title: "介绍与概述",
    navTitle: "介绍与概述",
    summary: "欢迎使用 Open Termkit：自托管 Web 终端与开发者工作台。",
    estimatedReadTime: "约 3 分钟阅读",
    blocks: [
      { type: "image", src: "./screenshots/open-termkit-dark.png", alt: "Open Termkit running an isolated sample shell in dark mode", caption: "\u8fd0\u884c\u4e2d\u7684\u5e94\u7528\uff0c\u4f7f\u7528\u9694\u79bb\u7684\u793a\u4f8b\u7ec8\u7aef\u3002" },
      {
        type: "paragraph",
        text: "Open Termkit 是一款采用 Go、React 18、wterm 与 SQLite 构建的自托管终端控制台。它将实时系统 PTY 虚拟终端分配、多标签终端管理、SSH 密钥与远程连接平面、自主 AI 编程 Agent 检测以及 tmux 持久化会话打包进单个独立可执行二进制文件中。"
      },
      {
        type: "callout",
        variant: "tip",
        title: "单一二进制文件架构理念",
        text: "Open Termkit 将所有后端逻辑、数据库迁移脚本与生产级 Web 前端资源完全编译打包进单个可执行文件。在生产部署与运行环境中，完全不需要依赖 Node.js、Python 或外部数据库。"
      },
      {
        type: "heading",
        level: 2,
        id: "core-pillars",
        text: "核心架构支柱"
      },
      {
        type: "list",
        items: [
          "原生 PTY 虚拟终端：通过 creack/pty 在操作系统层分配原生伪终端，配合 wterm 实现 GPU 加速的 Canvas 高性能渲染。",
          "多标签后台进程保活：支持同时开启多个独立终端会话。切换标签页时后台会话不断连，长时间任务持续稳定运行。",
          "集成化 SSH 连接管理器：原生生成 Ed25519 密钥对，毫秒级 TCP 连通性测试，支持一键在终端标签中启动 SSH 会话。",
          "AI Agent 工具生态中心：自动检测、一键安装并预置 Claude Code、OpenAI Codex CLI、OpenCode 与 Pi 编程助手环境配置。",
          "内置 Tmux 持久化会话：内置 tmux 预设配置，关闭浏览器窗口或断网重连后无缝恢复工作区。",
          "Geist 现代设计系统：遵循精密黑白灰极简美学，深度支持深色/浅色主题自由切换。"
        ]
      },
      {
        type: "heading",
        level: 2,
        id: "architecture-summary",
        text: "系统总体架构"
      },
      {
        type: "paragraph",
        text: "下图展示了 React 前端客户端、Go HTTP 路由器、SQLite 本地持久化与宿主机操作系统 PTY 伪终端之间的数据流向："
      },
      {
        type: "component",
        componentName: "ArchitectureDiagram"
      }
    ]
  },
  {
    id: "quickstart",
    category: "快速入门",
    title: "快速入门指南",
    navTitle: "快速入门指南",
    summary: "两分钟内完成从源码构建或 Docker 启动 Open Termkit。",
    estimatedReadTime: "约 4 分钟阅读",
    blocks: [
      {
        type: "paragraph",
        text: "本指南将带您在本地计算机或远程 Linux 服务器上快速编译并运行 Open Termkit。"
      },
      {
        type: "heading",
        level: 2,
        id: "prerequisites",
        text: "1. 环境依赖"
      },
      {
        type: "paragraph",
        text: "从源码编译仅需系统安装 Go 1.26+ 与 Node.js 22+（仅编译阶段需要）。编译完成后生成的二进制文件完全自包含，无任何外部依赖。"
      },
      {
        type: "heading",
        level: 2,
        id: "build-from-source",
        text: "2. 编译与运行"
      },
      {
        type: "code",
        language: "bash",
        title: "Terminal",
        code: `# 克隆代码仓库
git clone https://github.com/natelindev/open-termkit.git
cd open-termkit

# 编译前端静态资源并生成 Go 二进制文件
make build

# 启动 Open Termkit 服务
./bin/open-termkit serve --port 8765`
      },
      {
        type: "paragraph",
        text: "在浏览器中访问 http://127.0.0.1:8765。Open Termkit 会自动检测并初始化您的默认登录 Shell（Zsh 或 Bash）。"
      },
      {
        type: "heading",
        level: 2,
        id: "automated-setup",
        text: "3. 一键初始化环境命令"
      },
      {
        type: "paragraph",
        text: "运行 CLI setup 命令以扫描当前系统的开发工具和 AI Agent，并在本地 SQLite 中自动建立预置配置："
      },
      {
        type: "code",
        language: "bash",
        title: "Terminal",
        code: `./bin/open-termkit setup`
      }
    ]
  },
  {
    id: "tutorial-multi-tab",
    category: "详细教程",
    title: "教程 1：多标签终端会话管理",
    navTitle: "1. 多标签终端",
    summary: "掌握多终端会话并行、后台任务保活与实时交互控制。",
    estimatedReadTime: "约 5 分钟阅读",
    blocks: [
      {
        type: "paragraph",
        text: "Open Termkit 拥有多标签终端调度引擎，可以在宿主机上同时运行多个并发 PTY 进程，同时实现零延迟标签切换且不中断连接。"
      },
      {
        type: "heading",
        level: 2,
        id: "tab-management",
        text: "1. 创建与管理标签页"
      },
      {
        type: "list",
        items: [
          "新建标签页：点击顶部标签栏中的 '+' 按钮，以默认配置启动新的 Shell 会话。",
          "选择预设配置：点击 '+' 旁的下拉箭头，快速选择特定配置（如 Zsh、Bash、tmux 或 AI Agent）。",
          "平滑切换标签：点击任意标签页进行切换。后台标签页完整保持其运行中的任务、终端输出缓冲区与子进程。",
          "行内重命名：双击任意标签页标题即可直接编辑名称，按下 Enter 键保存。",
          "关闭标签页：点击标签右侧的 '×' 按钮，正常断开 WebSocket 并安全终止对应的宿主机 PTY 进程。"
        ]
      },
      {
        type: "heading",
        level: 2,
        id: "terminal-toolbar",
        text: "2. 实时终端控制栏"
      },
      {
        type: "paragraph",
        text: "每个活动终端顶部都配有实用的快捷控制栏："
      },
      {
        type: "table",
        headers: ["控制项", "快捷键 / 操作", "功能说明"],
        rows: [
          ["清空屏幕", "Clear / Ctrl+L", "发送换页符转义序列以清空当前终端视口。"],
          ["重启会话", "Restart", "安全关闭现有 WebSocket 并立即启动全新的 Shell 进程。"],
          ["字号缩放", "A- / A+", "在 10px 至 24px 之间动态缩放终端文字大小。"],
          ["跟随输出", "Follow: 开 / 关", "锁定或解锁随终端标准输出到达时自动滚屏到底部。"],
          ["Zen 专注模式", "全屏切换", "将终端视图无缝扩展至整个浏览器视口。"]
        ]
      },
      {
        type: "heading",
        level: 2,
        id: "command-palette",
        text: "3. 键盘驱动：Cmd+K 命令面板"
      },
      {
        type: "paragraph",
        text: "在应用中随时按下 Cmd+K（macOS）或 Ctrl+K（Linux/Windows）即可唤出全局命令面板。通过键盘上下键和回车键，快速跳转标签页、切换视图、一键连接 SSH 主机或切换界面主题。"
      }
    ]
  },
  {
    id: "tutorial-ssh",
    category: "详细教程",
    title: "教程 2：SSH 密钥管理与远程主机连接",
    navTitle: "2. SSH 密钥与远程主机",
    summary: "生成 Ed25519 密钥、管理远程主机、实时测试网络延迟并一键连入。",
    estimatedReadTime: "约 6 分钟阅读",
    blocks: [
      {
        type: "paragraph",
        text: "Open Termkit 提供了专业级 SSH 配置管理器，在兼容标准 OpenSSH 文件的同时，提供了现代化 Web 连接体验。"
      },
      {
        type: "heading",
        level: 2,
        id: "key-generation",
        text: "1. 界面内直接生成 Ed25519 密钥"
      },
      {
        type: "list",
        items: [
          "在主导航栏中进入 SSH 视图。",
          "在“认证密钥”区域点击“生成密钥对”。",
          "输入密钥名称（例如 id_ed25519_prod）和备注信息。",
          "点击“生成密钥”。Open Termkit 会在 ~/.ssh/open-termkit/ 目录下安全创建密钥对，并赋予严格的 0600 文件权限。",
          "点击公钥旁边的“复制”按钮，将其添加到目标服务器的 ~/.ssh/authorized_keys 文件中。"
        ]
      },
      {
        type: "heading",
        level: 2,
        id: "host-profiles",
        text: "2. 添加与连通性测试远程主机"
      },
      {
        type: "paragraph",
        text: "配置远程主机参数，包括名称、主机地址、端口（默认 22）、用户名、指定私钥路径以及可选的 ProxyJump 跳板机。保存后："
      },
      {
        type: "list",
        items: [
          "点击卡片上的“测试”按钮：Open Termkit 会发起 TCP 探测并实时显示往返 ping 延迟（毫秒）。",
          "点击“连接”按钮：立即在终端区域新建一个标签页并自动执行 'ssh <profile>'。"
        ]
      },
      {
        type: "heading",
        level: 2,
        id: "managed-config",
        text: "3. 生成托管 OpenSSH 配置文件"
      },
      {
        type: "paragraph",
        text: "点击“写入配置”即可自动生成 ~/.ssh/open-termkit/config。开启“包含到 ~/.ssh/config”选项后，会自动将 'Include ~/.ssh/open-termkit/config' 写入用户全局 SSH 配置中。"
      },
      {
        type: "code",
        language: "ssh-config",
        title: "~/.ssh/open-termkit/config",
        code: `# 由 Open Termkit 托管生成，请在界面中修改配置

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
    category: "详细教程",
    title: "教程 3：配置 AI 编程助手环境",
    navTitle: "3. AI 编程助手环境",
    summary: "在终端环境中集成 Claude Code、OpenAI Codex、OpenCode 与 Pi。",
    estimatedReadTime: "约 5 分钟阅读",
    blocks: [
      {
        type: "paragraph",
        text: "Open Termkit 为 AI 辅助编程打造了原生集成体验。工具中心会自动检测系统中已安装的命令行 AI 编程 Agent，并支持一键安装和创建运行配置。"
      },
      {
        type: "heading",
        level: 2,
        id: "supported-agents",
        text: "1. 支持的 Agent 列表与自动检测"
      },
      {
        type: "table",
        headers: ["编程助手", "命令行命令", "功能说明", "安装命令"],
        rows: [
          ["Claude Code", "claude", "Anthropic 官方终端自主编程工具", "npm install -g @anthropic-ai/claude-code"],
          ["Codex CLI", "codex", "OpenAI 命令行交互式编程助手", "npm install -g @openai/codex"],
          ["OpenCode", "opencode", "开源命令行终端 AI 编程协作套件", "npm install -g opencode-ai"],
          ["Pi", "pi", "极简终端 AI 结对编程助手", "npm install -g @earendil-works/pi-coding-agent"]
        ]
      },
      {
        type: "heading",
        level: 2,
        id: "install-modal",
        text: "2. 安全可视化一键安装"
      },
      {
        type: "paragraph",
        text: "在“工具”视图中，点击未安装 Agent 卡片上的“安装”按钮。系统会弹出确认弹窗展示即将执行的包管理命令。确认后，弹窗内会实时流式输出安装日志。"
      },
      {
        type: "heading",
        level: 2,
        id: "agent-api-keys",
        text: "3. 配置 API 密钥与环境变量"
      },
      {
        type: "paragraph",
        text: "若需要配置 API 密钥（如 ANTHROPIC_API_KEY 或 OPENAI_API_KEY），只需进入“配置”视图，编辑对应的终端配置项，在环境变量表中填入密钥即可。"
      }
    ]
  },
  {
    id: "tutorial-tmux",
    category: "详细教程",
    title: "教程 4：使用 Tmux 保持会话常驻",
    navTitle: "4. 持久会话 (tmux)",
    summary: "让长时间编译、训练或部署任务在断网和关闭浏览器后持续运行。",
    estimatedReadTime: "约 4 分钟阅读",
    blocks: [
      {
        type: "paragraph",
        text: "虽然 Open Termkit 在正常切换标签时保持 WebSocket 连接，但对于耗时极长的任务（如大型项目构建、测试套件运行或长时间训练），推荐结合 tmux 使用。即使关闭网页或网络中断，后台任务依然在宿主机上持续运行。"
      },
      {
        type: "heading",
        level: 2,
        id: "tmux-preset",
        text: "1. 内置 Tmux 预设配置"
      },
      {
        type: "paragraph",
        text: "Open Termkit 内置了开箱即用的 tmux 预设，其执行命令如下："
      },
      {
        type: "code",
        language: "bash",
        title: "预设执行命令",
        code: `tmux new-session -A -s main`
      },
      {
        type: "paragraph",
        text: "其中的 '-A' 参数指示 tmux：若名为 'main' 的会话已存在则直接接入（attach），若不存在则自动新建。每次打开此配置，都能瞬间回到原有的工作现场。"
      },
      {
        type: "heading",
        level: 2,
        id: "tmux-shortcuts",
        text: "2. 常用操作快捷键"
      },
      {
        type: "list",
        items: [
          "前缀引导键：Ctrl+b",
          "水平分割窗格：Ctrl+b %",
          "垂直分割窗格：Ctrl+b \"",
          "窗格间移动：Ctrl+b 方向键",
          "脱离当前会话（保持后台）：Ctrl+b d"
        ]
      }
    ]
  },
  {
    id: "tutorial-production-deploy",
    category: "详细教程",
    title: "教程 5：生产级部署指南",
    navTitle: "5. 生产级部署",
    summary: "通过 systemd 或 Docker 运行终端后端，使用 Cloudflare Pages 托管独立文档。",
    estimatedReadTime: "约 7 分钟阅读",
    blocks: [
      {
        type: "paragraph",
        text: "了解如何在远程 Linux 服务器上使用原生 systemd 或 Docker 部署 Open Termkit，并通过 Nginx 配置 HTTPS 反向代理与 WebSocket 升级。"
      },
      { type: "callout", variant: "warning", title: "远程访问边界", text: "当前服务没有内置登录或授权，WebSocket 接受任意来源连接。后端应监听回环地址；远程访问需要代理对所有 HTTP 和 WebSocket 路由进行身份认证、TLS 加密和来源限制。使用专用非 root 用户运行，终端继承服务用户的权限。下方代理示例需要先配置认证层。Cloudflare Pages 只能托管文档，不能运行 Go PTY 后端。" },
      {
        type: "heading",
        level: 2,
        id: "systemd-deploy",
        text: "1. Linux 原生 systemd 部署"
      },
      {
        type: "code",
        language: "bash",
        title: "通过一键脚本部署",
        code: `# 通过 SSH 将服务部署到 Linux 目标机器
scripts/deploy-systemd.sh user@your-server.com

# 检查远程服务运行状态
ssh user@your-server.com "sudo systemctl status open-termkit"`
      },
      {
        type: "heading",
        level: 2,
        id: "docker-deploy",
        text: "2. Docker 容器化部署"
      },
      {
        type: "code",
        language: "bash",
        title: "Docker 运行命令",
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
        text: "3. Nginx 反向代理与 WebSocket 升级"
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
    category: "详细教程",
    title: "教程 6：终端配色与主题自定义",
    navTitle: "6. 配色与主题自定义",
    summary: "体验 12 款精选终端配色方案、动态字号缩放与 Geist 设计规范。",
    estimatedReadTime: "约 3 分钟阅读",
    blocks: [
      {
        type: "paragraph",
        text: "Open Termkit 预置了 12 款精心配色方案，经过专业高对比度调校，完美适配白天明亮与夜间弱光环境。"
      },
      {
        type: "heading",
        level: 2,
        id: "theme-simulator",
        text: "1. 交互式终端配色模拟器"
      },
      {
        type: "paragraph",
        text: "在下方的实时模拟器中快速切换 12 种主题配色，实时预览语法高亮与对比度效果："
      },
      {
        type: "component",
        componentName: "ThemePlayground"
      },
      {
        type: "heading",
        level: 2,
        id: "scheme-list",
        text: "2. 配色方案清单"
      },
      {
        type: "list",
        items: [
          "Monokai（默认经典高对比度开发者主题）",
          "Tokyo Night（沉稳夜幕靛蓝配色）",
          "Catppuccin Mocha（柔和马卡龙暗色美学）",
          "Dracula（经典赛博朋克紫粉风格）",
          "Nord（北极冰川冷调极简风格）",
          "Gruvbox Dark（温暖复古大地色系）",
          "One Dark（Atom 经典平衡配色）",
          "GitHub Dark（清爽低饱和度黑灰）",
          "Rose Pine（哑光松木玫瑰粉调）",
          "Solarized Dark & Solarized Light",
          "Light（纸质高清晰度浅色主题）"
        ]
      }
    ]
  },
  {
    id: "tutorial-sync-bundle",
    category: "详细教程",
    title: "教程 7：配置备份与跨设备同步包",
    navTitle: "7. 备份与同步包",
    summary: "导出终端配置、备份 SQLite 数据库，安全迁移到新工作站且绝不泄漏私钥。",
    estimatedReadTime: "约 4 分钟阅读",
    blocks: [
      {
        type: "paragraph",
        text: "Open Termkit 包含零泄漏同步包机制。您可以将所有终端配置、SSH 主机信息和系统设置一键导出为 JSON 格式同步包，并在新设备上一键导入。"
      },
      {
        type: "heading",
        level: 2,
        id: "private-key-safety",
        text: "1. 绝对安全的私钥隔离保证"
      },
      {
        type: "paragraph",
        text: "同步包仅导出配置元数据和私钥文件路径，绝不会将私钥内容打包进 JSON 中，彻底避免敏感凭据意外提交到 git 或向外泄露。"
      },
      {
        type: "heading",
        level: 2,
        id: "cli-export-import",
        text: "2. 通过 CLI 命令行导入与导出"
      },
      {
        type: "code",
        language: "bash",
        title: "Terminal",
        code: `# 导出配置到文件
open-termkit sync export --file my-termkit-backup.json

# 在新机器上导入配置包
open-termkit sync import --file my-termkit-backup.json`
      }
    ]
  },
  {
    id: "architecture-deep-dive",
    category: "核心架构",
    title: "系统架构深度解析",
    navTitle: "架构深度解析",
    summary: "深入剖析 PTY 调度引擎、WebSocket 通信协议、wterm 渲染及 SQLite 存储模型。",
    estimatedReadTime: "约 6 分钟阅读",
    blocks: [
      {
        type: "paragraph",
        text: "本文档详细阐述 Open Termkit 高性能终端数据流与状态管理底层的工程设计决策。"
      },
      {
        type: "heading",
        level: 2,
        id: "pty-allocation",
        text: "1. Unix PTY 虚拟终端分配"
      },
      {
        type: "paragraph",
        text: "底层基于 creack/pty，Go 后端打开主从伪终端文件描述符。子进程 Shell 的标准输入输出指向从设备，环境变量 TERM 预设为 xterm-256color 与 truecolor。"
      },
      {
        type: "heading",
        level: 2,
        id: "websocket-protocol",
        text: "2. WebSocket 实时双向帧协议"
      },
      {
        type: "paragraph",
        text: "客户端通过 /api/terminals/ws 传输 JSON 封装的消息，涵盖输入传输、视口缩放、心跳检测与退出码回调，实现毫秒级响应延迟。"
      },
      {
        type: "heading",
        level: 2,
        id: "sqlite-schema",
        text: "3. SQLite 本地数据库模型"
      },
      {
        type: "paragraph",
        text: "系统在本地维护 terminal_profiles、ssh_profiles、tools、settings 与 setup_state 等表结构，严格启用 PRAGMA foreign_keys = ON，保证单连接并发安全。"
      }
    ]
  },
  {
    id: "cli-reference",
    category: "参考手册",
    title: "CLI 命令行参考手册",
    navTitle: "CLI 命令行参考",
    summary: "完备的命令行指令、参数与选项参考手册。",
    estimatedReadTime: "约 5 分钟阅读",
    blocks: [
      {
        type: "paragraph",
        text: "open-termkit 二进制包含由 Cobra 驱动的丰富命令行工具链。"
      },
      {
        type: "table",
        headers: ["命令", "参数 / 选项", "功能描述"],
        rows: [
          ["open-termkit serve", "--host, --port", "启动 Web 界面与 API 服务（默认端口 8765）。"],
          ["open-termkit setup", "", "自动检测环境工具并在数据库中写入默认预设配置。"],
          ["open-termkit doctor", "", "输出系统健康状态、存储路径与核心运行诊断信息。"],
          ["open-termkit profile list", "", "列出存储在 SQLite 中的所有终端配置。"],
          ["open-termkit profile create", "--name, --shell, --arg, --cwd, --theme", "新建一个终端配置。"],
          ["open-termkit profile update <id>", "--name, --shell 等", "更新已有的终端配置。"],
          ["open-termkit profile delete <id>", "", "删除指定的终端配置。"],
          ["open-termkit ssh list", "", "列出所有已配置的 SSH 主机。"],
          ["open-termkit ssh create", "--name, --host, --user, --port", "新增一个 SSH 远程主机条目。"],
          ["open-termkit ssh write-config", "--include", "生成托管的 OpenSSH 配置文件片段。"],
          ["open-termkit tools list", "", "查看支持的工具目录及本地安装状态。"],
          ["open-termkit tools install <name>", "--yes", "调用本地包管理器安装指定工具。"],
          ["open-termkit sync export", "--file", "将当前所有配置导出为 JSON 文件。"],
          ["open-termkit sync import", "--file", "从 JSON 文件导入并合并配置。"]
        ]
      }
    ]
  },
  {
    id: "api-reference",
    category: "参考手册",
    title: "REST 与 WebSocket API 参考",
    navTitle: "REST 与 WebSocket API",
    summary: "HTTP REST API 路由规范、参数状态码与 WebSocket 协议说明。",
    estimatedReadTime: "约 6 分钟阅读",
    blocks: [
      {
        type: "paragraph",
        text: "Open Termkit 对外提供简洁规整的 JSON HTTP API 与实时 WebSocket 协议。"
      },
      {
        type: "heading",
        level: 2,
        id: "api-endpoints-table",
        text: "API 接口总览"
      },
      {
        type: "table",
        headers: ["方法", "路径", "接口说明"],
        rows: [
          ["GET", "/api/health", "健康检查接口，返回应用名称、数据库路径与版本号。"],
          ["GET", "/api/doctor", "系统诊断接口，输出内存、Shell、Goroutine 与数据库指标。"],
          ["GET", "/api/settings", "获取应用当前存储路径与运行配置。"],
          ["GET / POST", "/api/profiles", "查询所有终端配置或新建终端配置。"],
          ["GET / PUT / DELETE", "/api/profiles/{id}", "获取、修改或删除单个终端配置。"],
          ["GET / POST", "/api/ssh", "查询所有 SSH 主机或添加新主机。"],
          ["GET / PUT / DELETE", "/api/ssh/{id}", "获取、修改或删除单个 SSH 主机。"],
          ["POST", "/api/ssh/test", "向远程主机发起 TCP 探测并返回连通性与网络延迟。"],
          ["POST", "/api/ssh/{id}/test", "测试指定已保存 SSH 主机的网络连通性。"],
          ["POST", "/api/ssh/generate-key", "生成全新的 Ed25519 密钥对。"],
          ["POST", "/api/ssh/import-key", "上传并导入私钥至 ~/.ssh/open-termkit 目录。"],
          ["POST", "/api/ssh/write-config", "写入 ~/.ssh/open-termkit/config 托管配置文件。"],
          ["GET", "/api/tools", "获取工具目录与本地安装状态。"],
          ["POST", "/api/tools/{name}/install", "触发对应工具的包管理器安装进程。"],
          ["GET / POST", "/api/setup/run", "执行系统初始化并写入预设配置。"],
          ["GET", "/api/sync/export", "以附件流形式下载完整 JSON 配置同步包。"],
          ["POST", "/api/sync/import", "上传并合并 JSON 配置同步包。"]
        ]
      }
    ]
  }
];

export function getDocPages(locale: Locale): DocPage[] {
  return locale === "zh" ? docPagesZh : docPagesEn;
}
