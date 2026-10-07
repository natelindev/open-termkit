export type DocSection = {
  id: string;
  category: string;
  title: string;
  navTitle?: string;
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

export const docsSectionsEn: DocSection[] = [
  {
    id: "introduction",
    category: "Getting Started",
    title: "Introduction to Open Termkit",
    navTitle: "Introduction & Overview",
    summary: "Overview of Open Termkit, core philosophy, and architecture.",
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
        text: "Architecture at a Glance"
      },
      {
        type: "code",
        language: "text",
        title: "System Architecture",
        code: `[ Web Browser UI ] ──(WebSocket)──> /api/terminals/ws ──> creack/pty ──> Host Shell (zsh/bash/tmux)
        ├── (HTTP REST API) ──> Go Router ──> SQLite DB (~/.open-termkit/open-termkit.db)
        └── (SSH Manager) ────> ~/.ssh/open-termkit/config (Ed25519 Keys)`
      }
    ]
  },
  {
    id: "quickstart",
    category: "Getting Started",
    title: "Quickstart Guide",
    navTitle: "Quickstart Guide",
    summary: "Build and run Open Termkit in under two minutes.",
    content: [
      {
        type: "paragraph",
        text: "Open Termkit can be compiled from source using Go and Node, or run via pre-built binaries and Docker containers."
      },
      {
        type: "heading",
        level: 2,
        text: "1. Prerequisites"
      },
      {
        type: "list",
        items: [
          "Go 1.22 or newer",
          "Node.js 18 or newer (only needed during frontend compilation)",
          "A POSIX-compliant shell environment (macOS or Linux recommended)"
        ]
      },
      {
        type: "heading",
        level: 2,
        text: "2. Build & Launch from Source"
      },
      {
        type: "code",
        language: "bash",
        title: "Terminal",
        code: `# Clone repository
git clone https://github.com/natelindev/open-termkit.git
cd open-termkit

# Build embedded binary
make build

# Launch the service
./bin/open-termkit serve --port 8765`
      },
      {
        type: "paragraph",
        text: "Once started, open your browser to http://127.0.0.1:8765 to begin managing your terminals."
      },
      {
        type: "heading",
        level: 2,
        text: "3. Automated System Setup"
      },
      {
        type: "paragraph",
        text: "Run the CLI setup command to detect installed developer tools and initialize recommended default profiles:"
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
    summary: "Managing concurrent sessions, background tabs, and real-time controls.",
    content: [
      {
        type: "paragraph",
        text: "Open Termkit provides tabbed terminal workspaces that allow developers to keep multiple interactive shell sessions running in parallel."
      },
      {
        type: "heading",
        level: 2,
        text: "1. Creating and Managing Tabs"
      },
      {
        type: "list",
        items: [
          "Click '+' on the terminal tab bar to spawn a new shell session using your default profile.",
          "Click the chevron '▾' button to select a specific profile (such as Zsh, Bash, tmux, or an AI agent).",
          "Double-click any tab title to edit its name inline.",
          "Click the '×' button to close a tab and terminate its backend process.",
          "Background tabs remain fully active and never drop WebSocket connections while switching views."
        ]
      },
      {
        type: "heading",
        level: 2,
        text: "2. Interactive Controls"
      },
      {
        type: "table",
        headers: ["Control", "Shortcut", "Description"],
        rows: [
          ["Clear Screen", "Clear / Ctrl+L", "Clears the active terminal viewport."],
          ["Restart Session", "Restart", "Gracefully kills the current shell and restarts a fresh process."],
          ["Font Scaling", "A- / A+", "Scales terminal font size between 10px and 24px dynamically."],
          ["Follow Output", "Follow: On / Off", "Toggles auto-scrolling to the bottom as new stdout arrives."],
          ["Zen Mode", "Fullscreen Icon", "Expands the terminal viewport to take over the full window."]
        ]
      },
      {
        type: "heading",
        level: 2,
        text: "3. Quick Switching via Command Palette"
      },
      {
        type: "paragraph",
        text: "Press Cmd+K (macOS) or Ctrl+K (Linux/Windows) at any time to open the Command Palette. Type tab numbers or profile names to jump between open tabs without reaching for your mouse."
      }
    ]
  },
  {
    id: "tutorial-ssh",
    category: "Tutorials",
    title: "Tutorial 2: SSH Keys & Remote Hosts",
    navTitle: "2. SSH Keys & Remote Hosts",
    summary: "Generating keys, configuring remote boxes, and testing network latency.",
    content: [
      {
        type: "paragraph",
        text: "The SSH view enables seamless remote server management with full integration into standard ~/.ssh configurations."
      },
      {
        type: "heading",
        level: 2,
        text: "1. In-App Key Generation"
      },
      {
        type: "paragraph",
        text: "Generate secure Ed25519 key pairs directly within Open Termkit without running external terminal commands:"
      },
      {
        type: "list",
        items: [
          "Navigate to the SSH view and click 'Generate Key'.",
          "Enter a key filename (e.g. id_ed25519_prod) and optional comment.",
          "The private key is written to ~/.ssh/open-termkit/ with secure 0600 permissions.",
          "Click 'Copy' next to the public key to append it to your remote server's authorized_keys."
        ]
      },
      {
        type: "heading",
        level: 2,
        text: "2. Managing Hosts & 1-Click Connect"
      },
      {
        type: "paragraph",
        text: "Add remote hosts with hostname, port, username, identity file, and optional ProxyJump. Each host card provides:"
      },
      {
        type: "list",
        items: [
          "Test: Performs a live TCP reachability check and displays ping latency in milliseconds.",
          "Connect: Automatically spawns a new terminal tab running 'ssh <profile>' with all configured flags.",
          "Edit: Modify parameters or switch keys with instant validation."
        ]
      }
    ]
  },
  {
    id: "tutorial-agents",
    category: "Tutorials",
    title: "Tutorial 3: AI Coding Agents",
    navTitle: "3. AI Coding Assistants",
    summary: "Provisioning and running Claude Code, Codex, OpenCode, and Pi.",
    content: [
      {
        type: "paragraph",
        text: "Open Termkit is purpose-built to accelerate workflows with terminal-based autonomous AI coding agents."
      },
      {
        type: "heading",
        level: 2,
        text: "1. Supported Coding Agents"
      },
      {
        type: "table",
        headers: ["Agent", "Command", "Description"],
        rows: [
          ["Claude Code", "claude", "Anthropic's terminal agent for file editing and git operations."],
          ["Codex CLI", "codex", "OpenAI command-line assistant."],
          ["OpenCode", "opencode", "Open-source extensible terminal agent."],
          ["Pi", "pi", "Minimalist AI pair programmer."]
        ]
      },
      {
        type: "heading",
        level: 2,
        text: "2. One-Click Safe Installation"
      },
      {
        type: "paragraph",
        text: "In the Tools view, Open Termkit scans PATH to detect installed agents. For uninstalled agents, click 'Install' to view an interactive modal with the installation command, followed by real-time streaming installer logs."
      }
    ]
  },
  {
    id: "tutorial-tmux",
    category: "Tutorials",
    title: "Tutorial 4: Persistent Sessions with Tmux",
    navTitle: "4. Persistent Sessions (tmux)",
    summary: "Prevent disconnected processes and maintain resilient terminal sessions.",
    content: [
      {
        type: "paragraph",
        text: "For long-running tasks like remote compilations, model fine-tuning, or servers, Open Termkit provides built-in tmux session persistence."
      },
      {
        type: "heading",
        level: 2,
        text: "1. Built-in Tmux Preset"
      },
      {
        type: "paragraph",
        text: "Open Termkit ships with a default profile configured as:"
      },
      {
        type: "code",
        language: "bash",
        title: "Tmux Command",
        code: "tmux new-session -A -s main"
      },
      {
        type: "paragraph",
        text: "The '-A' flag instructs tmux to attach to an existing session named 'main' if it exists, or create it if it does not. If your browser disconnects, your workspace remains running on the host."
      }
    ]
  },
  {
    id: "reference-cli-api",
    category: "Guides & Reference",
    title: "Reference: CLI & REST API",
    navTitle: "5. CLI & REST API",
    summary: "Command line arguments, flags, and HTTP endpoints.",
    content: [
      {
        type: "paragraph",
        text: "Open Termkit includes a complete CLI and JSON REST API for scripting and external integrations."
      },
      {
        type: "heading",
        level: 2,
        text: "1. CLI Commands"
      },
      {
        type: "table",
        headers: ["Command", "Flags", "Description"],
        rows: [
          ["open-termkit serve", "--host, --port", "Starts the web server (default 127.0.0.1:8765)."],
          ["open-termkit setup", "", "Runs automatic tool detection and profile provisioning."],
          ["open-termkit doctor", "", "Prints system telemetry, memory usage, and diagnostics."],
          ["open-termkit sync export", "--file", "Exports configuration bundle to JSON."],
          ["open-termkit sync import", "--file", "Imports configuration bundle from JSON."]
        ]
      },
      {
        type: "heading",
        level: 2,
        text: "2. Key REST Endpoints"
      },
      {
        type: "table",
        headers: ["Endpoint", "Method", "Description"],
        rows: [
          ["/api/health", "GET", "Health check returning application status."],
          ["/api/doctor", "GET", "Detailed system telemetry and SQLite database metrics."],
          ["/api/profiles", "GET / POST", "List or create terminal launch profiles."],
          ["/api/ssh/test", "POST", "Probe remote host TCP reachability and latency."],
          ["/api/ssh/generate-key", "POST", "Generate Ed25519 key pair with comment."],
          ["/api/terminals/ws", "WebSocket", "Real-time PTY terminal stream."]
        ]
      }
    ]
  }
];

export const docsSectionsZh: DocSection[] = [
  {
    id: "introduction",
    category: "快速入门",
    title: "Open Termkit 介绍与概述",
    navTitle: "介绍与概述",
    summary: "Open Termkit 核心设计哲学、系统架构与功能概览。",
    content: [
      {
        type: "paragraph",
        text: "Open Termkit 是一款生产级自托管本地及 Web 终端环境，核心采用 wterm 与 Go 构建。它将本地 PTY 虚拟终端交互会话与企业级管理功能结合，深度集成终端配置、SSH 密钥与远程连接、自主 AI 编程 Agent 与 tmux 持久化工作区。"
      },
      {
        type: "callout",
        variant: "tip",
        title: "单一二进制文件架构",
        text: "Open Termkit 将所有后端服务、数据存储与生产级 React 前端打包编译为单个独立 Go 二进制文件，在生产运行时完全不需要依赖 Node.js 或 Python 等外部运行时环境。"
      },
      {
        type: "heading",
        level: 2,
        text: "核心功能亮点"
      },
      {
        type: "list",
        items: [
          "多标签终端工作区：多 PTY 会话并发运行，各会话拥有独立输出缓冲区，切换标签平滑不断连。",
          "SSH 主机与密钥管理器：统一管理远程服务器，原生生成 Ed25519 密钥对，毫秒级网络测速，一键连接。",
          "AI 编程助手中心：自动扫描、一键安装并快捷启动 Claude Code、Codex CLI、OpenCode 与 Pi 命令行助手。",
          "Geist 现代极简设计：遵循精密黑白灰现代美学规范，原生支持高质感深色与浅色主题无缝切换。",
          "离线优先与本地数据安全：所有配置本地保存在 SQLite 中；私钥文件严格限定于本地 0600 权限。",
          "开箱即用的生产部署：附带原生 systemd 自动化脚本、Docker 镜像支持以及 WebSocket 反向代理兼容。"
        ]
      },
      {
        type: "heading",
        level: 2,
        text: "系统总体架构"
      },
      {
        type: "code",
        language: "text",
        title: "系统架构示意",
        code: `[ 浏览器前端 Web UI ] ──(WebSocket)──> /api/terminals/ws ──> creack/pty ──> 宿主 Shell (zsh/bash/tmux)
        ├── (HTTP REST API) ──> Go Router ──> SQLite 数据库 (~/.open-termkit/open-termkit.db)
        └── (SSH 管理器) ─────> ~/.ssh/open-termkit/config (Ed25519 密钥)`
      }
    ]
  },
  {
    id: "quickstart",
    category: "快速入门",
    title: "快速入门指南",
    navTitle: "快速入门指南",
    summary: "两分钟内完成 Open Termkit 编译构建与启动运行。",
    content: [
      {
        type: "paragraph",
        text: "Open Termkit 支持直接从源码快速编译构建，也可以通过预编译二进制文件或 Docker 容器运行。"
      },
      {
        type: "heading",
        level: 2,
        text: "1. 编译前置依赖"
      },
      {
        type: "list",
        items: [
          "Go 1.22 或更高版本",
          "Node.js 18 或更高版本（仅前端构建阶段需要）",
          "兼容 POSIX 标准的 Shell 环境（推荐 macOS 或 Linux）"
        ]
      },
      {
        type: "heading",
        level: 2,
        text: "2. 源码编译与启动"
      },
      {
        type: "code",
        language: "bash",
        title: "Terminal",
        code: `# 克隆代码仓库
git clone https://github.com/natelindev/open-termkit.git
cd open-termkit

# 编译前端静态资源并打包 Go 单一二进制
make build

# 启动终端服务
./bin/open-termkit serve --port 8765`
      },
      {
        type: "paragraph",
        text: "服务启动后，在浏览器中打开 http://127.0.0.1:8765 即可立即使用。"
      },
      {
        type: "heading",
        level: 2,
        text: "3. 一键初始化环境"
      },
      {
        type: "paragraph",
        text: "运行 CLI setup 命令以扫描当前机器上的开发工具和 AI Agent，并在本地数据库中自动写入推荐预设配置："
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
    content: [
      {
        type: "paragraph",
        text: "Open Termkit 提供多标签终端调度引擎，可以在宿主机上同时运行多个并发 PTY 进程，同时实现零延迟标签切换且不中断连接。"
      },
      {
        type: "heading",
        level: 2,
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
        text: "2. 实时终端控制栏"
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
    content: [
      {
        type: "paragraph",
        text: "Open Termkit 提供了专业级 SSH 配置管理器，在兼容标准 OpenSSH 文件的同时，提供了现代化 Web 连接体验。"
      },
      {
        type: "heading",
        level: 2,
        text: "1. 界面内直接生成 Ed25519 密钥"
      },
      {
        type: "paragraph",
        text: "直接在界面中生成安全的 Ed25519 密钥对，无需在外部终端中繁琐操作："
      },
      {
        type: "list",
        items: [
          "在主导航栏中进入 SSH 视图，点击“生成密钥对”。",
          "输入密钥名称（例如 id_ed25519_prod）和备注信息。",
          "私钥安全写入 ~/.ssh/open-termkit/ 目录，具有严格的 0600 权限。",
          "点击公钥旁边的“复制”按钮，将其添加到目标服务器的 authorized_keys 文件中。"
        ]
      },
      {
        type: "heading",
        level: 2,
        text: "2. 主机管理与一键连入"
      },
      {
        type: "paragraph",
        text: "配置远程主机参数（主机名、端口、用户、密钥路径及跳板机）。每个卡片提供："
      },
      {
        type: "list",
        items: [
          "测试：发起实时 TCP 网络连通性测试，以毫秒为单位显示 ping 延迟。",
          "连接：自动在终端区开启新标签页并执行 'ssh <profile>' 进行交互连接。",
          "编辑：在线更新主机参数并自动同步至本地托管配置。"
        ]
      }
    ]
  },
  {
    id: "tutorial-agents",
    category: "详细教程",
    title: "教程 3：配置 AI 编程助手环境",
    navTitle: "3. AI 编程助手环境",
    summary: "在终端环境中集成 Claude Code、OpenAI Codex、OpenCode 与 Pi。",
    content: [
      {
        type: "paragraph",
        text: "Open Termkit 针对命令行 AI 编程 Agent 的开发场景进行了专属优化。"
      },
      {
        type: "heading",
        level: 2,
        text: "1. 支持的 Agent 列表"
      },
      {
        type: "table",
        headers: ["编程助手", "命令", "描述"],
        rows: [
          ["Claude Code", "claude", "Anthropic 官方终端自主编程助手。"],
          ["Codex CLI", "codex", "OpenAI 命令行交互式编程助手。"],
          ["OpenCode", "opencode", "开源命令行终端 AI 编程协作套件。"],
          ["Pi", "pi", "极简终端 AI 结对编程助手。"]
        ]
      },
      {
        type: "heading",
        level: 2,
        text: "2. 安全一键可视化安装"
      },
      {
        type: "paragraph",
        text: "在“工具”视图中，Open Termkit 自动检测已安装的 Agent。对于未安装的工具，点击“安装”即可查看即将执行的安装命令，并在弹窗中实时查看流式安装日志。"
      }
    ]
  },
  {
    id: "tutorial-tmux",
    category: "详细教程",
    title: "教程 4：使用 Tmux 保持会话常驻",
    navTitle: "4. 持久会话 (tmux)",
    summary: "让长时间编译、训练或部署任务在断网和关闭浏览器后持续运行。",
    content: [
      {
        type: "paragraph",
        text: "对于长时间运行的任务（如大型项目构建、测试套件运行或长时间训练），结合 tmux 使用可以确保会话永不断线。"
      },
      {
        type: "heading",
        level: 2,
        text: "1. 内置 Tmux 预设"
      },
      {
        type: "paragraph",
        text: "Open Termkit 预置了默认 tmux 配置："
      },
      {
        type: "code",
        language: "bash",
        title: "Tmux 命令",
        code: "tmux new-session -A -s main"
      },
      {
        type: "paragraph",
        text: "'-A' 参数会在会话已存在时直接恢复接入，未创建时自动新建。即使关闭浏览器，任务仍将在宿主机上持续运行。"
      }
    ]
  },
  {
    id: "reference-cli-api",
    category: "参考手册",
    title: "参考手册：CLI 命令行与 REST API",
    navTitle: "5. CLI 与 REST API",
    summary: "完整的命令行指令、参数与 HTTP REST 接口规范。",
    content: [
      {
        type: "paragraph",
        text: "Open Termkit 提供了完备的命令行工具链与标准 JSON REST API。"
      },
      {
        type: "heading",
        level: 2,
        text: "1. 常用 CLI 命令"
      },
      {
        type: "table",
        headers: ["命令", "参数", "功能说明"],
        rows: [
          ["open-termkit serve", "--host, --port", "启动 Web 界面与 API 服务（默认 127.0.0.1:8765）。"],
          ["open-termkit setup", "", "执行系统环境自动检测与预设配置初始化。"],
          ["open-termkit doctor", "", "输出系统健康状态、内存指标与详细诊断信息。"],
          ["open-termkit sync export", "--file", "将当前所有配置导出为 JSON 文件。"],
          ["open-termkit sync import", "--file", "从 JSON 文件导入并合并配置。"]
        ]
      },
      {
        type: "heading",
        level: 2,
        text: "2. 核心 REST 接口"
      },
      {
        type: "table",
        headers: ["接口路径", "HTTP 方法", "接口功能"],
        rows: [
          ["/api/health", "GET", "健康检查接口，返回应用基本信息。"],
          ["/api/doctor", "GET", "系统详细遥测与 SQLite 数据库运行指标。"],
          ["/api/profiles", "GET / POST", "获取或创建终端运行配置。"],
          ["/api/ssh/test", "POST", "远程主机 TCP 连通性与 ping 延迟探测。"],
          ["/api/ssh/generate-key", "POST", "生成全新的 Ed25519 密钥对。"],
          ["/api/terminals/ws", "WebSocket", "实时 PTY 终端数据流。"]
        ]
      }
    ]
  }
];

export const docsSections = docsSectionsEn;

export function getDocsSections(locale: "en" | "zh"): DocSection[] {
  return locale === "zh" ? docsSectionsZh : docsSectionsEn;
}
