import { useEffect, useState } from "react";
import type { ContentBlock } from "../content";

export function TableOfContents({ blocks }: { blocks: ContentBlock[] }) {
  const [activeHeadingId, setActiveHeadingId] = useState<string>("");

  const headings = blocks.filter(
    (b): b is Extract<ContentBlock, { type: "heading" }> => b.type === "heading"
  );

  useEffect(() => {
    if (headings.length > 0) {
      setActiveHeadingId(headings[0].id);
    }
  }, [blocks]);

  const scrollToHeading = (id: string) => {
    setActiveHeadingId(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (headings.length === 0) return null;

  return (
    <aside className="toc-sidebar" aria-label="Table of Contents">
      <div className="toc-container">
        <span className="toc-title">On this page</span>
        <nav className="toc-nav">
          {headings.map((h) => (
            <button
              key={h.id}
              type="button"
              className={`toc-link ${h.level === 3 ? "sub-heading" : ""} ${activeHeadingId === h.id ? "active" : ""}`}
              onClick={() => scrollToHeading(h.id)}
            >
              <span>{h.text}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
