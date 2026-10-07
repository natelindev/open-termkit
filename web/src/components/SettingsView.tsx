import { useEffect, useState } from "react";
import { api } from "../api";
import type { DoctorResponse, SettingsResponse } from "../types";

export function SettingsView({ onNotice }: { onNotice: (message: string) => void }) {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [doctor, setDoctor] = useState<DoctorResponse | null>(null);
  const [isRefreshingDoctor, setIsRefreshingDoctor] = useState(false);
  const [bundlePreview, setBundlePreview] = useState<{
    fileText: string;
    terminalProfilesCount: number;
    sshProfilesCount: number;
  } | null>(null);

  const loadSettings = async () => {
    try {
      const data = await api<SettingsResponse>("/api/settings");
      setSettings(data);
    } catch {
      // ignore
    }
  };

  const loadDoctor = async () => {
    setIsRefreshingDoctor(true);
    try {
      const data = await api<DoctorResponse>("/api/doctor");
      setDoctor(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Doctor scan failed";
      onNotice(msg);
    } finally {
      setIsRefreshingDoctor(false);
    }
  };

  useEffect(() => {
    void loadSettings();
    void loadDoctor();
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text) as {
        terminalProfiles?: unknown[];
        sshProfiles?: unknown[];
      };
      setBundlePreview({
        fileText: text,
        terminalProfilesCount: json.terminalProfiles?.length ?? 0,
        sshProfilesCount: json.sshProfiles?.length ?? 0
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid JSON bundle";
      onNotice(`Failed to parse sync bundle: ${msg}`);
    }
  };

  const confirmImport = async () => {
    if (!bundlePreview) return;
    try {
      await api("/api/sync/import", {
        method: "POST",
        body: bundlePreview.fileText
      });
      onNotice("Sync bundle imported successfully");
      setBundlePreview(null);
      await loadDoctor();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Import failed";
      onNotice(msg);
    }
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return "0s";
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <section className="view settings-view">
      <header className="view-header">
        <div>
          <h1>Settings & System Diagnostics</h1>
          <p>Local runtime telemetry, storage paths, and backup configuration</p>
        </div>
        <div className="toolbar">
          <button
            type="button"
            className="secondary compact-button"
            disabled={isRefreshingDoctor}
            onClick={loadDoctor}
          >
            <span>{isRefreshingDoctor ? "Scanning..." : "Refresh Diagnostics"}</span>
          </button>
        </div>
      </header>

      {/* System Telemetry Dashboard */}
      {doctor && (
        <div className="settings-section">
          <h2>Host & Runtime Telemetry</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-label">Operating System</span>
              <strong className="metric-val">{doctor.os} ({doctor.arch})</strong>
            </div>
            <div className="metric-card">
              <span className="metric-label">Go Runtime</span>
              <strong className="metric-val">{doctor.goVersion}</strong>
            </div>
            <div className="metric-card">
              <span className="metric-label">CPU Cores</span>
              <strong className="metric-val">{doctor.numCPU} cores</strong>
            </div>
            <div className="metric-card">
              <span className="metric-label">Goroutines</span>
              <strong className="metric-val">{doctor.numGoroutine}</strong>
            </div>
            <div className="metric-card">
              <span className="metric-label">Server Uptime</span>
              <strong className="metric-val">{formatUptime(doctor.uptimeSeconds)}</strong>
            </div>
            <div className="metric-card">
              <span className="metric-label">Allocated Memory</span>
              <strong className="metric-val">{doctor.memory.allocMB.toFixed(1)} MB</strong>
            </div>
            <div className="metric-card">
              <span className="metric-label">SQLite Size</span>
              <strong className="metric-val">
                {Math.round(doctor.database.sizeBytes / 1024)} KB
              </strong>
            </div>
            <div className="metric-card">
              <span className="metric-label">GC Cycles</span>
              <strong className="metric-val">{doctor.memory.numGC}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Application Paths */}
      <div className="settings-section">
        <h2>Filesystem Paths</h2>
        <div className="settings-list">
          {settings &&
            Object.entries(settings.paths).map(([key, value]) => (
              <div className="setting-row" key={key}>
                <span className="path-label">{key}</span>
                <code className="path-code">{value}</code>
              </div>
            ))}
        </div>
      </div>

      {/* Backup & Sync Bundles */}
      <div className="settings-section">
        <h2>Backup & Migration</h2>
        <p className="section-desc">
          Export terminal profiles, SSH hosts, and settings to a safe sync bundle. Private key contents are never exported.
        </p>

        <div className="button-row">
          <a className="primary link-button" href="/api/sync/export" download="open-termkit-sync.json">
            <span>Export Sync Bundle</span>
          </a>
          <label className="secondary file-control inline">
            <span>Import Sync Bundle</span>
            <input type="file" accept="application/json,.json" onChange={handleFileSelect} />
          </label>
        </div>
      </div>

      {/* Bundle Inspector Modal */}
      {bundlePreview && (
        <div className="palette-backdrop" onClick={() => setBundlePreview(null)}>
          <div
            className="in-app-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Confirm Sync Bundle Import"
          >
            <div className="dialog-header">
              <h2>Confirm Sync Bundle Import</h2>
              <button
                type="button"
                className="tab-close-button"
                onClick={() => setBundlePreview(null)}
              >
                ×
              </button>
            </div>

            <div className="dialog-body">
              <p className="dialog-desc">
                Review contents before importing into your local database:
              </p>
              <div className="bundle-summary-card">
                <div>
                  <strong>{bundlePreview.terminalProfilesCount}</strong>
                  <span>Terminal Profiles</span>
                </div>
                <div>
                  <strong>{bundlePreview.sshProfilesCount}</strong>
                  <span>SSH Hosts</span>
                </div>
              </div>
              <p className="item-meta">
                Existing items with matching IDs will be merged or updated.
              </p>
            </div>

            <div className="dialog-footer">
              <button
                type="button"
                className="secondary"
                onClick={() => setBundlePreview(null)}
              >
                <span>Cancel</span>
              </button>
              <button
                type="button"
                className="primary"
                onClick={confirmImport}
              >
                <span>Confirm & Import</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
