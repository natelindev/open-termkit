# Tutorial 4: Persistent Workspaces with Tmux

When running tasks like long test suites, compilation jobs, or remote agent loops, browser tabs might be accidentally closed or network connections interrupted. Pairing Open Termkit with `tmux` ensures your sessions remain completely persistent on the host.

---

## 1. Why Tmux with Open Termkit?

WebSockets provide low-latency terminal streaming, but if you close your laptop lid or disconnect your network, the underlying socket drops. With `tmux`:
- Your shell and running processes remain alive in the background on the host machine.
- Re-opening Open Termkit instantly re-attaches to the exact same terminal state, history, and active jobs.

---

## 2. Setting Up the Tmux Preset

Open Termkit includes a built-in tmux preset profile:
- **Profile Name**: `tmux main`
- **Shell Command**: `tmux`
- **Arguments**: `["new-session", "-A", "-s", "main"]`

The `-A` flag instructs tmux to attach to the existing session named `main` if it exists, or create a new session if it does not.

To initialize this preset:
1. Navigate to **Setup** and click **"Run Complete Setup"**.
2. Alternatively, navigate to **Profiles** -> **New Profile**, set Shell to `tmux`, and add the arguments `new-session`, `-A`, `-s`, `main`.

---

## 3. Essential Tmux Commands

Once inside a tmux terminal tab:

| Action | Keybinding |
| :--- | :--- |
| **Prefix Key** | `Ctrl + b` |
| **Split Horizontally** | `Ctrl + b` then `%` |
| **Split Vertically** | `Ctrl + b` then `"` |
| **Switch Panes** | `Ctrl + b` then `Arrow Key` |
| **Create New Window** | `Ctrl + b` then `c` |
| **Switch Windows** | `Ctrl + b` then `n` (next) or `p` (prev) |
| **Detach Session** | `Ctrl + b` then `d` |
