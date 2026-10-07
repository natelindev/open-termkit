import { useState } from "react";

const themes = [
  { id: "monokai", name: "Monokai", bg: "#272822", fg: "#f8f8f2", accent: "#a6e22e", sub: "#66d9ef", kw: "#f92672" },
  { id: "tokyo-night", name: "Tokyo Night", bg: "#1a1b26", fg: "#c0caf5", accent: "#9ece6a", sub: "#7aa2f7", kw: "#bb9af7" },
  { id: "catppuccin-mocha", name: "Catppuccin Mocha", bg: "#1e1e2e", fg: "#cdd6f4", accent: "#a6e3a1", sub: "#89b4fa", kw: "#f38ba8" },
  { id: "dracula", name: "Dracula", bg: "#282a36", fg: "#f8f8f2", accent: "#50fa7b", sub: "#8be9fd", kw: "#ff79c6" },
  { id: "nord", name: "Nord", bg: "#2e3440", fg: "#d8dee9", accent: "#a3be8c", sub: "#88c0d0", kw: "#81a1c1" },
  { id: "gruvbox-dark", name: "Gruvbox Dark", bg: "#282828", fg: "#ebdbb2", accent: "#b8bb26", sub: "#83a598", kw: "#fb4934" },
  { id: "one-dark", name: "One Dark", bg: "#282c34", fg: "#abb2bf", accent: "#98c379", sub: "#61afef", kw: "#e06c75" },
  { id: "github-dark", name: "GitHub Dark", bg: "#0d1117", fg: "#c9d1d9", accent: "#3fb950", sub: "#58a6ff", kw: "#ff7b72" },
  { id: "rose-pine", name: "Rose Pine", bg: "#191724", fg: "#e0def4", accent: "#9ccfd8", sub: "#c4a7e7", kw: "#eb6f92" },
  { id: "solarized-dark", name: "Solarized Dark", bg: "#002b36", fg: "#839496", accent: "#859900", sub: "#268bd2", kw: "#dc322f" },
  { id: "solarized-light", name: "Solarized Light", bg: "#fdf6e3", fg: "#657b83", accent: "#859900", sub: "#268bd2", kw: "#dc322f" },
  { id: "light", name: "Light Paper", bg: "#ffffff", fg: "#171717", accent: "#0070f3", sub: "#555555", kw: "#d0021b" }
];

export function ThemePlayground() {
  const [selectedThemeId, setSelectedThemeId] = useState("monokai");
  const current = themes.find((t) => t.id === selectedThemeId) ?? themes[0];

  return (
    <div className="theme-playground-card">
      <div className="theme-selector-chips">
        {themes.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`theme-chip-btn ${selectedThemeId === t.id ? "active" : ""}`}
            onClick={() => setSelectedThemeId(t.id)}
          >
            <span
              className="theme-chip-swatch"
              style={{ backgroundColor: t.bg, borderColor: t.sub }}
            />
            <span>{t.name}</span>
          </button>
        ))}
      </div>

      <div
        className="simulated-terminal-viewport"
        style={{
          backgroundColor: current.bg,
          color: current.fg,
          borderColor: "var(--hairline)"
        }}
      >
        <div className="sim-term-header">
          <span className="sim-dot sim-dot-red" />
          <span className="sim-dot sim-dot-yellow" />
          <span className="sim-dot sim-dot-green" />
          <span className="sim-term-title">open-termkit — {current.name}</span>
        </div>

        <div className="sim-term-body">
          <div className="sim-line">
            <span style={{ color: current.sub }}>user@workstation</span>
            <span style={{ color: current.fg }}>:</span>
            <span style={{ color: current.accent }}>~/open-termkit</span>
            <span style={{ color: current.kw }}> (main)</span>
            <span style={{ color: current.fg }}> $ open-termkit doctor</span>
          </div>

          <div className="sim-line" style={{ color: current.sub }}>
            {"{"}
          </div>
          <div className="sim-line indent">
            <span style={{ color: current.kw }}>"app"</span>: <span style={{ color: current.accent }}>"open-termkit"</span>,
          </div>
          <div className="sim-line indent">
            <span style={{ color: current.kw }}>"version"</span>: <span style={{ color: current.sub }}>"1.0.0"</span>,
          </div>
          <div className="sim-line indent">
            <span style={{ color: current.kw }}>"theme"</span>: <span style={{ color: current.accent }}>"{current.name}"</span>,
          </div>
          <div className="sim-line indent">
            <span style={{ color: current.kw }}>"status"</span>: <span style={{ color: current.accent }}>"production-ready"</span>,
          </div>
          <div className="sim-line indent">
            <span style={{ color: current.kw }}>"latencyMs"</span>: <span style={{ color: current.sub }}>12</span>
          </div>
          <div className="sim-line" style={{ color: current.sub }}>
            {"}"}
          </div>

          <div className="sim-line sim-prompt-cursor">
            <span style={{ color: current.accent }}>➜</span>
            <span style={{ color: current.fg }}> ./bin/open-termkit serve</span>
            <span className="sim-cursor" style={{ backgroundColor: current.fg }} />
          </div>
        </div>
      </div>
    </div>
  );
}
