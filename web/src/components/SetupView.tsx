import { useEffect, useState } from "react";
import { api } from "../api";
import type { DoctorResponse, TerminalProfile, Tool } from "../types";

export function SetupView({ onNotice }: { onNotice: (message: string) => void }) {
  const [isRunning, setIsRunning] = useState(false);
  const [doctorData, setDoctorData] = useState<DoctorResponse | null>(null);
  const [setupResult, setSetupResult] = useState<{
    profiles?: TerminalProfile[];
    tools?: Tool[];
    state?: Record<string, unknown>;
  } | null>(null);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);

  const loadDoctor = async () => {
    try {
      const data = await api<DoctorResponse>("/api/doctor");
      setDoctorData(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void loadDoctor();
  }, []);

  const runSetup = async () => {
    setIsRunning(true);
    const logs: string[] = [];
    logs.push(`[${new Date().toLocaleTimeString()}] Starting automated setup...`);
    logs.push(`[${new Date().toLocaleTimeString()}] Inspecting host environment and login shells...`);

    try {
      const data = await api<{
        profiles?: TerminalProfile[];
        tools?: Tool[];
        state?: Record<string, unknown>;
      }>("/api/setup/run", { method: "POST" });

      setSetupResult(data);
      logs.push(`[${new Date().toLocaleTimeString()}] Generated default shell profiles (${data.profiles?.length ?? 0} profiles total).`);
      logs.push(`[${new Date().toLocaleTimeString()}] Scanned catalog tools: ${data.tools?.filter((t) => t.installed).length ?? 0} installed tools detected.`);
      logs.push(`[${new Date().toLocaleTimeString()}] Setup completed successfully.`);
      setExecutionLogs(logs);
      onNotice("System setup and profile provisioning completed");
      await loadDoctor();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Setup failed";
      logs.push(`[${new Date().toLocaleTimeString()}] Error: ${msg}`);
      setExecutionLogs(logs);
      onNotice(`Setup failed: ${msg}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="view setup-view">
      <header className="view-header">
        <div>
          <h1>System Setup & Onboarding</h1>
          <p>Automated shell discovery, AI agent profiles, and SSH configuration</p>
        </div>
        <div className="toolbar">
          <button
            type="button"
            className="primary large"
            disabled={isRunning}
            onClick={runSetup}
          >
            <span>{isRunning ? "Provisioning..." : "Run Complete Setup"}</span>
          </button>
        </div>
      </header>

      {/* Setup Diagnostic Categories Grid */}
      <div className="setup-grid">
        {/* Category 1: Shells */}
        <div className="setup-card">
          <div className="setup-card-header">
            <strong>1. Interactive Shells</strong>
            <span className="pill success">Auto-detected</span>
          </div>
          <p className="setup-card-desc">
            Discovers local login shells and generates initial terminal profiles.
          </p>
          <div className="setup-item-list">
            {doctorData?.shells ? (
              Object.entries(doctorData.shells).map(([sh, present]) => (
                <div key={sh} className="setup-check-row">
                  <span className={`status-indicator-dot ${present ? "connected" : "exited"}`} />
                  <code>{sh}</code>
                  <span className="item-meta">{present ? "Available on PATH" : "Not installed"}</span>
                </div>
              ))
            ) : (
              <div className="item-meta">Scanning available shells...</div>
            )}
          </div>
        </div>

        {/* Category 2: AI Agents & Tools */}
        <div className="setup-card">
          <div className="setup-card-header">
            <strong>2. AI Coding Agents & CLI</strong>
            <span className="pill">Catalog</span>
          </div>
          <p className="setup-card-desc">
            Identifies Claude Code, OpenAI Codex, OpenCode, Pi, and tmux multiplexer.
          </p>
          <div className="setup-item-list">
            {doctorData?.tools ? (
              doctorData.tools.slice(0, 5).map((tool) => (
                <div key={tool.name} className="setup-check-row">
                  <span className={`status-indicator-dot ${tool.installed ? "connected" : "exited"}`} />
                  <strong>{tool.displayName}</strong>
                  <span className="item-meta">{tool.installed ? `v${tool.version || "ok"}` : "Uninstalled"}</span>
                </div>
              ))
            ) : (
              <div className="item-meta">Inspecting local tools...</div>
            )}
          </div>
        </div>

        {/* Category 3: SSH Configuration */}
        <div className="setup-card">
          <div className="setup-card-header">
            <strong>3. SSH Infrastructure</strong>
            <span className="pill">Isolated</span>
          </div>
          <p className="setup-card-desc">
            Manages secure key store directory and include directive in ~/.ssh/config.
          </p>
          <div className="setup-item-list">
            <div className="setup-check-row">
              <span className={`status-indicator-dot ${doctorData?.sshStatus?.userConfigExists ? "connected" : "connecting"}`} />
              <span>User SSH Config (~/.ssh/config)</span>
            </div>
            <div className="setup-check-row">
              <span className={`status-indicator-dot ${doctorData?.sshStatus?.managedConfigExists ? "connected" : "connecting"}`} />
              <span>Managed Snippet (~/.ssh/open-termkit/config)</span>
            </div>
            <div className="setup-check-row">
              <span className="status-indicator-dot connected" />
              <span>Managed Keys: {doctorData?.sshStatus?.managedKeysCount ?? 0} private keys</span>
            </div>
          </div>
        </div>

        {/* Category 4: Storage */}
        <div className="setup-card">
          <div className="setup-card-header">
            <strong>4. SQLite Storage Engine</strong>
            <span className="pill success">Local-First</span>
          </div>
          <p className="setup-card-desc">
            Zero-configuration local SQLite database for profiles and settings.
          </p>
          <div className="setup-item-list">
            <div className="setup-check-row">
              <span className="status-indicator-dot connected" />
              <span>DB Path: <code>{doctorData?.paths?.dbPath ?? "~/.open-termkit/open-termkit.db"}</code></span>
            </div>
            <div className="setup-check-row">
              <span className="status-indicator-dot connected" />
              <span>File Size: {doctorData?.database?.sizeBytes ? `${Math.round(doctorData.database.sizeBytes / 1024)} KB` : "Active"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      {setupResult && (
        <div className="summary-grid">
          <div>
            <strong>{setupResult.profiles?.length ?? 0}</strong>
            <span>Active Profiles</span>
          </div>
          <div>
            <strong>{setupResult.tools?.filter((t) => t.installed).length ?? 0}</strong>
            <span>Installed Utilities</span>
          </div>
          <div>
            <strong>{doctorData?.sshProfilesCount ?? 0}</strong>
            <span>SSH Hosts</span>
          </div>
        </div>
      )}

      {/* Execution Logs */}
      {executionLogs.length > 0 && (
        <div className="setup-logs-card">
          <div className="logs-header">
            <strong>Execution Log</strong>
          </div>
          <pre className="logs-body">
            <code>{executionLogs.join("\n")}</code>
          </pre>
        </div>
      )}
    </section>
  );
}
