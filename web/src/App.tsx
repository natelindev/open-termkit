import { FormEvent, type KeyboardEvent, type MouseEvent, type RefObject, useEffect, useId, useMemo, useRef, useState } from "react";
import { Terminal as WTerminal, useTerminal } from "@wterm/react";
import type { TerminalHandle } from "@wterm/react";
import { api, wsURL } from "./api";
import type { SettingsResponse, SSHProfile, TerminalProfile, Tool } from "./types";

type View = "terminal" | "profiles" | "ssh" | "setup" | "tools" | "settings";
type Theme = "light" | "dark";
type DropdownOption = { value: string; label: string };

const themeStorageKey = "open-termkit-theme";
const terminalConnectTimeoutMs = 8000;
const terminalReconnectDelayMs = 1500;
const profileThemeOptions = [
  { value: "monokai", label: "monokai" },
  { value: "solarized-dark", label: "solarized-dark" },
  { value: "light", label: "light" }
] satisfies DropdownOption[];

const navItems = [
  { id: "terminal", label: "Terminal", path: "/terminal" },
  { id: "profiles", label: "Profiles", path: "/profiles" },
  { id: "ssh", label: "SSH", path: "/ssh" },
  { id: "setup", label: "Setup", path: "/setup" },
  { id: "tools", label: "Tools", path: "/tools" },
  { id: "settings", label: "Settings", path: "/settings" }
] satisfies Array<{ id: View; label: string; path: string }>;

function viewFromPath(pathname: string): View {
  const normalized = pathname.replace(/\/+$/, "") || "/";
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
  const [terminalProfiles, setTerminalProfiles] = useState<TerminalProfile[]>([]);
  const [activeTerminalID, setActiveTerminalID] = useState("");
  const [terminalStatus, setTerminalStatus] = useState("disconnected");
  const [terminalPingMs, setTerminalPingMs] = useState<number | null>(null);
  const connectionTooltipID = useId();
  const nextTheme = theme === "dark" ? "light" : "dark";
  const terminalStatusClass = terminalStatus.startsWith("exited")
    ? "exited"
    : terminalStatus.replace(/\s/g, "-");
  const connectionTooltip = connectionStatusTooltip(terminalStatus, terminalPingMs);

  const activeTerminalProfile = useMemo(
    () => terminalProfiles.find((profile) => profile.id === activeTerminalID) ?? terminalProfiles[0],
    [terminalProfiles, activeTerminalID]
  );
  const terminalProfileOptions = useMemo(
    () =>
      terminalProfiles.length === 0
        ? [{ value: "", label: "No profiles" }]
        : terminalProfiles.map((profile) => ({ value: profile.id, label: profile.name })),
    [terminalProfiles]
  );

  const refreshTerminalProfiles = async () => {
    const items = await loadProfiles();
    setTerminalProfiles(items);
    setActiveTerminalID((current) => {
      if (items.some((profile) => profile.id === current)) return current;
      return (items.find((profile) => profile.isDefault) ?? items[0])?.id ?? "";
    });
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      window.localStorage.setItem(themeStorageKey, theme);
    } catch {
      // Ignore storage failures and keep the in-memory theme.
    }
  }, [theme]);

  useEffect(() => {
    const handlePopState = () => setView(viewFromPath(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    void refreshTerminalProfiles().catch((error: Error) => setNotice(error.message));
  }, []);

  const navigate = (nextView: View, event?: MouseEvent<HTMLAnchorElement>) => {
    if (event && (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) {
      return;
    }
    event?.preventDefault();
    const nextPath = pathForView(nextView);
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, "", nextPath);
    }
    setView(nextView);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-cluster">
          <div className="brand">
            <span className="brand-logo" aria-hidden="true" />
            <span>open-termkit</span>
          </div>
          <div className="shell-selector" aria-label="Shell selector">
            <CustomDropdown
              className="nav-dropdown"
              disabled={terminalProfiles.length === 0}
              label="Terminal profile"
              onChange={setActiveTerminalID}
              options={terminalProfileOptions}
              value={activeTerminalProfile?.id ?? ""}
            />
          </div>
        </div>
        <div className="nav-cluster">
          <nav aria-label="Primary">
            {navItems.map((item) => (
              <a
                aria-current={view === item.id ? "page" : undefined}
                className={view === item.id ? "nav-item active" : "nav-item"}
                href={item.path}
                key={item.id}
                onClick={(event) => navigate(item.id, event)}
                title={item.label}
              >
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
          <div
            className={`connection-status ${terminalStatusClass}`}
            role="status"
            aria-describedby={connectionTooltipID}
            aria-label={connectionTooltip}
            tabIndex={0}
            title={connectionTooltip}
          >
            <ConnectionStatusIcon status={terminalStatusClass} />
            <span className="connection-tooltip" id={connectionTooltipID} role="tooltip">
              {connectionTooltip}
            </span>
          </div>
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
      <main className={view === "terminal" ? "workspace terminal-workspace" : "workspace"}>
        {notice && (
          <div className="notice">
            <span className="notice-dot" aria-hidden="true" />
            <span>{notice}</span>
          </div>
        )}
        {view === "terminal" && (
          <TerminalView
            activeProfile={activeTerminalProfile}
            appTheme={theme}
            onNotice={setNotice}
            setPingMs={setTerminalPingMs}
            setStatus={setTerminalStatus}
          />
        )}
        {view === "profiles" && <ProfilesView onNotice={setNotice} onProfilesChanged={refreshTerminalProfiles} />}
        {view === "ssh" && <SSHView onNotice={setNotice} />}
        {view === "setup" && <SetupView onNotice={setNotice} />}
        {view === "tools" && <ToolsView onNotice={setNotice} />}
        {view === "settings" && <SettingsView onNotice={setNotice} />}
      </main>
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

function ConnectionStatusIcon({ status }: { status: string }) {
  if (status === "connected") {
    return (
      <svg className="connection-status-icon" aria-hidden="true" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="6.25" stroke="currentColor" />
        <path d="M7.25 10.2 9.1 12.05l3.85-4.1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (status === "connecting") {
    return (
      <svg className="connection-status-icon" aria-hidden="true" viewBox="0 0 20 20" fill="none">
        <path d="M10 3.75a6.25 6.25 0 1 1-5.4 9.4" stroke="currentColor" strokeLinecap="round" />
        <path d="M4.25 13.25h3v-3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (status === "error") {
    return (
      <svg className="connection-status-icon" aria-hidden="true" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="6.25" stroke="currentColor" />
        <path d="M10 6.75v4" stroke="currentColor" strokeLinecap="round" />
        <path d="M10 13.5h.01" stroke="currentColor" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className="connection-status-icon" aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path
        d="M7 3.75v3M13 3.75v3M6 6.75h8v2.5a4 4 0 0 1-8 0v-2.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 13.25v3" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function connectionStatusTooltip(status: string, pingMs: number | null) {
  if (status === "connected") {
    return pingMs == null ? "Connected" : `Connected - ${pingMs} ms ping`;
  }
  if (status === "connecting") return "Connecting";
  if (status === "disconnected") return "Disconnected";
  if (status === "error") return "Connection error";
  if (status.startsWith("exited")) return `Exited ${status.replace("exited ", "")}`;
  return status;
}

function TerminalView({
  activeProfile,
  appTheme,
  onNotice,
  setPingMs,
  setStatus
}: {
  activeProfile?: TerminalProfile;
  appTheme: Theme;
  onNotice: (message: string) => void;
  setPingMs: (pingMs: number | null) => void;
  setStatus: (status: string) => void;
}) {
  const terminal = useTerminal();
  const socketRef = useRef<WebSocket | null>(null);
  const latestSizeRef = useRef<{ cols: number; rows: number } | null>(null);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const terminalTheme = appTheme === "light" ? "light" : activeProfile?.theme || "monokai";

  const send = (payload: unknown, socket = socketRef.current) => {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
  };

  const flushResize = (socket = socketRef.current) => {
    const size = latestSizeRef.current;
    if (!size) return;
    send({ type: "resize", cols: size.cols, rows: size.rows }, socket);
  };

  const rememberResize = (cols: number, rows: number) => {
    latestSizeRef.current = { cols, rows };
    flushResize();
  };

  useEffect(() => {
    setConnectionAttempt(0);
  }, [activeProfile?.id]);

  useEffect(() => {
    if (!activeProfile) {
      setPingMs(null);
      setStatus("disconnected");
      return;
    }
    let pingInterval = 0;
    let connectTimeout = 0;
    let retryTimeout = 0;
    let disposed = false;
    let opened = false;
    let sawExit = false;

    const clearTimers = () => {
      window.clearInterval(pingInterval);
      window.clearTimeout(connectTimeout);
      window.clearTimeout(retryTimeout);
    };
    const scheduleReconnect = () => {
      if (disposed || sawExit) return;
      retryTimeout = window.setTimeout(() => {
        setConnectionAttempt((attempt) => attempt + 1);
      }, terminalReconnectDelayMs);
    };
    const sendPing = (socket: WebSocket) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping", data: String(Date.now()) }));
      }
    };
    setPingMs(null);
    setStatus("connecting");
    const socket = new WebSocket(
      wsURL(`/api/terminals/ws?profile_id=${encodeURIComponent(activeProfile.id)}&cols=80&rows=24`)
    );
    socketRef.current = socket;
    connectTimeout = window.setTimeout(() => {
      if (socket.readyState !== WebSocket.CONNECTING) return;
      setPingMs(null);
      setStatus("error");
      socket.close();
    }, terminalConnectTimeoutMs);
    socket.onopen = () => {
      opened = true;
      window.clearTimeout(connectTimeout);
      setStatus("connected");
      flushResize(socket);
      window.requestAnimationFrame(() => flushResize(socket));
      sendPing(socket);
      pingInterval = window.setInterval(() => sendPing(socket), 5000);
      terminal.focus();
    };
    socket.onclose = () => {
      clearTimers();
      if (disposed || sawExit) return;
      setPingMs(null);
      setStatus(opened ? "disconnected" : "error");
      scheduleReconnect();
    };
    socket.onerror = () => {
      window.clearTimeout(connectTimeout);
      if (disposed) return;
      setPingMs(null);
      setStatus("error");
    };
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as { type: string; data?: string; code?: number; error?: string };
        if (message.type === "output" && message.data) terminal.write(message.data);
        if (message.type === "pong" && message.data) {
          const sentAt = Number(message.data);
          if (Number.isFinite(sentAt)) setPingMs(Math.max(0, Math.round(Date.now() - sentAt)));
        }
        if (message.type === "exit") {
          sawExit = true;
          setPingMs(null);
          setStatus(`exited ${message.code ?? 0}`);
        }
        if (message.type === "error") {
          setPingMs(null);
          setStatus("error");
          onNotice(message.error ?? "terminal error");
        }
      } catch {
        terminal.write(String(event.data));
      }
    };
    return () => {
      disposed = true;
      clearTimers();
      if (socketRef.current === socket) socketRef.current = null;
      socket.close();
    };
  }, [activeProfile?.id, connectionAttempt]);

  return (
    <section className="view terminal-view">
      <div className="terminal-frame">
        {activeProfile ? (
          <WTerminal
            ref={terminal.ref as RefObject<TerminalHandle>}
            theme={terminalTheme}
            autoResize
            cursorBlink
            onData={(data) => send({ type: "input", data })}
            onReady={(wt) => rememberResize(wt.cols, wt.rows)}
            onResize={rememberResize}
            style={{
              width: "100%",
              height: "100%",
              fontFamily: activeProfile.fontFamily,
              fontSize: activeProfile.fontSize
            }}
          />
        ) : (
          <div className="terminal-empty">Create a terminal profile or run setup to start a shell.</div>
        )}
      </div>
    </section>
  );
}

function ProfilesView({
  onNotice,
  onProfilesChanged
}: {
  onNotice: (message: string) => void;
  onProfilesChanged: () => Promise<void>;
}) {
  const [profiles, setProfiles] = useState<TerminalProfile[]>([]);
  const [editing, setEditing] = useState<TerminalProfile | null>(null);
  const [form, setForm] = useState({
    name: "",
    shellCommand: "",
    cwd: "",
    theme: "monokai",
    fontFamily: "JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 14,
    isDefault: false
  });

  const refresh = async () => setProfiles(await loadProfiles());
  useEffect(() => void refresh(), []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const payload = { ...editing, ...form, args: editing?.args ?? [], env: editing?.env ?? {}, keybindings: {}, wtermSettings: {} };
    if (editing) {
      await api<TerminalProfile>(`/api/profiles/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
      onNotice("Profile updated");
    } else {
      await api<TerminalProfile>("/api/profiles", { method: "POST", body: JSON.stringify(payload) });
      onNotice("Profile created");
    }
    setEditing(null);
    setForm({
      name: "",
      shellCommand: "",
      cwd: "",
      theme: "monokai",
      fontFamily: "JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: 14,
      isDefault: false
    });
    await refresh();
    await onProfilesChanged();
  };

  const edit = (profile: TerminalProfile) => {
    setEditing(profile);
    setForm({
      name: profile.name,
      shellCommand: profile.shellCommand,
      cwd: profile.cwd,
      theme: profile.theme,
      fontFamily: profile.fontFamily,
      fontSize: profile.fontSize,
      isDefault: profile.isDefault
    });
  };

  return (
    <section className="view split-view">
      <header className="view-header">
        <div>
          <h1>Profiles</h1>
          <p>{profiles.length} terminal profiles</p>
        </div>
        <button className="icon-button" onClick={refresh} title="Refresh">
          <span>Refresh</span>
        </button>
      </header>
      <div className="content-grid ssh-grid">
        <div className="list-panel">
          {profiles.length === 0 ? (
            <EmptyState title="No profiles" body="Create a shell profile to start a terminal session." />
          ) : (
            profiles.map((profile) => (
              <article className="item-card" key={profile.id}>
                <button className="item-main" onClick={() => edit(profile)}>
                  <strong>{profile.name}</strong>
                  <span>{[profile.shellCommand, ...profile.args].join(" ")}</span>
                </button>
                {profile.isDefault && <span className="pill">default</span>}
                <button
                  className="icon-button danger"
                  onClick={async () => {
                    await deleteProfile(profile.id, refresh, onNotice);
                    await onProfilesChanged();
                  }}
                  title="Delete"
                >
                  <span>Delete</span>
                </button>
              </article>
            ))
          )}
        </div>
        <form className="edit-panel" onSubmit={save}>
          <h2>{editing ? "Edit Profile" : "New Profile"}</h2>
          <label>
            Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label>
            Shell
            <input
              value={form.shellCommand}
              onChange={(event) => setForm({ ...form, shellCommand: event.target.value })}
              placeholder="/bin/zsh"
              required
            />
          </label>
          <label>
            Directory
            <input value={form.cwd} onChange={(event) => setForm({ ...form, cwd: event.target.value })} />
          </label>
          <div className="form-row">
            <div className="field">
              <span className="field-label">Theme</span>
              <CustomDropdown
                label="Theme"
                onChange={(value) => setForm({ ...form, theme: value })}
                options={profileThemeOptions}
                value={form.theme}
              />
            </div>
            <label>
              Font size
              <input
                type="number"
                min="10"
                max="24"
                value={form.fontSize}
                onChange={(event) => setForm({ ...form, fontSize: Number(event.target.value) })}
              />
            </label>
          </div>
          <label>
            Font family
            <input value={form.fontFamily} onChange={(event) => setForm({ ...form, fontFamily: event.target.value })} />
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) => setForm({ ...form, isDefault: event.target.checked })}
            />
            Default profile
          </label>
          <button className="primary" type="submit">
            <span>{editing ? "Save" : "Create"}</span>
          </button>
        </form>
      </div>
    </section>
  );
}

function SSHView({ onNotice }: { onNotice: (message: string) => void }) {
  const [profiles, setProfiles] = useState<SSHProfile[]>([]);
  const [form, setForm] = useState({ name: "", host: "", user: "", port: 22, identityFile: "", proxyJump: "", notes: "" });
  const [include, setInclude] = useState(false);

  const refresh = async () => {
    const items = await api<SSHProfile[] | null>("/api/ssh");
    setProfiles(Array.isArray(items) ? items : []);
  };
  useEffect(() => void refresh().catch((error: Error) => onNotice(error.message)), []);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    await api<SSHProfile>("/api/ssh", { method: "POST", body: JSON.stringify({ ...form, enabled: true }) });
    setForm({ name: "", host: "", user: "", port: 22, identityFile: "", proxyJump: "", notes: "" });
    onNotice("SSH profile created");
    await refresh();
  };

  const uploadKey = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.set("key", file);
    body.set("name", file.name);
    const result = await api<{ path: string }>("/api/ssh/import-key", { method: "POST", body });
    setForm((current) => ({ ...current, identityFile: result.path }));
    onNotice("Key imported");
  };

  return (
    <section className="view split-view">
      <header className="view-header">
        <div>
          <h1>SSH</h1>
          <p>{profiles.length} SSH profiles</p>
        </div>
        <div className="toolbar">
          <label className="check-row compact">
            <input type="checkbox" checked={include} onChange={(event) => setInclude(event.target.checked)} />
            Include
          </label>
          <button
            className="primary"
            onClick={async () => {
              await api("/api/ssh/write-config", { method: "POST", body: JSON.stringify({ ensureInclude: include }) });
              onNotice("SSH config written");
            }}
          >
            <span>Write</span>
          </button>
        </div>
      </header>
      <div className="content-grid">
        <div className="list-panel">
          {profiles.length === 0 ? (
            <EmptyState title="No SSH profiles" body="Add a host to write managed SSH config entries." />
          ) : (
            profiles.map((profile) => (
              <article className="item-card" key={profile.id}>
                <div className="item-main">
                  <strong>{profile.name}</strong>
                  <span>{profile.user ? `${profile.user}@${profile.host}` : profile.host}:{profile.port}</span>
                </div>
                <button
                  className="icon-button danger"
                  onClick={async () => {
                    await api(`/api/ssh/${profile.id}`, { method: "DELETE" });
                    onNotice("SSH profile deleted");
                    await refresh();
                  }}
                  title="Delete"
                >
                  <span>Delete</span>
                </button>
              </article>
            ))
          )}
        </div>
        <form className="edit-panel ssh-panel" onSubmit={create}>
          <div className="panel-heading">
            <div>
              <h2>New SSH Profile</h2>
              <span>Manual host entry</span>
            </div>
            <span className="pill success">enabled</span>
          </div>

          <div className="form-section">
            <span className="section-label">Connection</span>
            <label>
              Name
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
            <div className="form-row compact-port">
              <label>
                Host
                <input
                  value={form.host}
                  onChange={(event) => setForm({ ...form, host: event.target.value })}
                  placeholder="example.com"
                  required
                />
              </label>
              <label>
                Port
                <input
                  type="number"
                  min="1"
                  max="65535"
                  value={form.port}
                  onChange={(event) => setForm({ ...form, port: Number(event.target.value) })}
                />
              </label>
            </div>
            <label>
              User
              <input value={form.user} onChange={(event) => setForm({ ...form, user: event.target.value })} placeholder="root" />
            </label>
          </div>

          <div className="form-section">
            <span className="section-label">Authentication</span>
            <label>
              Identity
              <span className="input-action-row">
                <input
                  value={form.identityFile}
                  onChange={(event) => setForm({ ...form, identityFile: event.target.value })}
                  placeholder="~/.ssh/id_ed25519"
                />
                <span className="file-control">
                  <span>Import</span>
                  <input type="file" onChange={uploadKey} />
                </span>
              </span>
            </label>
          </div>

          <div className="form-section">
            <span className="section-label">Options</span>
            <label>
              Proxy jump
              <input
                value={form.proxyJump}
                onChange={(event) => setForm({ ...form, proxyJump: event.target.value })}
                placeholder="jump-host"
              />
            </label>
            <label>
              Notes
              <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </label>
          </div>

          <div className="form-actions">
            <button className="primary" type="submit">
              <span>Create profile</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function SetupView({ onNotice }: { onNotice: (message: string) => void }) {
  const [result, setResult] = useState<{ profiles?: TerminalProfile[]; tools?: Tool[]; state?: Record<string, unknown> } | null>(null);
  return (
    <section className="view narrow-view">
      <header className="view-header">
        <div>
          <h1>Setup</h1>
          <p>Shells, tmux, SSH, and agent launch profiles</p>
        </div>
      </header>
      <div className="action-band">
        <button
          className="primary large"
          onClick={async () => {
            const data = await api<typeof result>("/api/setup/run", { method: "POST" });
            setResult(data);
            onNotice("Setup complete");
          }}
        >
          <span>Run Setup</span>
        </button>
      </div>
      {result && (
        <div className="summary-grid">
          <div>
            <strong>{result.profiles?.length ?? 0}</strong>
            <span>profiles</span>
          </div>
          <div>
            <strong>{result.tools?.filter((tool) => tool.installed).length ?? 0}</strong>
            <span>installed tools</span>
          </div>
        </div>
      )}
    </section>
  );
}

function ToolsView({ onNotice }: { onNotice: (message: string) => void }) {
  const [toolsState, setToolsState] = useState<Tool[]>([]);
  const refresh = async () => setToolsState(await api<Tool[]>("/api/tools"));
  useEffect(() => void refresh(), []);

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Tools</h1>
          <p>{toolsState.filter((tool) => tool.installed).length} installed</p>
        </div>
        <button className="icon-button" onClick={refresh} title="Refresh">
          <span>Refresh</span>
        </button>
      </header>
      <div className="tool-grid">
        {toolsState.length === 0 ? (
          <EmptyState title="No tools detected" body="Refresh tool detection to populate local agent utilities." />
        ) : (
          toolsState.map((tool) => (
            <article className="tool-card" key={tool.name}>
              <div>
                <strong>{tool.displayName}</strong>
                <span>{tool.version || tool.binary}</span>
              </div>
              <span className={tool.installed ? "pill success" : "pill"}>{tool.installed ? "installed" : tool.category}</span>
              {tool.installCommands[0] && !tool.installed && (
                <button
                  className="secondary"
                  onClick={async () => {
                    const command = tool.installCommands[0].args.join(" ");
                    if (!window.confirm(`Run ${command}?`)) return;
                    await api(`/api/tools/${tool.name}/install`, { method: "POST", body: JSON.stringify({ commandIndex: 0 }) });
                    onNotice(`${tool.displayName} installed`);
                    await refresh();
                  }}
                >
                  <span>Install</span>
                </button>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function SettingsView({ onNotice }: { onNotice: (message: string) => void }) {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  useEffect(() => void api<SettingsResponse>("/api/settings").then(setSettings), []);

  const importBundle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await api("/api/sync/import", { method: "POST", body: await file.text() });
    onNotice("Sync bundle imported");
  };

  return (
    <section className="view narrow-view">
      <header className="view-header">
        <div>
          <h1>Settings</h1>
          <p>{settings?.paths?.dbPath ?? ""}</p>
        </div>
      </header>
      <div className="settings-list">
        {settings &&
          Object.entries(settings.paths).map(([key, value]) => (
            <div className="setting-row" key={key}>
              <span>{key}</span>
              <code>{value}</code>
            </div>
          ))}
      </div>
      <div className="button-row">
        <a className="primary link-button" href="/api/sync/export">
          <span>Export</span>
        </a>
        <label className="secondary file-control inline">
          <span>Import</span>
          <input type="file" accept="application/json,.json" onChange={importBundle} />
        </label>
      </div>
    </section>
  );
}

async function loadProfiles() {
  return await api<TerminalProfile[]>("/api/profiles");
}

async function deleteProfile(id: string, refresh: () => Promise<void>, onNotice: (message: string) => void) {
  await api(`/api/profiles/${id}`, { method: "DELETE" });
  onNotice("Profile deleted");
  await refresh();
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{body}</span>
    </div>
  );
}

function CustomDropdown({
  className = "",
  disabled = false,
  label,
  onChange,
  options,
  value
}: {
  className?: string;
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxID = useId();
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selectedOption = options[selectedIndex] ?? options[0];

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const focusOption = (index: number) => {
    window.requestAnimationFrame(() => optionRefs.current[index]?.focus());
  };

  const openAndFocus = (index: number) => {
    if (disabled) return;
    setOpen(true);
    focusOption(index);
  };

  const selectOption = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const handleButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openAndFocus(selectedIndex);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      openAndFocus(Math.max(0, selectedIndex - 1));
    }
  };

  const handleOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number, optionValue: string) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(Math.min(options.length - 1, index + 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(Math.max(0, index - 1));
    }
    if (event.key === "Home") {
      event.preventDefault();
      focusOption(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      focusOption(options.length - 1);
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectOption(optionValue);
    }
  };

  return (
    <div className={`dropdown ${className}`} ref={dropdownRef}>
      <button
        aria-controls={listboxID}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        className="dropdown-trigger"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleButtonKeyDown}
        ref={buttonRef}
        title={label}
        type="button"
      >
        <span>{selectedOption?.label ?? label}</span>
        <span className="dropdown-chevron" aria-hidden="true" />
      </button>
      {open && (
        <div className="dropdown-menu" id={listboxID} role="listbox" aria-label={label}>
          {options.map((option, index) => (
            <button
              aria-selected={option.value === value}
              className={option.value === value ? "dropdown-option active" : "dropdown-option"}
              key={option.value}
              onClick={() => selectOption(option.value)}
              onKeyDown={(event) => handleOptionKeyDown(event, index, option.value)}
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              role="option"
              tabIndex={open ? 0 : -1}
              type="button"
            >
              <span>{option.label}</span>
              {option.value === value && <span className="dropdown-check" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
