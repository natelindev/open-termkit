import { useEffect, useMemo, useState } from "react";
import { type ContentBlock, type DocPage, type Locale, getDocPages } from "./content";
import { DocSearchModal } from "./components/DocSearchModal";
import { TableOfContents } from "./components/TableOfContents";
import { ThemePlayground } from "./components/ThemePlayground";

type Theme = "light" | "dark";
const themeStorageKey = "open-termkit-docs-theme";
const langStorageKey = "open-termkit-docs-lang";

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

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(langStorageKey);
    if (stored === "en" || stored === "zh") return stored;
    return window.navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
  } catch {
    return "en";
  }
}

export default function App() {
  const [activePageId, setActivePageId] = useState<string>("introduction");
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const nextTheme = theme === "dark" ? "light" : "dark";

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
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(langStorageKey, locale);
    } catch {
      // ignore
    }
  }, [locale]);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const docPages = useMemo(() => getDocPages(locale), [locale]);

  const categories = useMemo(() => {
    const map = new Map<string, DocPage[]>();
    for (const page of docPages) {
      const list = map.get(page.category) ?? [];
      list.push(page);
      map.set(page.category, list);
    }
    return Array.from(map.entries());
  }, [docPages]);

  const activePage = useMemo(
    () => docPages.find((p) => p.id === activePageId) ?? docPages[0],
    [docPages, activePageId]
  );

  const currentIndex = docPages.findIndex((p) => p.id === activePage.id);
  const prevPage = currentIndex > 0 ? docPages[currentIndex - 1] : null;
  const nextPage = currentIndex < docPages.length - 1 ? docPages[currentIndex + 1] : null;

  const copyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleSelectPage = (id: string) => {
    setActivePageId(id);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="doc-site-root">
      {/* Top Banner Mesh Accent */}
      <div className="doc-mesh-top-accent" aria-hidden="true" />

      {/* Top Sticky App Header */}
      <header className="doc-top-navbar">
        <div className="nav-left">
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            <span className="hamburger-icon" />
          </button>

          <a href="#" className="doc-brand" onClick={() => handleSelectPage("introduction")}>
            <span className="doc-brand-logo" aria-hidden="true" />
            <span className="doc-brand-title">open-termkit</span>
            <span className="doc-version-pill">{locale === "zh" ? "文档" : "docs"}</span>
          </a>
        </div>

        {/* Global Search Bar */}
        <div className="nav-center">
          <button
            type="button"
            className="doc-search-trigger"
            onClick={() => setIsSearchOpen(true)}
          >
            <span className="search-glyph">🔍</span>
            <span>{locale === "zh" ? "搜索文档与教程..." : "Search documentation..."}</span>
            <kbd className="search-kbd">⌘K</kbd>
          </button>
        </div>

        {/* Quick Links & Language / Theme Switcher */}
        <div className="nav-right">
          <button
            type="button"
            className="nav-text-link"
            onClick={() => handleSelectPage("quickstart")}
          >
            {locale === "zh" ? "快速入门" : "Quickstart"}
          </button>
          <button
            type="button"
            className="nav-text-link"
            onClick={() => handleSelectPage("tutorial-multi-tab")}
          >
            {locale === "zh" ? "教程" : "Tutorials"}
          </button>
          <button
            type="button"
            className="nav-text-link"
            onClick={() => handleSelectPage("api-reference")}
          >
            {locale === "zh" ? "API 参考" : "API"}
          </button>
          <a
            href="/"
            className="nav-text-link nav-terminal-link"
            title="Open Open Termkit Web App"
          >
            {locale === "zh" ? "打开终端 ↗" : "Launch Terminal ↗"}
          </a>
          <a
            href="https://github.com/natelindev/open-termkit"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-icon-link"
            title="GitHub Repository"
          >
            GitHub
          </a>

          {/* Language Switcher Segmented Control */}
          <div className="doc-lang-segmented" role="radiogroup" aria-label="Language Selector">
            <button
              type="button"
              className={`lang-btn ${locale === "en" ? "active" : ""}`}
              onClick={() => setLocale("en")}
              title="Switch to English"
            >
              EN
            </button>
            <button
              type="button"
              className={`lang-btn ${locale === "zh" ? "active" : ""}`}
              onClick={() => setLocale("zh")}
              title="切换为简体中文"
            >
              中文
            </button>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="doc-theme-btn"
            onClick={() => setTheme(nextTheme)}
            aria-label={`Switch to ${nextTheme} theme`}
            title={`Switch to ${nextTheme} theme`}
          >
            <ThemeIcon theme={theme} />
          </button>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <div className="doc-body-container">
        {/* Left Sidebar Navigation - NO BADGES / NO TRUNCATION */}
        <aside className={`doc-left-sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}>
          <nav className="doc-sidebar-nav" aria-label="Documentation Categories">
            {categories.map(([category, pages]) => (
              <div key={category} className="doc-nav-section">
                <span className="doc-nav-section-title">{category}</span>
                <div className="doc-nav-section-items">
                  {pages.map((page) => (
                    <button
                      key={page.id}
                      type="button"
                      className={`doc-nav-link ${page.id === activePageId ? "active" : ""}`}
                      onClick={() => handleSelectPage(page.id)}
                      title={page.title}
                    >
                      <span className="link-title">{page.navTitle || page.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Center Main Content Article - ANIMATED FADE IN */}
        <main className="doc-main-pane">
          <div className="doc-article-wrapper" key={`${locale}-${activePage.id}`}>
            <div className="doc-breadcrumbs">
              <span>{locale === "zh" ? "文档" : "Docs"}</span>
              <span className="crumb-sep">/</span>
              <span>{activePage.category}</span>
              <span className="crumb-sep">/</span>
              <span>{activePage.title}</span>
            </div>

            <header className="doc-article-header">
              <div className="article-title-row">
                <h1>{activePage.title}</h1>
              </div>
              <p className="article-summary-lead">{activePage.summary}</p>
              <div className="article-meta-row">
                <span className="meta-read-time">{activePage.estimatedReadTime}</span>
              </div>
            </header>

            <div className="doc-article-content">
              {activePage.blocks.map((block, idx) => (
                <RenderContentBlock
                  key={idx}
                  block={block}
                  blockId={`${activePage.id}-${idx}`}
                  copiedId={copiedId}
                  locale={locale}
                  onCopy={copyCode}
                />
              ))}
            </div>

            {/* Next / Previous Pagination Footer */}
            <footer className="doc-pagination-footer">
              {prevPage ? (
                <button
                  type="button"
                  className="pagination-btn prev"
                  onClick={() => handleSelectPage(prevPage.id)}
                >
                  <span className="btn-dir">{locale === "zh" ? "← 上一篇" : "← Previous"}</span>
                  <span className="btn-label">{prevPage.title}</span>
                </button>
              ) : <div />}

              {nextPage && (
                <button
                  type="button"
                  className="pagination-btn next"
                  onClick={() => handleSelectPage(nextPage.id)}
                >
                  <span className="btn-dir">{locale === "zh" ? "下一篇 →" : "Next →"}</span>
                  <span className="btn-label">{nextPage.title}</span>
                </button>
              )}
            </footer>
          </div>
        </main>

        {/* Right Sticky Table of Contents */}
        <TableOfContents blocks={activePage.blocks} locale={locale} />
      </div>

      {/* Global Cmd+K Search Modal */}
      <DocSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectPage={handleSelectPage}
        docPages={docPages}
        locale={locale}
      />
    </div>
  );
}

function RenderContentBlock({
  block,
  blockId,
  copiedId,
  locale,
  onCopy
}: {
  block: ContentBlock;
  blockId: string;
  copiedId: string | null;
  locale: Locale;
  onCopy: (code: string, id: string) => void;
}) {
  switch (block.type) {
    case "paragraph":
      return <p className="doc-p">{block.text}</p>;

    case "heading":
      return block.level === 2 ? (
        <h2 id={block.id} className="doc-h2">
          <a href={`#${block.id}`} className="heading-anchor">#</a>
          {block.text}
        </h2>
      ) : (
        <h3 id={block.id} className="doc-h3">
          <a href={`#${block.id}`} className="heading-anchor">#</a>
          {block.text}
        </h3>
      );

    case "code":
      return (
        <div className="doc-code-block-wrapper">
          {block.title && (
            <div className="code-block-header">
              <span className="code-title">{block.title}</span>
              <span className="code-lang">{block.language}</span>
            </div>
          )}
          <div className="code-block-inner">
            <pre>
              <code>{block.code}</code>
            </pre>
            <button
              type="button"
              className={`code-copy-btn ${copiedId === blockId ? "copied" : ""}`}
              onClick={() => onCopy(block.code, blockId)}
              title={locale === "zh" ? "复制代码片段" : "Copy snippet"}
            >
              <span>{copiedId === blockId ? (locale === "zh" ? "已复制!" : "Copied!") : (locale === "zh" ? "复制" : "Copy")}</span>
            </button>
          </div>
        </div>
      );

    case "callout":
      return (
        <div className={`doc-callout-box callout-${block.variant}`}>
          {block.title && <strong className="callout-heading">{block.title}</strong>}
          <p className="callout-body">{block.text}</p>
        </div>
      );

    case "list":
      return (
        <ul className="doc-ul">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );

    case "table":
      return (
        <div className="doc-table-scroll">
          <table className="doc-styled-table">
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "component":
      if (block.componentName === "ThemePlayground") {
        return <ThemePlayground />;
      }
      if (block.componentName === "ArchitectureDiagram") {
        return (
          <div className="arch-diagram-card">
            <pre>
              <code>{`[ Web Client (Browser) ]
  ├── React 18 UI (Vercel Geist Design System)
  ├── wterm Virtual Terminal (WebGL/Canvas)
  │
  ├── HTTP REST API (/api/*) ──────> Go Server (Single Embedded Binary)
  │                                    ├── SQLite DB (~/.open-termkit/open-termkit.db)
  │                                    └── Managed SSH (~/.ssh/open-termkit/config)
  │
  └── Real-time WebSocket (/ws) ────> PTY Engine (creack/pty)
                                       └── Interactive Shell (zsh / bash / tmux / agents)`}</code>
            </pre>
          </div>
        );
      }
      return null;

    default:
      return null;
  }
}

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === "dark") {
    return (
      <svg className="theme-toggle-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
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
    <svg className="theme-toggle-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M15.69 11.34A5.7 5.7 0 0 1 8.66 4.31a6.08 6.08 0 1 0 7.03 7.03Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  );
}
