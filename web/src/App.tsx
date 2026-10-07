import { useEffect, useId, useMemo, useState } from "react";
import { api } from "./api";
import { CommandPalette } from "./components/CommandPalette";
import { DocsView } from "./components/DocsView";
import { ProfilesView } from "./components/ProfilesView";
import { SetupView } from "./components/SetupView";
import { SettingsView } from "./components/SettingsView";
import { SSHView } from "./components/SSHView";
import { TerminalView } from "./components/TerminalView";
import { ToolsView } from "./components/ToolsView";
import type { SSHProfile, TerminalProfile, TerminalTab, Tool } from "./types";

export type View = "terminal" | "profiles" | "ssh" | "setup" | "tools" | "settings" | "docs";
export type Theme = "light" | "dark";
type DropdownOption = { value: string; label: string };

const themeStorageKey = "open-termkit-theme";
const defaultTerminalTheme = "monokai";

const profileThemeOptions: DropdownOption[] = [
  { value: "monokai", label: "Monokai" },
  { value: "tokyo-night", label: "Tokyo Night" },
  { value: "catppuccin-mocha", label: "Catppuccin Mocha" },
  { value: "dracula", label: "Dracula" },
  { value: "nord", label: "Nord" },
  { value: "gruvbox-dark", label: "Gruvbox Dark" },
  { value: "one-dark", label: "One Dark" },
  { value: "github-dark", label: "GitHub Dark" },
  { value: "rose-pine", label: "Rose Pine" },
  { value: "solarized-dark", label: "Solarized Dark" },
  { value: "solarized-light", label: "Solarized Light" },
  { value: "light", label: "Light" }
];

const navItems = [
  { id: "terminal", label: "Terminal", path: "/terminal" },
  { id: "profiles", label: "Profiles", path: "/profiles" },
  { id: "ssh", label: "SSH", path: "/ssh" },
  { id: "tools", label: "Tools", path: "/tools" },
  { id: "setup", label: "Setup", path: "/setup" },
  { id: "settings", label: "Settings", path: "/settings" },
  { id: "docs", label: "Docs", path: "/docs" }
] satisfies Array<{ id: View; label: string; path: string }>;

function viewFromPath(pathname: string): View {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized.startsWith("/docs")) return "docs";
  return navItems.find((item) => item.path === normalized)?.id ?? "terminal";
}

function pathForView(view: View): string {
  return navItems.find((item) => item.id === view)?.path ?? "/terminal";
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(themeStorageKey);
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export default function App() {
  const [view, setView] = useState<View>(() =>
    typeof window === "undefined" ? "terminal" : viewFromPath(window.location.pathname)
  );
  const [notice, setNotice] = useState("");
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const [terminalProfiles, setTerminalProfiles] = useState<TerminalProfile[]>([]);
  const [sshProfiles, setSSHProfiles] = useState<SSHProfile[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);

  // Multi-tab terminal management
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("");

  const nextTheme = theme === "dark" ? "light" : "dark";

  const refreshAllData = async () => {
    try {
      const [pList, sList, tList] = await Promise.all([
        api<TerminalProfile[]>("/api/profiles"),
        api<SSHProfile[] | null>("/api/ssh"),
        api<Tool[]>("/api/tools")
      ]);
      setTerminalProfiles(pList);
      setSSHProfiles(Array.isArray(sList) ? sList : []);
      setTools(tList);

      // Initialize first tab if no tabs exist
      setTabs((currentTabs) => {
        if (currentTabs.length > 0) return currentTabs;
        const defProfile = pList.find((p) => p.isDefault) ?? pList[0];
        if (!defProfile) return [];
        const initialTab: TerminalTab = {
          id: `tab_${Date.now()}`,
          title: defProfile.name,
          profileId: defProfile.id,
          fontSize: defProfile.fontSize || 14,
          followOutput: true,
          createdAt: Date.now()
        };
        setActiveTabId(initialTab.id);
        return [initialTab];
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load data";
      setNotice(msg);
    }
  };

  useEffect(() => {
    void refreshAllData();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      window.localStorage.setItem(themeStorageKey, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    const handlePopState = () => setView(viewFromPath(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  // Global Command Palette Shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigate = (nextView: View) => {
    const nextPath = pathForView(nextView);
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, "", nextPath);
    }
    setView(nextView);
  };

  // Tab management helpers
  const handleAddTab = (profileId?: string) => {
    const targetProfile =
      (profileId ? terminalProfiles.find((p) => p.id === profileId) : null) ??
      terminalProfiles.find((p) => p.isDefault) ??
      terminalProfiles[0];

    if (!targetProfile) {
      setNotice("No terminal profile available to open.");
      return;
    }

    const newTab: TerminalTab = {
      id: `tab_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: `${targetProfile.name} #${tabs.length + 1}`,
      profileId: targetProfile.id,
      fontSize: targetProfile.fontSize || 14,
      followOutput: true,
      createdAt: Date.now()
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    navigate("terminal");
  };

  const handleCloseTab = (tabId: string) => {
    setTabs((prev) => {
      const remaining = prev.filter((t) => t.id !== tabId);
      if (activeTabId === tabId && remaining.length > 0) {
        setActiveTabId(remaining[remaining.length - 1].id);
      }
      return remaining;
    });
  };

  const handleRenameTab = (tabId: string, newTitle: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, title: newTitle } : t))
    );
  };

  // 1-Click SSH Connect in Terminal Tab
  const handleConnectSSH = async (ssh: SSHProfile) => {
    const profileName = `SSH: ${ssh.name}`;
    let profile = terminalProfiles.find((p) => p.name === profileName);

    if (!profile) {
      const args: string[] = [];
      if (ssh.port && ssh.port !== 22) {
        args.push("-p", String(ssh.port));
      }
      if (ssh.identityFile) {
        args.push("-i", ssh.identityFile);
      }
      if (ssh.proxyJump) {
        args.push("-J", ssh.proxyJump);
      }
      const hostTarget = ssh.user ? `${ssh.user}@${ssh.host}` : ssh.host;
      args.push(hostTarget);

      try {
        profile = await api<TerminalProfile>("/api/profiles", {
          method: "POST",
          body: JSON.stringify({
            name: profileName,
            shellCommand: "ssh",
            args,
            cwd: "",
            theme: defaultTerminalTheme,
            fontFamily: "JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 14,
            env: {},
            keybindings: {},
            wtermSettings: { cursorBlink: true, autoResize: true },
            isDefault: false
          })
        });
        const updatedProfiles = await api<TerminalProfile[]>("/api/profiles");
        setTerminalProfiles(updatedProfiles);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to create SSH profile";
        setNotice(msg);
        return;
      }
    }

    const newTab: TerminalTab = {
      id: `tab_ssh_${Date.now()}`,
      title: `SSH: ${ssh.name}`,
      profileId: profile.id,
      fontSize: 14,
      followOutput: true,
      createdAt: Date.now()
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    navigate("terminal");
    setNotice(`Connecting to ${ssh.name}...`);
  };

  // 1-Click Tool Launch in Terminal Tab
  const handleLaunchTool = async (tool: Tool) => {
    const command = tool.profileCommand.length > 0 ? tool.profileCommand : [tool.binary];
    const [shellCommand, ...args] = command;
    if (!shellCommand) {
      setNotice(`No launch command available for ${tool.displayName}`);
      return;
    }

    let profile = terminalProfiles.find(
      (p) => p.shellCommand === shellCommand && p.args.join(" ") === args.join(" ")
    );

    if (!profile) {
      try {
        profile = await api<TerminalProfile>("/api/profiles", {
          method: "POST",
          body: JSON.stringify({
            name: tool.displayName,
            shellCommand,
            args,
            cwd: "",
            theme: defaultTerminalTheme,
            fontFamily: "JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 14,
            env: {},
            keybindings: {},
            wtermSettings: { cursorBlink: true, autoResize: true },
            isDefault: false
          })
        });
        const updatedProfiles = await api<TerminalProfile[]>("/api/profiles");
        setTerminalProfiles(updatedProfiles);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to create tool profile";
        setNotice(msg);
        return;
      }
    }

    const newTab: TerminalTab = {
      id: `tab_tool_${Date.now()}`,
      title: tool.displayName,
      profileId: profile.id,
      fontSize: 14,
      followOutput: true,
      createdAt: Date.now()
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    navigate("terminal");
    setNotice(`Launched ${tool.displayName}`);
  };

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) ?? tabs[0],
    [tabs, activeTabId]
  );

  const activeProfile = useMemo(
    () => terminalProfiles.find((p) => p.id === activeTab?.profileId) ?? terminalProfiles[0],
    [terminalProfiles, activeTab]
  );

  const updateActiveTerminalTheme = async (nextThemeValue: string) => {
    if (!activeProfile || activeProfile.theme === nextThemeValue) return;
    try {
      const updated = await api<TerminalProfile>(`/api/profiles/${activeProfile.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...activeProfile, theme: nextThemeValue })
      });
      setTerminalProfiles((current) =>
        current.map((p) => (p.id === updated.id ? updated : p))
      );
      setNotice(`Terminal color scheme updated to ${nextThemeValue}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update theme";
      setNotice(msg);
    }
  };

  return (
    <div className="app-shell">
      {/* Top Bar Header */}
      <aside className="sidebar">
        <div className="brand-cluster">
          <div className="brand" onClick={() => navigate("terminal")} role="button" tabIndex={0}>
            <span className="brand-logo" aria-hidden="true" />
            <span>open-termkit</span>
          </div>

          {/* Quick Launcher Palette Button */}
          <button
            type="button"
            className="palette-trigger-btn"
            onClick={() => setIsPaletteOpen(true)}
            title="Open Command Palette (Cmd+K / Ctrl+K)"
          >
            <span className="palette-icon" aria-hidden="true">⌘</span>
            <span>Search or command...</span>
            <kbd className="palette-kbd">⌘K</kbd>
          </button>

          {/* Terminal Scheme Selector */}
          <div className="scheme-selector" aria-label="Terminal color scheme selector">
            <span className="scheme-selector-label">Scheme</span>
            <select
              className="scheme-native-select"
              value={activeProfile?.theme || defaultTerminalTheme}
              disabled={!activeProfile}
              onChange={(e) => void updateActiveTerminalTheme(e.target.value)}
            >
              {profileThemeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="nav-cluster">
          <nav aria-label="Primary Navigation">
            {navItems.map((item) => (
              <a
                key={item.id}
                aria-current={view === item.id ? "page" : undefined}
                className={view === item.id ? "nav-item active" : "nav-item"}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.id);
                }}
                title={item.label}
              >
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          {/* Theme Toggle Button */}
          <button
            className="theme-button"
            onClick={() => setTheme(nextTheme)}
            type="button"
            aria-label={`Switch to ${nextTheme} theme`}
            title={`Switch to ${nextTheme} theme`}
          >
            <ThemeIcon theme={theme} />
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className={view === "terminal" ? "workspace terminal-workspace" : "workspace"}>
        {notice && (
          <div className="notice" role="status">
            <span className="notice-dot" aria-hidden="true" />
            <span>{notice}</span>
          </div>
        )}

        {view === "terminal" && (
          <TerminalView
            tabs={tabs}
            activeTabId={activeTabId}
            profiles={terminalProfiles}
            onAddTab={handleAddTab}
            onCloseTab={handleCloseTab}
            onSelectTab={setActiveTabId}
            onRenameTab={handleRenameTab}
            onNotice={setNotice}
          />
        )}

        {view === "profiles" && (
          <ProfilesView
            profiles={terminalProfiles}
            onNotice={setNotice}
            onProfilesChanged={refreshAllData}
          />
        )}

        {view === "ssh" && (
          <SSHView
            onConnect={handleConnectSSH}
            onNotice={setNotice}
          />
        )}

        {view === "tools" && (
          <ToolsView
            onLaunchTool={handleLaunchTool}
            onNotice={setNotice}
          />
        )}

        {view === "setup" && (
          <SetupView onNotice={setNotice} />
        )}

        {view === "settings" && (
          <SettingsView onNotice={setNotice} />
        )}

        {view === "docs" && (
          <DocsView />
        )}
      </main>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        tabs={tabs}
        activeTabId={activeTabId}
        profiles={terminalProfiles}
        sshProfiles={sshProfiles}
        tools={tools}
        onSwitchTab={setActiveTabId}
        onNewTabWithProfile={handleAddTab}
        onConnectSSH={handleConnectSSH}
        onLaunchTool={handleLaunchTool}
        onNavigate={navigate}
        onToggleTheme={() => setTheme(nextTheme)}
      />
    </div>
  );
}

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === "dark") {
    return (
      <svg className="theme-icon" aria-hidden="true" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 2.75v1.5M10 15.75v1.5M4.87 4.87l1.06 1.06M14.07 14.07l1.06 1.06M2.75 10h1.5M15.75 10h1.5M4.87 15.13l1.06-1.06M14.07 5.93l1.06-1.06"
          stroke="currentColor"
          strokeLinecap="round"
        />
        <circle cx="10" cy="10" r="3.25" stroke="currentColor" />
      </svg>
    );
  }

  return (
    <svg className="theme-icon" aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path
        d="M15.69 11.34A5.7 5.7 0 0 1 8.66 4.31a6.08 6.08 0 1 0 7.03 7.03Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  );
}
