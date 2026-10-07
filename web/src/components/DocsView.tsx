import { useEffect, useMemo, useState } from "react";
import { type DocBlock, type DocSection, getDocsSections } from "../docsData";

const docsLangKey = "open-termkit-docs-lang";

export function DocsView({ initialSectionId = "introduction" }: { initialSectionId?: string }) {
  const [locale, setLocale] = useState<"en" | "zh">(() => {
    try {
      const saved = localStorage.getItem(docsLangKey);
      if (saved === "en" || saved === "zh") return saved;
      return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
    } catch {
      return "en";
    }
  });

  const [activeSectionId, setActiveSectionId] = useState(initialSectionId);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(docsLangKey, locale);
    } catch {
      // ignore
    }
  }, [locale]);

  const docsSections = useMemo(() => getDocsSections(locale), [locale]);

  const categories = useMemo(() => {
    const map = new Map<string, DocSection[]>();
    for (const section of docsSections) {
      const list = map.get(section.category) ?? [];
      list.push(section);
      map.set(section.category, list);
    }
    return Array.from(map.entries());
  }, [docsSections]);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    return docsSections.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.summary.toLowerCase().includes(query) ||
        s.content.some((b) => ("text" in b && b.text.toLowerCase().includes(query)) || ("code" in b && b.code.toLowerCase().includes(query)))
    );
  }, [docsSections, searchQuery]);

  const activeSection = useMemo(
    () => docsSections.find((s) => s.id === activeSectionId) ?? docsSections[0],
    [docsSections, activeSectionId]
  );

  const copyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeIndex(id);
      setTimeout(() => setCopiedCodeIndex(null), 2000);
    } catch {
      // ignore
    }
  };

  const currentIndex = docsSections.findIndex((s) => s.id === activeSection.id);
  const prevSection = currentIndex > 0 ? docsSections[currentIndex - 1] : null;
  const nextSection = currentIndex < docsSections.length - 1 ? docsSections[currentIndex + 1] : null;

  return (
    <section className="view docs-view">
      <div className="docs-layout">
        <aside className="docs-sidebar">
          <div className="docs-search-box">
            <input
              type="search"
              placeholder={locale === "zh" ? "搜索教程与指南..." : "Search tutorials & guides..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="docs-search-input"
            />
            <div className="docs-sidebar-actions">
              <div className="docs-lang-segmented" role="radiogroup" aria-label="Language">
                <button
                  type="button"
                  className={`lang-btn ${locale === "en" ? "active" : ""}`}
                  onClick={() => setLocale("en")}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={`lang-btn ${locale === "zh" ? "active" : ""}`}
                  onClick={() => setLocale("zh")}
                >
                  中文
                </button>
              </div>
              <a
                href="/docs/"
                target="_blank"
                rel="noreferrer"
                className="docs-standalone-link"
                title="Open full documentation site in a new tab"
              >
                <span>{locale === "zh" ? "独立文档站" : "Full Doc Site"}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          <nav className="docs-nav" aria-label="Documentation navigation">
            {filteredSections ? (
              <div className="docs-nav-group">
                <span className="docs-nav-group-title">
                  {locale === "zh" ? `搜索结果 (${filteredSections.length})` : `Search Results (${filteredSections.length})`}
                </span>
                {filteredSections.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`docs-nav-item ${activeSectionId === s.id ? "active" : ""}`}
                    onClick={() => setActiveSectionId(s.id)}
                    title={s.title}
                  >
                    <span>{s.navTitle || s.title}</span>
                  </button>
                ))}
              </div>
            ) : (
              categories.map(([category, sections]) => (
                <div key={category} className="docs-nav-group">
                  <span className="docs-nav-group-title">{category}</span>
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`docs-nav-item ${activeSectionId === s.id ? "active" : ""}`}
                      onClick={() => setActiveSectionId(s.id)}
                      title={s.title}
                    >
                      <span>{s.navTitle || s.title}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </nav>
        </aside>

        <article className="docs-content" key={`${locale}-${activeSection.id}`}>
          <header className="docs-header">
            <div className="docs-breadcrumb">
              <span>{locale === "zh" ? "文档" : "Docs"}</span>
              <span className="breadcrumb-separator">/</span>
              <span>{activeSection.category}</span>
              <span className="breadcrumb-separator">/</span>
              <span>{activeSection.title}</span>
            </div>
            <h1>{activeSection.title}</h1>
            <p className="docs-summary">{activeSection.summary}</p>
          </header>

          <div className="docs-body">
            {activeSection.content.map((block, index) => (
              <RenderDocBlock
                key={index}
                block={block}
                blockId={`${activeSection.id}-${index}`}
                copiedId={copiedCodeIndex}
                locale={locale}
                onCopy={copyCode}
              />
            ))}
          </div>

          <footer className="docs-footer-nav">
            {prevSection ? (
              <button
                type="button"
                className="docs-pagination-link prev"
                onClick={() => setActiveSectionId(prevSection.id)}
              >
                <span className="pagination-label">{locale === "zh" ? "← 上一篇" : "← Previous"}</span>
                <span className="pagination-title">{prevSection.title}</span>
              </button>
            ) : <div />}
            {nextSection && (
              <button
                type="button"
                className="docs-pagination-link next"
                onClick={() => setActiveSectionId(nextSection.id)}
              >
                <span className="pagination-label">{locale === "zh" ? "下一篇 →" : "Next →"}</span>
                <span className="pagination-title">{nextSection.title}</span>
              </button>
            )}
          </footer>
        </article>
      </div>
    </section>
  );
}

function RenderDocBlock({
  block,
  blockId,
  copiedId,
  locale,
  onCopy
}: {
  block: DocBlock;
  blockId: string;
  copiedId: string | null;
  locale: "en" | "zh";
  onCopy: (code: string, id: string) => void;
}) {
  switch (block.type) {
    case "paragraph":
      return <p className="docs-paragraph">{block.text}</p>;

    case "heading":
      return block.level === 2 ? (
        <h2 className="docs-h2">{block.text}</h2>
      ) : (
        <h3 className="docs-h3">{block.text}</h3>
      );

    case "code":
      return (
        <div className="docs-code-container">
          {block.title && <div className="docs-code-header"><span>{block.title}</span></div>}
          <div className="docs-code-wrapper">
            <pre className="docs-code-block">
              <code>{block.code}</code>
            </pre>
            <button
              type="button"
              className={`docs-copy-button ${copiedId === blockId ? "copied" : ""}`}
              onClick={() => onCopy(block.code, blockId)}
              title={locale === "zh" ? "复制代码" : "Copy code to clipboard"}
            >
              <span>{copiedId === blockId ? (locale === "zh" ? "已复制!" : "Copied!") : (locale === "zh" ? "复制" : "Copy")}</span>
            </button>
          </div>
        </div>
      );

    case "callout":
      return (
        <div className={`docs-callout docs-callout-${block.variant}`}>
          {block.title && <strong className="docs-callout-title">{block.title}</strong>}
          <p className="docs-callout-text">{block.text}</p>
        </div>
      );

    case "list":
      return (
        <ul className="docs-list">
          {block.items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      );

    case "table":
      return (
        <div className="docs-table-wrapper">
          <table className="docs-table">
            <thead>
              <tr>
                {block.headers.map((h, idx) => (
                  <th key={idx}>{h}</th>
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

    default:
      return null;
  }
}
