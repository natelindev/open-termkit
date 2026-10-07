import { useEffect, useMemo, useRef, useState } from "react";
import { docPages } from "../content";

export function DocSearchModal({
  isOpen,
  onClose,
  onSelectPage
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectPage: (pageId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
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
  }, [query]);

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
    <div className="doc-search-backdrop" onClick={onClose} role="presentation">
      <div
        className="doc-search-modal"
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
            className="doc-search-input-field"
            placeholder="Search guides, tutorials, CLI commands, API..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="doc-search-kbd" onClick={onClose}>ESC</kbd>
        </div>

        <div className="doc-search-list">
          {results.length === 0 ? (
            <div className="doc-search-empty">
              No documentation pages found for "{query}".
            </div>
          ) : (
            results.map((page, idx) => (
              <div
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
                {page.badge && <span className="doc-search-item-badge">{page.badge}</span>}
              </div>
            ))
          )}
        </div>

        <div className="doc-search-footer">
          <span>↑↓ Navigate</span>
          <span>↵ Open article</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
}
