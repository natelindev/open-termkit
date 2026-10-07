import { useEffect, useMemo, useRef, useState } from "react";
import type { SSHProfile, TerminalProfile, TerminalTab, Tool } from "../types";

export type PaletteItem = {
  id: string;
  category: "Navigation" | "Tabs" | "Profiles" | "SSH Hosts" | "Tools" | "Actions";
  title: string;
  subtitle?: string;
  action: () => void;
  shortcut?: string;
};

export function CommandPalette({
  isOpen,
  onClose,
  tabs,
  activeTabId,
  profiles,
  sshProfiles,
  tools,
  onSwitchTab,
  onNewTabWithProfile,
  onConnectSSH,
  onLaunchTool,
  onNavigate,
  onToggleTheme
}: {
  isOpen: boolean;
  onClose: () => void;
  tabs: TerminalTab[];
  activeTabId: string;
  profiles: TerminalProfile[];
  sshProfiles: SSHProfile[];
  tools: Tool[];
  onSwitchTab: (tabId: string) => void;
  onNewTabWithProfile: (profileId: string) => void;
  onConnectSSH: (ssh: SSHProfile) => void;
  onLaunchTool: (tool: Tool) => void;
  onNavigate: (view: "terminal" | "profiles" | "ssh" | "setup" | "tools" | "settings" | "docs") => void;
  onToggleTheme: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const items = useMemo<PaletteItem[]>(() => {
    const list: PaletteItem[] = [
      {
        id: "nav-terminal",
        category: "Navigation",
        title: "Go to Terminal",
        action: () => onNavigate("terminal"),
        shortcut: "G T"
      },
      {
        id: "nav-profiles",
        category: "Navigation",
        title: "Go to Profiles",
        action: () => onNavigate("profiles"),
        shortcut: "G P"
      },
      {
        id: "nav-ssh",
        category: "Navigation",
        title: "Go to SSH Manager",
        action: () => onNavigate("ssh"),
        shortcut: "G S"
      },
      {
        id: "nav-tools",
        category: "Navigation",
        title: "Go to Tools Catalog",
        action: () => onNavigate("tools"),
        shortcut: "G O"
      },
      {
        id: "nav-setup",
        category: "Navigation",
        title: "Go to Setup & Onboarding",
        action: () => onNavigate("setup"),
        shortcut: "G U"
      },
      {
        id: "nav-settings",
        category: "Navigation",
        title: "Go to Settings & Diagnostics",
        action: () => onNavigate("settings"),
        shortcut: "G E"
      },
      {
        id: "nav-docs",
        category: "Navigation",
        title: "Go to Documentation & Tutorials",
        action: () => onNavigate("docs"),
        shortcut: "G D"
      },
      {
        id: "act-theme",
        category: "Actions",
        title: "Toggle Light / Dark Theme",
        action: onToggleTheme
      }
    ];

    // Open Tabs
    tabs.forEach((tab) => {
      list.push({
        id: `tab-${tab.id}`,
        category: "Tabs",
        title: `Switch to Tab: ${tab.title}`,
        subtitle: tab.id === activeTabId ? "Current active tab" : undefined,
        action: () => {
          onSwitchTab(tab.id);
          onNavigate("terminal");
        }
      });
    });

    // Launch with Profile
    profiles.forEach((profile) => {
      list.push({
        id: `prof-${profile.id}`,
        category: "Profiles",
        title: `New Terminal: ${profile.name}`,
        subtitle: `${profile.shellCommand} ${profile.args.join(" ")}`.trim(),
        action: () => {
          onNewTabWithProfile(profile.id);
          onNavigate("terminal");
        }
      });
    });

    // Connect SSH
    sshProfiles.forEach((ssh) => {
      list.push({
        id: `ssh-${ssh.id}`,
        category: "SSH Hosts",
        title: `Connect SSH: ${ssh.name}`,
        subtitle: `${ssh.user ? `${ssh.user}@` : ""}${ssh.host}:${ssh.port}`,
        action: () => {
          onConnectSSH(ssh);
        }
      });
    });

    // Launch Tools
    tools
      .filter((t) => t.installed)
      .forEach((tool) => {
        list.push({
          id: `tool-${tool.name}`,
          category: "Tools",
          title: `Launch ${tool.displayName}`,
          subtitle: tool.binary,
          action: () => {
            onLaunchTool(tool);
          }
        });
      });

    return list;
  }, [
    tabs,
    activeTabId,
    profiles,
    sshProfiles,
    tools,
    onNavigate,
    onSwitchTab,
    onNewTabWithProfile,
    onConnectSSH,
    onLaunchTool,
    onToggleTheme
  ]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  }, [items, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        selected.action();
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="palette-backdrop" onClick={onClose} role="presentation">
      <div
        className="palette-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
      >
        <div className="palette-header">
          <span className="palette-search-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder="Type a command, search tabs, tools, SSH hosts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="palette-esc-badge" onClick={onClose}>ESC</kbd>
        </div>

        <div className="palette-list" role="listbox">
          {filteredItems.length === 0 ? (
            <div className="palette-empty">No matching commands found.</div>
          ) : (
            filteredItems.map((item, index) => (
              <div
                key={item.id}
                role="option"
                aria-selected={index === selectedIndex}
                className={`palette-item ${index === selectedIndex ? "selected" : ""}`}
                onClick={() => {
                  item.action();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="palette-item-main">
                  <span className="palette-item-category">{item.category}</span>
                  <span className="palette-item-title">{item.title}</span>
                  {item.subtitle && <span className="palette-item-subtitle">{item.subtitle}</span>}
                </div>
                {item.shortcut && <kbd className="palette-item-shortcut">{item.shortcut}</kbd>}
              </div>
            ))
          )}
        </div>

        <footer className="palette-footer">
          <span>↑↓ to navigate</span>
          <span>↵ to select</span>
          <span>ESC to close</span>
        </footer>
      </div>
    </div>
  );
}
