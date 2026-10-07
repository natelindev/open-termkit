import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { InstallCommand, Tool } from "../types";

export function ToolsView({
  onLaunchTool,
  onNotice
}: {
  onLaunchTool: (tool: Tool) => Promise<void>;
  onNotice: (message: string) => void;
}) {
  const [toolsState, setToolsState] = useState<Tool[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // In-app install confirmation modal
  const [confirmTool, setConfirmTool] = useState<{ tool: Tool; commandIndex: number; command: InstallCommand } | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<{ toolName: string; output: string } | null>(null);

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await api<Tool[]>("/api/tools");
      setToolsState(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load tools";
      onNotice(msg);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    toolsState.forEach((t) => cats.add(t.category));
    return ["all", ...Array.from(cats)];
  }, [toolsState]);

  const filteredTools = useMemo(() => {
    let list = toolsState;
    if (selectedCategory !== "all") {
      list = list.filter((t) => t.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.displayName.toLowerCase().includes(q) ||
          t.binary.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [toolsState, selectedCategory, searchQuery]);

  const installedCount = toolsState.filter((tool) => tool.installed).length;
  const installableCount = toolsState.filter((tool) => !tool.installed && tool.installCommands.length > 0).length;

  const handleInstallConfirm = async () => {
    if (!confirmTool) return;
    setIsInstalling(true);
    try {
      const res = await api<{ output: string; tool: Tool }>(
        `/api/tools/${confirmTool.tool.name}/install`,
        {
          method: "POST",
          body: JSON.stringify({ commandIndex: confirmTool.commandIndex })
        }
      );
      setInstallResult({ toolName: confirmTool.tool.displayName, output: res.output || "Installation completed successfully." });
      onNotice(`${confirmTool.tool.displayName} installed successfully`);
      await refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Installation failed";
      setInstallResult({ toolName: confirmTool.tool.displayName, output: `Error: ${msg}` });
      onNotice(`Install error: ${msg}`);
    } finally {
      setIsInstalling(false);
      setConfirmTool(null);
    }
  };

  return (
    <section className="view tools-view">
      <header className="view-header tools-header">
        <div>
          <h1>Tools & Agents Catalog</h1>
          <p>Local terminal multiplexers, developer utilities, and AI coding agents</p>
        </div>
        <div className="tool-header-actions">
          <div className="tool-stats">
            <span><strong>{installedCount}</strong> installed</span>
            <span><strong>{installableCount}</strong> installable</span>
          </div>
          <button
            type="button"
            className="secondary compact-button"
            disabled={isRefreshing}
            onClick={refresh}
          >
            <span>{isRefreshing ? "Scanning..." : "Scan Tools"}</span>
          </button>
        </div>
      </header>

      {/* Filter and Category Bar */}
      <div className="tool-toolbar">
        <div className="category-chips">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-chip ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              <span>{cat === "all" ? "All Tools" : cat}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Filter tools by name, binary..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="tool-search-input"
        />
      </div>

      <div className="tool-grid">
        {filteredTools.length === 0 ? (
          <div className="empty-state">
            <strong>No tools matched</strong>
            <span>Try refreshing tool detection or clear your filter.</span>
          </div>
        ) : (
          filteredTools.map((tool) => {
            const installCommand = tool.installCommands[0];
            const launchCommand = tool.profileCommand.length > 0 ? tool.profileCommand.join(" ") : tool.binary;

            return (
              <article
                className={`tool-card ${tool.installed ? "installed" : "missing"}`}
                key={tool.name}
              >
                <header className="tool-card-header">
                  <span className="tool-icon" aria-hidden="true">
                    {toolInitials(tool.displayName)}
                  </span>
                  <div className="tool-title">
                    <strong title={tool.displayName}>{tool.displayName}</strong>
                    <span title={tool.binary}>{tool.binary}</span>
                  </div>
                  <span className={`pill ${tool.installed ? "success" : ""}`}>
                    {tool.installed ? "installed" : "not installed"}
                  </span>
                </header>

                <div className="tool-meta-grid">
                  <div className="tool-meta">
                    <span>Version</span>
                    <code title={tool.version || "Not detected"}>{tool.version || "Not detected"}</code>
                  </div>
                  <div className="tool-meta">
                    <span>Category</span>
                    <code>{tool.category}</code>
                  </div>
                  <div className="tool-meta wide">
                    <span>Launch Command</span>
                    <code title={launchCommand}>{launchCommand}</code>
                  </div>
                </div>

                {tool.installed ? (
                  <div className="tool-card-footer launch">
                    <button
                      type="button"
                      className="primary tool-launch-button"
                      onClick={() => void onLaunchTool(tool).catch((err: Error) => onNotice(err.message))}
                    >
                      <span>Launch in Terminal</span>
                    </button>
                  </div>
                ) : installCommand ? (
                  <div className="tool-card-footer installable">
                    <button
                      type="button"
                      className="secondary tool-install-btn"
                      onClick={() =>
                        setConfirmTool({
                          tool,
                          commandIndex: 0,
                          command: installCommand
                        })
                      }
                    >
                      <span>Install ({installCommand.label})</span>
                    </button>
                  </div>
                ) : (
                  <div className="tool-card-footer unavailable">
                    <span>No installer package available for this OS.</span>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* In-App Confirmation Modal (Replaces browser window.confirm) */}
      {confirmTool && (
        <div className="palette-backdrop" onClick={() => !isInstalling && setConfirmTool(null)}>
          <div
            className="in-app-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Install ${confirmTool.tool.displayName}`}
          >
            <div className="dialog-header">
              <h2>Install {confirmTool.tool.displayName}</h2>
              <button
                type="button"
                className="tab-close-button"
                disabled={isInstalling}
                onClick={() => setConfirmTool(null)}
              >
                ×
              </button>
            </div>

            <div className="dialog-body">
              <p className="dialog-desc">
                Execute the package installer for <strong>{confirmTool.tool.displayName}</strong> on your local machine:
              </p>
              <pre className="install-cmd-block">
                <code>{confirmTool.command.args.join(" ")}</code>
              </pre>
            </div>

            <div className="dialog-footer">
              <button
                type="button"
                className="secondary"
                disabled={isInstalling}
                onClick={() => setConfirmTool(null)}
              >
                <span>Cancel</span>
              </button>
              <button
                type="button"
                className="primary"
                disabled={isInstalling}
                onClick={handleInstallConfirm}
              >
                <span>{isInstalling ? "Running Installer..." : "Run Install"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Installation Log Output Modal */}
      {installResult && (
        <div className="palette-backdrop" onClick={() => setInstallResult(null)}>
          <div
            className="in-app-dialog large"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Installation Logs"
          >
            <div className="dialog-header">
              <h2>Installation Output: {installResult.toolName}</h2>
              <button
                type="button"
                className="tab-close-button"
                onClick={() => setInstallResult(null)}
              >
                ×
              </button>
            </div>

            <div className="dialog-body">
              <pre className="install-log-viewport">
                <code>{installResult.output}</code>
              </pre>
            </div>

            <div className="dialog-footer">
              <button
                type="button"
                className="primary"
                onClick={() => setInstallResult(null)}
              >
                <span>Dismiss</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function toolInitials(label: string) {
  const parts = label.split(/[\s-]+/).filter(Boolean);
  if (parts.length === 0) return "T";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}
