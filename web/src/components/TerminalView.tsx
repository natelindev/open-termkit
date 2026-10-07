import { FormEvent, type KeyboardEvent, type MouseEvent, type RefObject, useEffect, useId, useMemo, useRef, useState } from "react";
import { Terminal as WTerminal, useTerminal } from "@wterm/react";
import type { TerminalHandle } from "@wterm/react";
import { wsURL } from "../api";
import type { TerminalProfile, TerminalTab } from "../types";

const defaultTerminalTheme = "monokai";
const terminalConnectTimeoutMs = 8000;
const terminalReconnectDelayMs = 1500;

export function TerminalView({
  tabs,
  activeTabId,
  profiles,
  onAddTab,
  onCloseTab,
  onSelectTab,
  onRenameTab,
  onNotice
}: {
  tabs: TerminalTab[];
  activeTabId: string;
  profiles: TerminalProfile[];
  onAddTab: (profileId?: string) => void;
  onCloseTab: (tabId: string) => void;
  onSelectTab: (tabId: string) => void;
  onRenameTab: (tabId: string, newTitle: string) => void;
  onNotice: (message: string) => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  // Close profile menu on outside click
  useEffect(() => {
    if (!showProfileMenu) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showProfileMenu]);

  const handleStartRename = (tab: TerminalTab) => {
    setEditingTabId(tab.id);
    setEditingTitle(tab.title);
  };

  const handleSaveRename = (tabId: string) => {
    if (editingTitle.trim()) {
      onRenameTab(tabId, editingTitle.trim());
    }
    setEditingTabId(null);
  };

  return (
    <section className={`view terminal-workspace-view ${isFullscreen ? "fullscreen-active" : ""}`}>
      {/* Multi-Tab Bar */}
      <div className="terminal-tabbar" role="tablist" aria-label="Terminal Tabs">
        <div className="terminal-tabs-scroll">
          {tabs.map((tab) => {
            const isTabActive = tab.id === activeTabId;
            const profile = profiles.find((p) => p.id === tab.profileId);
            return (
              <div
                key={tab.id}
                role="tab"
                aria-selected={isTabActive}
                className={`terminal-tab-item ${isTabActive ? "active" : ""}`}
                onClick={() => onSelectTab(tab.id)}
              >
                <span className="tab-status-dot connected" aria-hidden="true" />
                {editingTabId === tab.id ? (
                  <input
                    type="text"
                    className="tab-rename-input"
                    value={editingTitle}
                    autoFocus
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleSaveRename(tab.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveRename(tab.id);
                      if (e.key === "Escape") setEditingTabId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="tab-title"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(tab);
                    }}
                    title={`${tab.title} (${profile?.name ?? "Profile"}) - Double click to rename`}
                  >
                    {tab.title}
                  </span>
                )}
                {tabs.length > 1 && (
                  <button
                    type="button"
                    className="tab-close-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                    title="Close session"
                    aria-label={`Close ${tab.title}`}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Tab Actions */}
        <div className="terminal-tab-actions" ref={profileMenuRef}>
          <button
            type="button"
            className="tab-add-button"
            onClick={() => onAddTab()}
            title="New terminal tab (default profile)"
            aria-label="New terminal tab"
          >
            <span>+</span>
          </button>
          <button
            type="button"
            className="tab-menu-button"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            title="Choose profile for new tab"
            aria-label="Choose profile for new tab"
            aria-expanded={showProfileMenu}
          >
            <span className="dropdown-chevron-small" aria-hidden="true" />
          </button>

          {showProfileMenu && (
            <div className="tab-profile-dropdown" role="menu">
              <span className="dropdown-header">Launch Profile</span>
              {profiles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="dropdown-menu-item"
                  onClick={() => {
                    onAddTab(p.id);
                    setShowProfileMenu(false);
                  }}
                >
                  <span className="item-name">{p.name}</span>
                  <span className="item-command">{p.shellCommand}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Terminal Viewports Container */}
      <div className="terminal-frame-container">
        {tabs.map((tab) => {
          const profile = profiles.find((p) => p.id === tab.profileId) ?? profiles[0];
          return (
            <TabTerminalSession
              key={tab.id}
              tab={tab}
              profile={profile}
              isActive={tab.id === activeTabId}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
              onNotice={onNotice}
            />
          );
        })}
      </div>
    </section>
  );
}

function TabTerminalSession({
  tab,
  profile,
  isActive,
  isFullscreen,
  onToggleFullscreen,
  onNotice
}: {
  tab: TerminalTab;
  profile?: TerminalProfile;
  isActive: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onNotice: (message: string) => void;
}) {
  const terminal = useTerminal();
  const terminalRef = terminal.ref as RefObject<TerminalHandle>;
  const socketRef = useRef<WebSocket | null>(null);
  const latestSizeRef = useRef<{ cols: number; rows: number } | null>(null);
  const [followOutput, setFollowOutput] = useState(tab.followOutput);
  const followOutputRef = useRef(followOutput);
  const [fontSize, setFontSize] = useState(tab.fontSize || profile?.fontSize || 14);
  const [terminalStatus, setTerminalStatus] = useState("disconnected");
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [connectionAttempt, setConnectionAttempt] = useState(0);

  const followScrollTimerRef = useRef(0);
  const followScrollRafRef = useRef(0);

  const terminalTheme = profile?.theme || defaultTerminalTheme;

  const scrollElementToBottom = (element: Element | null | undefined, alignToTerminalRows = false) => {
    if (!(element instanceof HTMLElement)) return;
    if (alignToTerminalRows) {
      const maxScroll = element.scrollHeight - element.clientHeight;
      const rowHeight = Number.parseFloat(getComputedStyle(element).getPropertyValue("--term-row-height"));
      element.scrollTop = rowHeight > 0 ? Math.floor(maxScroll / rowHeight) * rowHeight : maxScroll;
      return;
    }
    element.scrollTop = element.scrollHeight;
  };

  const scrollFollowTargetsToBottom = () => {
    const terminalElement = terminalRef.current?.instance?.element;
    scrollElementToBottom(terminalElement, true);
    terminalElement?.scrollIntoView({ block: "end", inline: "nearest" });
    scrollElementToBottom(terminalElement?.closest(".workspace"));
    scrollElementToBottom(document.scrollingElement);
  };

  const scheduleFollowScroll = () => {
    if (!followOutputRef.current || followScrollTimerRef.current !== 0 || followScrollRafRef.current !== 0) return;
    followScrollTimerRef.current = window.setTimeout(() => {
      followScrollTimerRef.current = 0;
      if (!followOutputRef.current) return;
      followScrollRafRef.current = window.requestAnimationFrame(() => {
        if (!followOutputRef.current) {
          followScrollRafRef.current = 0;
          return;
        }
        followScrollRafRef.current = window.requestAnimationFrame(() => {
          followScrollRafRef.current = 0;
          if (followOutputRef.current) scrollFollowTargetsToBottom();
        });
      });
    }, 0);
  };

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
    scheduleFollowScroll();
  };

  const restartSession = () => {
    socketRef.current?.close();
    setConnectionAttempt((attempt) => attempt + 1);
    onNotice(`Session restarted: ${tab.title}`);
  };

  const clearTerminal = () => {
    // Send form-feed (Ctrl+L) to clear shell screen
    send({ type: "input", data: "\x0c" });
  };

  useEffect(() => {
    followOutputRef.current = followOutput;
    if (followOutput) {
      scheduleFollowScroll();
    } else {
      window.clearTimeout(followScrollTimerRef.current);
      window.cancelAnimationFrame(followScrollRafRef.current);
    }
  }, [followOutput]);

  // When tab becomes active, focus terminal and trigger resize
  useEffect(() => {
    if (isActive) {
      window.requestAnimationFrame(() => {
        terminal.focus();
        flushResize();
      });
    }
  }, [isActive]);

  // WebSocket lifecycle
  useEffect(() => {
    if (!profile) {
      setPingMs(null);
      setTerminalStatus("disconnected");
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
    setTerminalStatus("connecting");
    const socket = new WebSocket(
      wsURL(`/api/terminals/ws?profile_id=${encodeURIComponent(profile.id)}&cols=80&rows=24`)
    );
    socketRef.current = socket;

    connectTimeout = window.setTimeout(() => {
      if (socket.readyState !== WebSocket.CONNECTING) return;
      setPingMs(null);
      setTerminalStatus("error");
      socket.close();
    }, terminalConnectTimeoutMs);

    socket.onopen = () => {
      opened = true;
      window.clearTimeout(connectTimeout);
      setTerminalStatus("connected");
      flushResize(socket);
      window.requestAnimationFrame(() => flushResize(socket));
      sendPing(socket);
      pingInterval = window.setInterval(() => sendPing(socket), 5000);
      if (isActive) terminal.focus();
    };

    socket.onclose = () => {
      clearTimers();
      if (disposed || sawExit) return;
      setPingMs(null);
      setTerminalStatus(opened ? "disconnected" : "error");
      scheduleReconnect();
    };

    socket.onerror = () => {
      window.clearTimeout(connectTimeout);
      if (disposed) return;
      setPingMs(null);
      setTerminalStatus("error");
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as { type: string; data?: string; code?: number; error?: string };
        if (message.type === "output" && message.data) {
          terminal.write(message.data);
          scheduleFollowScroll();
        }
        if (message.type === "pong" && message.data) {
          const sentAt = Number(message.data);
          if (Number.isFinite(sentAt)) setPingMs(Math.max(0, Math.round(Date.now() - sentAt)));
        }
        if (message.type === "exit") {
          sawExit = true;
          setPingMs(null);
          setTerminalStatus(`exited (${message.code ?? 0})`);
        }
        if (message.type === "error") {
          setPingMs(null);
          setTerminalStatus("error");
          onNotice(message.error ?? "Terminal error");
        }
      } catch {
        terminal.write(String(event.data));
        scheduleFollowScroll();
      }
    };

    return () => {
      disposed = true;
      clearTimers();
      if (socketRef.current === socket) socketRef.current = null;
      socket.close();
    };
  }, [profile?.id, connectionAttempt]);

  return (
    <div
      className={`tab-terminal-panel ${isActive ? "active" : "hidden"}`}
      style={{ display: isActive ? "flex" : "none" }}
    >
      {/* Per-Tab Toolbar */}
      <div className="terminal-session-bar">
        <div className="session-left">
          <span className="session-profile-badge">{profile?.name ?? "Terminal"}</span>
          <span className={`session-status-badge ${terminalStatus}`}>
            <span className="status-indicator-dot" aria-hidden="true" />
            <span>{terminalStatus}</span>
            {pingMs != null && <span className="ping-tag">{pingMs}ms</span>}
          </span>
        </div>

        <div className="session-controls">
          <button
            type="button"
            className="session-action-btn"
            onClick={clearTerminal}
            title="Clear screen (Ctrl+L)"
          >
            <span>Clear</span>
          </button>
          <button
            type="button"
            className="session-action-btn"
            onClick={restartSession}
            title="Restart terminal process"
          >
            <span>Restart</span>
          </button>
          <div className="font-scaling-group">
            <button
              type="button"
              className="session-action-btn compact"
              onClick={() => setFontSize((s) => Math.max(10, s - 1))}
              title="Decrease font size"
            >
              <span>A-</span>
            </button>
            <span className="font-size-label">{fontSize}px</span>
            <button
              type="button"
              className="session-action-btn compact"
              onClick={() => setFontSize((s) => Math.min(24, s + 1))}
              title="Increase font size"
            >
              <span>A+</span>
            </button>
          </div>
          <button
            type="button"
            className={`session-action-btn ${followOutput ? "active" : ""}`}
            onClick={() => setFollowOutput((prev) => !prev)}
            title={followOutput ? "Output follow locked" : "Output follow unlocked"}
          >
            <span>{followOutput ? "Follow: On" : "Follow: Off"}</span>
          </button>
          <button
            type="button"
            className="session-action-btn"
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Zen fullscreen mode"}
          >
            <span>{isFullscreen ? "Exit Zen" : "Zen Mode"}</span>
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="terminal-frame">
        {profile ? (
          <WTerminal
            ref={terminalRef}
            theme={terminalTheme}
            autoResize
            cursorBlink
            onData={(data) => send({ type: "input", data })}
            onReady={(wt) => rememberResize(wt.cols, wt.rows)}
            onResize={rememberResize}
            style={{
              width: "100%",
              height: "100%",
              fontFamily: profile.fontFamily,
              fontSize
            }}
          />
        ) : (
          <div className="terminal-empty">Create a terminal profile or run setup to start a shell.</div>
        )}
      </div>
    </div>
  );
}
