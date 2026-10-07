import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { SSHGenerateKeyResult, SSHProfile, SSHTestResult } from "../types";

export function SSHView({
  onConnect,
  onNotice
}: {
  onConnect: (ssh: SSHProfile) => void;
  onNotice: (message: string) => void;
}) {
  const [profiles, setProfiles] = useState<SSHProfile[]>([]);
  const [editing, setEditing] = useState<SSHProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [include, setInclude] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, SSHTestResult>>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  // Key Gen Modal state
  const [isKeyGenOpen, setIsKeyGenOpen] = useState(false);
  const [keyGenName, setKeyGenName] = useState("id_ed25519");
  const [keyGenComment, setKeyGenComment] = useState("open-termkit@localhost");
  const [keyGenResult, setKeyGenResult] = useState<SSHGenerateKeyResult | null>(null);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  // Config Preview Modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    host: "",
    user: "",
    port: 22,
    identityFile: "",
    proxyJump: "",
    notes: ""
  });

  const refresh = async () => {
    const items = await api<SSHProfile[] | null>("/api/ssh");
    setProfiles(Array.isArray(items) ? items : []);
  };

  useEffect(() => {
    void refresh().catch((error: Error) => onNotice(error.message));
  }, []);

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return profiles;
    const q = searchQuery.toLowerCase();
    return profiles.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.host.toLowerCase().includes(q) ||
        p.user.toLowerCase().includes(q)
    );
  }, [profiles, searchQuery]);

  const resetForm = () => {
    setEditing(null);
    setForm({
      name: "",
      host: "",
      user: "",
      port: 22,
      identityFile: "",
      proxyJump: "",
      notes: ""
    });
  };

  const startEdit = (p: SSHProfile) => {
    setEditing(p);
    setForm({
      name: p.name,
      host: p.host,
      user: p.user,
      port: p.port,
      identityFile: p.identityFile || "",
      proxyJump: p.proxyJump || "",
      notes: p.notes || ""
    });
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      ...editing,
      ...form,
      enabled: true
    };
    if (editing) {
      await api<SSHProfile>(`/api/ssh/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      onNotice("SSH profile updated");
    } else {
      await api<SSHProfile>("/api/ssh", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      onNotice("SSH profile created");
    }
    resetForm();
    await refresh();
  };

  const deleteProfile = async (id: string, name: string) => {
    await api(`/api/ssh/${id}`, { method: "DELETE" });
    onNotice(`Deleted SSH profile: ${name}`);
    if (editing?.id === id) resetForm();
    await refresh();
  };

  const testConnection = async (profile: SSHProfile) => {
    setTestingId(profile.id);
    try {
      const res = await api<SSHTestResult>(`/api/ssh/${profile.id}/test`, { method: "POST" });
      setTestResults((prev) => ({ ...prev, [profile.id]: res }));
      if (res.reachable) {
        onNotice(`${profile.name}: Reachable (${res.latencyMs}ms)`);
      } else {
        onNotice(`${profile.name}: Unreachable (${res.error || "connection failed"})`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Test failed";
      onNotice(`${profile.name}: ${msg}`);
    } finally {
      setTestingId(null);
    }
  };

  const uploadKey = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.set("key", file);
    body.set("name", file.name);
    try {
      const result = await api<{ path: string }>("/api/ssh/import-key", { method: "POST", body });
      setForm((current) => ({ ...current, identityFile: result.path }));
      onNotice(`Imported key: ${file.name}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Key import failed";
      onNotice(msg);
    }
  };

  const handleGenerateKey = async () => {
    setIsGeneratingKey(true);
    try {
      const res = await api<SSHGenerateKeyResult>("/api/ssh/generate-key", {
        method: "POST",
        body: JSON.stringify({ name: keyGenName, comment: keyGenComment })
      });
      setKeyGenResult(res);
      setForm((prev) => ({ ...prev, identityFile: res.path }));
      onNotice("Ed25519 key pair generated successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Key generation failed";
      onNotice(msg);
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const writeConfig = async () => {
    try {
      await api("/api/ssh/write-config", {
        method: "POST",
        body: JSON.stringify({ ensureInclude: include })
      });
      onNotice("Managed SSH config written to ~/.ssh/open-termkit/config");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed writing config";
      onNotice(msg);
    }
  };

  const generatedConfigPreview = useMemo(() => {
    let out = "# Managed by open-termkit (~/.ssh/open-termkit/config)\n\n";
    for (const p of profiles) {
      if (!p.enabled || !p.host || !p.name) continue;
      out += `Host ${p.name.replace(/\\s+/g, "-")}\n`;
      out += `  HostName ${p.host}\n`;
      if (p.user) out += `  User ${p.user}\n`;
      if (p.port && p.port !== 22) out += `  Port ${p.port}\n`;
      if (p.identityFile) {
        out += `  IdentityFile ${p.identityFile}\n`;
        out += `  IdentitiesOnly yes\n`;
      }
      if (p.proxyJump) out += `  ProxyJump ${p.proxyJump}\n`;
      out += "\n";
    }
    return out;
  }, [profiles]);

  return (
    <section className="view split-view">
      <header className="view-header">
        <div>
          <h1>SSH Manager</h1>
          <p>{profiles.length} remote host profiles and managed keys</p>
        </div>
        <div className="toolbar">
          <label className="check-row compact">
            <input
              type="checkbox"
              checked={include}
              onChange={(e) => setInclude(e.target.checked)}
            />
            Include in ~/.ssh/config
          </label>
          <button type="button" className="secondary compact-button" onClick={() => setIsPreviewOpen(true)}>
            <span>Preview Config</span>
          </button>
          <button type="button" className="primary compact-button" onClick={writeConfig}>
            <span>Write Config</span>
          </button>
        </div>
      </header>

      <div className="content-grid ssh-grid">
        {/* Left List Panel */}
        <div className="list-panel">
          <div className="list-filter-bar">
            <input
              type="search"
              placeholder="Filter SSH hosts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="list-search-input"
            />
          </div>

          {filteredProfiles.length === 0 ? (
            <div className="empty-state">
              <strong>No SSH profiles found</strong>
              <span>Add a host to write managed SSH configs and connect.</span>
            </div>
          ) : (
            filteredProfiles.map((profile) => {
              const isSelected = editing?.id === profile.id;
              const test = testResults[profile.id];
              return (
                <article
                  key={profile.id}
                  className={`item-card ${isSelected ? "selected-item" : ""}`}
                >
                  <div className="item-main" onClick={() => startEdit(profile)}>
                    <div className="item-title-row">
                      <strong>{profile.name}</strong>
                      {test && (
                        <span className={`pill ${test.reachable ? "success" : "danger"}`}>
                          {test.reachable ? `${test.latencyMs}ms` : "unreachable"}
                        </span>
                      )}
                    </div>
                    <span className="item-subtext">
                      {profile.user ? `${profile.user}@` : ""}
                      {profile.host}:{profile.port}
                    </span>
                    {profile.identityFile && (
                      <span className="item-meta">Key: {profile.identityFile.split("/").pop()}</span>
                    )}
                  </div>

                  <div className="item-actions">
                    <button
                      type="button"
                      className="primary compact-button"
                      onClick={() => onConnect(profile)}
                      title="Open interactive SSH terminal tab"
                    >
                      <span>Connect</span>
                    </button>
                    <button
                      type="button"
                      className="secondary compact-button"
                      disabled={testingId === profile.id}
                      onClick={() => testConnection(profile)}
                      title="Test TCP reachability and latency"
                    >
                      <span>{testingId === profile.id ? "Testing..." : "Test"}</span>
                    </button>
                    <button
                      type="button"
                      className="icon-button danger"
                      onClick={() => deleteProfile(profile.id, profile.name)}
                      title="Delete profile"
                    >
                      <span>Delete</span>
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Right Edit Form Panel */}
        <form className="edit-panel ssh-panel" onSubmit={save}>
          <div className="panel-heading">
            <div>
              <h2>{editing ? "Edit SSH Profile" : "New SSH Profile"}</h2>
              <span>{editing ? editing.id : "Add remote server host configuration"}</span>
            </div>
            {editing && (
              <button
                type="button"
                className="secondary compact-button"
                onClick={resetForm}
              >
                <span>New</span>
              </button>
            )}
          </div>

          <div className="form-section">
            <span className="section-label">Connection</span>
            <label>
              Profile Name / Host Alias
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. prod-web, staging, bast-1"
                required
              />
            </label>

            <div className="form-row compact-port">
              <label>
                Host / IP Address
                <input
                  value={form.host}
                  onChange={(e) => setForm({ ...form, host: e.target.value })}
                  placeholder="example.com or 192.168.1.50"
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
                  onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
                />
              </label>
            </div>

            <label>
              User
              <input
                value={form.user}
                onChange={(e) => setForm({ ...form, user: e.target.value })}
                placeholder="root or ubuntu"
              />
            </label>
          </div>

          <div className="form-section">
            <span className="section-label">Authentication</span>
            <label>
              Identity File (Private Key)
              <span className="input-action-row">
                <input
                  value={form.identityFile}
                  onChange={(e) => setForm({ ...form, identityFile: e.target.value })}
                  placeholder="~/.ssh/id_ed25519"
                />
                <span className="file-control">
                  <span>Import</span>
                  <input type="file" onChange={uploadKey} />
                </span>
                <button
                  type="button"
                  className="secondary compact-button"
                  onClick={() => setIsKeyGenOpen(true)}
                >
                  <span>Generate Key</span>
                </button>
              </span>
            </label>
          </div>

          <div className="form-section">
            <span className="section-label">Routing & Options</span>
            <label>
              Proxy Jump (Jump Host)
              <input
                value={form.proxyJump}
                onChange={(e) => setForm({ ...form, proxyJump: e.target.value })}
                placeholder="jump-box-alias"
              />
            </label>
            <label>
              Notes
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes or tags..."
                rows={2}
              />
            </label>
          </div>

          <div className="form-actions">
            <button className="primary" type="submit">
              <span>{editing ? "Save Profile" : "Create Profile"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Key Generation Modal */}
      {isKeyGenOpen && (
        <div className="palette-backdrop" onClick={() => setIsKeyGenOpen(false)}>
          <div
            className="in-app-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Generate Ed25519 SSH Key"
          >
            <div className="dialog-header">
              <h2>Generate Ed25519 Key Pair</h2>
              <button
                type="button"
                className="tab-close-button"
                onClick={() => setIsKeyGenOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="dialog-body">
              <label>
                Key Name
                <input
                  value={keyGenName}
                  onChange={(e) => setKeyGenName(e.target.value)}
                  placeholder="id_ed25519"
                />
              </label>

              <label>
                Comment
                <input
                  value={keyGenComment}
                  onChange={(e) => setKeyGenComment(e.target.value)}
                  placeholder="user@host"
                />
              </label>

              {keyGenResult && (
                <div className="key-gen-result">
                  <span className="result-label">Public Key (Copy to remote server):</span>
                  <div className="code-copy-row">
                    <pre><code>{keyGenResult.publicKey}</code></pre>
                    <button
                      type="button"
                      className="secondary compact-button"
                      onClick={() => {
                        navigator.clipboard.writeText(keyGenResult.publicKey);
                        onNotice("Copied public key to clipboard");
                      }}
                    >
                      <span>Copy</span>
                    </button>
                  </div>
                  <span className="item-meta">Saved private key: {keyGenResult.path}</span>
                </div>
              )}
            </div>

            <div className="dialog-footer">
              <button
                type="button"
                className="secondary"
                onClick={() => setIsKeyGenOpen(false)}
              >
                <span>Close</span>
              </button>
              <button
                type="button"
                className="primary"
                disabled={isGeneratingKey}
                onClick={handleGenerateKey}
              >
                <span>{isGeneratingKey ? "Generating..." : "Generate Key"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Config Preview Modal */}
      {isPreviewOpen && (
        <div className="palette-backdrop" onClick={() => setIsPreviewOpen(false)}>
          <div
            className="in-app-dialog large"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="SSH Config Preview"
          >
            <div className="dialog-header">
              <h2>SSH Managed Config Preview</h2>
              <button
                type="button"
                className="tab-close-button"
                onClick={() => setIsPreviewOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="dialog-body">
              <p className="dialog-desc">
                This snippet will be written to <code>~/.ssh/open-termkit/config</code>.
              </p>
              <pre className="config-preview-block">
                <code>{generatedConfigPreview}</code>
              </pre>
            </div>

            <div className="dialog-footer">
              <button
                type="button"
                className="secondary"
                onClick={() => setIsPreviewOpen(false)}
              >
                <span>Close</span>
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  writeConfig();
                  setIsPreviewOpen(false);
                }}
              >
                <span>Save to Disk</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
