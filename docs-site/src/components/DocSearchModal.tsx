import { useEffect, useMemo, useRef, useState } from "react";
import type { DocPage, Locale } from "../content";

export function DocSearchModal({
  isOpen,
  onClose,
  onSelectPage,
  docPages,
  locale = "en"
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectPage: (pageId: string) => void;
  docPages: DocPage[];
  locale?: Locale;
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo(() => {
    if (!query.trim()) return docPages.slice(0, 8);
    const q = query.toLowerCase();
    return docPages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.blocks.some(
          (b) =>
            ("text" in b && b.text.toLowerCase().includes(q)) ||
            ("code" in b && b.code.toLowerCase().includes(q))
        )
    );
  }, [query, docPages]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    setQuery("");
    setSelectedIndex(0);
    inputRef.current?.focus();
    return () => previous?.focus();
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[selectedIndex];
      if (item) {
        onSelectPage(item.id);
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="doc-search-backdrop" onClick={onClose}>
      <div
        className="doc-search-modal"
        ref={dialogRef}
        onKeyDown={(event) => {
          if (event.key === "Escape") { event.preventDefault(); onClose(); }
          if (event.key !== "Tab") return;
          const controls = dialogRef.current?.querySelectorAll<HTMLElement>("input, button");
          if (!controls?.length) return;
          const first = controls[0], last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search documentation"
      >
        <div className="doc-search-header">
          <span className="doc-search-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            aria-label={locale === "zh" ? "搜索文档" : "Search documentation"}
            className="doc-search-input-field"
            placeholder={locale === "zh" ? "搜索文档、教程、CLI 命令、API..." : "Search guides, tutorials, CLI commands, API..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="button" className="doc-search-close" aria-label="Close search" onClick={onClose}>ESC</button>
        </div>

        <div className="doc-search-list">
          {results.length === 0 ? (
            <div className="doc-search-empty">
              {locale === "zh" ? `未找到关于 "${query}" 的文档内容。` : `No documentation pages found for "${query}".`}
            </div>
          ) : (
            results.map((page, idx) => (
              <button
                type="button"
                key={page.id}
                className={`doc-search-item ${idx === selectedIndex ? "selected" : ""}`}
                onClick={() => {
                  onSelectPage(page.id);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="doc-search-item-info">
                  <span className="doc-search-item-category">{page.category}</span>
                  <strong className="doc-search-item-title">{page.title}</strong>
                  <span className="doc-search-item-summary">{page.summary}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="doc-search-footer">
          <span>{locale === "zh" ? "↑↓ 导航" : "↑↓ Navigate"}</span>
          <span>{locale === "zh" ? "↵ 打开文档" : "↵ Open article"}</span>
          <span>{locale === "zh" ? "ESC 关闭" : "ESC Close"}</span>
        </div>
      </div>
    </div>
  );
}
