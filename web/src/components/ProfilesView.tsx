import { FormEvent, useMemo, useState } from "react";
import { api } from "../api";
import type { TerminalProfile } from "../types";

const defaultTerminalTheme = "monokai";
const profileThemeOptions = [
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

export function ProfilesView({
  profiles,
  onNotice,
  onProfilesChanged
}: {
  profiles: TerminalProfile[];
  onNotice: (message: string) => void;
  onProfilesChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<TerminalProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    name: "",
    shellCommand: "",
    args: [] as string[],
    newArg: "",
    env: {} as Record<string, string>,
    envKey: "",
    envVal: "",
    cwd: "",
    theme: defaultTerminalTheme,
    fontFamily: "JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 14,
    isDefault: false
  });

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return profiles;
    const q = searchQuery.toLowerCase();
    return profiles.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.shellCommand.toLowerCase().includes(q) ||
        p.args.some((a) => a.toLowerCase().includes(q))
    );
  }, [profiles, searchQuery]);

  const resetForm = () => {
    setEditing(null);
    setForm({
      name: "",
      shellCommand: "",
      args: [],
      newArg: "",
      env: {},
      envKey: "",
      envVal: "",
      cwd: "",
      theme: defaultTerminalTheme,
      fontFamily: "JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: 14,
      isDefault: false
    });
  };

  const startEdit = (p: TerminalProfile) => {
    setEditing(p);
    setForm({
      name: p.name,
      shellCommand: p.shellCommand,
      args: [...(p.args || [])],
      newArg: "",
      env: { ...(p.env || {}) },
      envKey: "",
      envVal: "",
      cwd: p.cwd || "",
      theme: p.theme || defaultTerminalTheme,
      fontFamily: p.fontFamily || "JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: p.fontSize || 14,
      isDefault: p.isDefault
    });
  };

  const duplicateProfile = async (p: TerminalProfile) => {
    const payload = {
      ...p,
      id: undefined,
      name: `${p.name} (Copy)`,
      isDefault: false
    };
    await api<TerminalProfile>("/api/profiles", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    onNotice(`Duplicated profile: ${p.name}`);
    await onProfilesChanged();
  };

  const deleteProfile = async (id: string, name: string) => {
    await api(`/api/profiles/${id}`, { method: "DELETE" });
    onNotice(`Deleted profile: ${name}`);
    if (editing?.id === id) resetForm();
    await onProfilesChanged();
  };

  const addArg = () => {
    if (!form.newArg.trim()) return;
    setForm((prev) => ({
      ...prev,
      args: [...prev.args, prev.newArg.trim()],
      newArg: ""
    }));
  };

  const removeArg = (index: number) => {
    setForm((prev) => ({
      ...prev,
      args: prev.args.filter((_, i) => i !== index)
    }));
  };

  const addEnv = () => {
    if (!form.envKey.trim()) return;
    setForm((prev) => ({
      ...prev,
      env: { ...prev.env, [prev.envKey.trim()]: form.envVal.trim() },
      envKey: "",
      envVal: ""
    }));
  };

  const removeEnv = (key: string) => {
    setForm((prev) => {
      const nextEnv = { ...prev.env };
      delete nextEnv[key];
      return { ...prev, env: nextEnv };
    });
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      ...editing,
      name: form.name,
      shellCommand: form.shellCommand,
      args: form.args,
      env: form.env,
      cwd: form.cwd,
      theme: form.theme,
      fontFamily: form.fontFamily,
      fontSize: form.fontSize,
      isDefault: form.isDefault,
      keybindings: editing?.keybindings ?? {},
      wtermSettings: editing?.wtermSettings ?? {}
    };

    if (editing) {
      await api<TerminalProfile>(`/api/profiles/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      onNotice("Profile updated successfully");
    } else {
      await api<TerminalProfile>("/api/profiles", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      onNotice("Profile created successfully");
    }
    resetForm();
    await onProfilesChanged();
  };

  return (
    <section className="view split-view">
      <header className="view-header">
        <div>
          <h1>Profiles</h1>
          <p>{profiles.length} configured shell and CLI profiles</p>
        </div>
        <div className="toolbar">
          <button type="button" className="secondary compact-button" onClick={resetForm}>
            <span>New Profile</span>
          </button>
        </div>
      </header>

      <div className="content-grid ssh-grid">
        {/* Left List Panel */}
        <div className="list-panel">
          <div className="list-filter-bar">
            <input
              type="search"
              placeholder="Filter profiles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="list-search-input"
            />
          </div>

          {filteredProfiles.length === 0 ? (
            <div className="empty-state">
              <strong>No profiles found</strong>
              <span>Create a shell profile or adjust search.</span>
            </div>
          ) : (
            filteredProfiles.map((profile) => {
              const isSelected = editing?.id === profile.id;
              return (
                <article
                  className={`item-card ${isSelected ? "selected-item" : ""}`}
                  key={profile.id}
                >
                  <button
                    type="button"
                    className="item-main"
                    onClick={() => startEdit(profile)}
                  >
                    <div className="item-title-row">
                      <strong>{profile.name}</strong>
                      {profile.isDefault && <span className="pill">default</span>}
                    </div>
                    <span className="item-subtext">
                      {[profile.shellCommand, ...profile.args].join(" ")}
                    </span>
                    <span className="item-meta">
                      Theme: {profile.theme} • {profile.fontSize}px
                    </span>
                  </button>

                  <div className="item-actions">
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => duplicateProfile(profile)}
                      title="Duplicate profile"
                    >
                      <span>Copy</span>
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

        {/* Right Form Panel */}
        <form className="edit-panel" onSubmit={save}>
          <div className="panel-heading">
            <div>
              <h2>{editing ? "Edit Profile" : "New Profile"}</h2>
              <span>{editing ? editing.id : "Configure launch parameters"}</span>
            </div>
            {editing && (
              <button
                type="button"
                className="secondary compact-button"
                onClick={resetForm}
              >
                <span>Reset</span>
              </button>
            )}
          </div>

          <label>
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Zsh Dev, Docker Shell"
              required
            />
          </label>

          <label>
            Shell / Executable
            <input
              value={form.shellCommand}
              onChange={(e) => setForm({ ...form, shellCommand: e.target.value })}
              placeholder="/bin/zsh or tmux"
              required
            />
          </label>

          <label>
            Working Directory (CWD)
            <input
              value={form.cwd}
              onChange={(e) => setForm({ ...form, cwd: e.target.value })}
              placeholder="e.g. /Users/name/projects (blank for home)"
            />
          </label>

          {/* Arguments Management */}
          <div className="form-section">
            <span className="section-label">Command Arguments</span>
            <div className="arg-input-row">
              <input
                value={form.newArg}
                onChange={(e) => setForm({ ...form, newArg: e.target.value })}
                placeholder="e.g. -l, --login, new-session"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addArg();
                  }
                }}
              />
              <button type="button" className="secondary compact-button" onClick={addArg}>
                <span>Add</span>
              </button>
            </div>
            {form.args.length > 0 && (
              <div className="arg-chips-container">
                {form.args.map((arg, idx) => (
                  <span key={idx} className="arg-chip">
                    <code>{arg}</code>
                    <button type="button" onClick={() => removeArg(idx)}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Environment Variables Management */}
          <div className="form-section">
            <span className="section-label">Environment Variables</span>
            <div className="env-input-row">
              <input
                value={form.envKey}
                onChange={(e) => setForm({ ...form, envKey: e.target.value })}
                placeholder="KEY (e.g. EDITOR)"
              />
              <input
                value={form.envVal}
                onChange={(e) => setForm({ ...form, envVal: e.target.value })}
                placeholder="VALUE (e.g. nvim)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addEnv();
                  }
                }}
              />
              <button type="button" className="secondary compact-button" onClick={addEnv}>
                <span>Add</span>
              </button>
            </div>
            {Object.keys(form.env).length > 0 && (
              <div className="env-table-container">
                {Object.entries(form.env).map(([k, v]) => (
                  <div key={k} className="env-row">
                    <code>{k} = {v}</code>
                    <button type="button" onClick={() => removeEnv(k)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Appearance & Themes */}
          <div className="form-section">
            <span className="section-label">Appearance & Font</span>
            <div className="form-row">
              <div className="field">
                <span className="field-label">Color Scheme</span>
                <select
                  value={form.theme}
                  onChange={(e) => setForm({ ...form, theme: e.target.value })}
                  className="native-select"
                >
                  {profileThemeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <label>
                Font Size
                <input
                  type="number"
                  min="10"
                  max="24"
                  value={form.fontSize}
                  onChange={(e) => setForm({ ...form, fontSize: Number(e.target.value) })}
                />
              </label>
            </div>

            <label>
              Font Family
              <input
                value={form.fontFamily}
                onChange={(e) => setForm({ ...form, fontFamily: e.target.value })}
              />
            </label>
          </div>

          <label className="check-row">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
            />
            Set as default terminal profile
          </label>

          <div className="form-actions">
            <button className="primary" type="submit">
              <span>{editing ? "Save Profile" : "Create Profile"}</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
