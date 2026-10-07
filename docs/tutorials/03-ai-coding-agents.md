# Tutorial 3: Setting Up AI Coding Agents

Open Termkit is built from the ground up for developers working with autonomous and pair-programming AI coding agents.

---

## 1. Supported Agent CLIs

The Tools catalog auto-detects and provisions four major AI coding agent CLI tools:

| Agent | Binary | Description | Default Installer |
| :--- | :--- | :--- | :--- |
| **Claude Code** | `claude` | Anthropic's agentic coding tool for terminal workflows | `npm install -g @anthropic-ai/claude-code` |
| **Codex CLI** | `codex` | OpenAI's command-line coding agent interface | `npm install -g @openai/codex` |
| **OpenCode** | `opencode` | Open-source terminal AI coding assistant | `npm install -g opencode-ai` |
| **Pi** | `pi` | Minimalist AI pair-programmer CLI | `npm install -g @earendil-works/pi-coding-agent` |

---

## 2. In-App Installation

To install any uninstalled agent:
1. Navigate to the **Tools** view.
2. Filter by the **AI Agents** category chip.
3. Click **"Install (npm)"** on the desired agent card.
4. An in-app confirmation modal shows the exact command being run. Click **"Run Install"**.
5. Once complete, an in-app log viewer displays the installer output.

---

## 3. Configuring Agent Profiles & API Keys

To configure API tokens or custom instructions:
1. Navigate to the **Profiles** view.
2. Select the agent's profile from the list.
3. Under **Environment Variables**, add the necessary keys:
   - For Claude Code: `ANTHROPIC_API_KEY`
   - For Codex: `OPENAI_API_KEY`
4. Set the **Working Directory (CWD)** to your active project repository.
5. Click **"Save Profile"**.

---

## 4. Launching in Terminal

From either the Tools view (click **"Launch in Terminal"**) or the Command Palette (`Cmd+K` -> type the agent name), Open Termkit immediately opens an interactive terminal session running the agent inside wterm.
