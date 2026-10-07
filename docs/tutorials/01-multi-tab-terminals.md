# Tutorial 1: Multi-Tab Terminal Sessions

Open Termkit includes a multi-tab terminal management engine designed for concurrent development workflows. This tutorial covers tab controls, session persistence, and productivity shortcuts.

---

## 1. Opening and Managing Tabs

### Creating a New Tab
- Click the **`+`** button in the terminal tab bar to immediately open a new tab with your default profile.
- Click the **chevron dropdown** next to `+` to choose a specific profile (such as Bash, tmux, or an AI agent).

### Switching Tabs without Connection Loss
Unlike basic web terminal demos, Open Termkit maintains running PTY processes in the background:
- Clicking between tabs preserves the active process, terminal buffer, and running jobs.
- Background tasks (such as compiles, long-running scripts, or log tails) continue executing seamlessly.

### Renaming Tabs
- **Double-click** any tab title in the tab bar to enter rename mode.
- Type your preferred label (e.g., `Build`, `Worker`, `Server Logs`) and press **Enter** or click outside to save.

### Closing Tabs
- Click the **`×`** button on any tab to disconnect its WebSocket and terminate the corresponding host PTY process.

---

## 2. Interactive Terminal Toolbar

Each terminal tab features an integrated toolbar on the right side of the canvas:

| Button | Function | Shortcut |
| :--- | :--- | :--- |
| **Clear** | Clears the visible terminal viewport | Sends `Ctrl+L` / form-feed |
| **Restart** | Terminates and respawns the shell process | — |
| **A- / A+** | Dynamically decreases or increases font size | Real-time CSS scaling |
| **Follow: On/Off** | Toggles auto-scrolling to bottom on new output | — |
| **Zen Mode** | Toggles distraction-free fullscreen mode | — |

---

## 3. Command Palette (Cmd+K / Ctrl+K)

Press `Cmd+K` (macOS) or `Ctrl+K` (Linux/Windows) from anywhere in Open Termkit to summon the Command Palette:
- Jump directly to open tabs by name.
- Spawn a new terminal with any profile.
- Connect to any configured SSH host.
- Launch installed AI coding agents.
- Toggle between dark and light themes.
