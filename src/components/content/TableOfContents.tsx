"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/markdown";

interface TableOfContentsProps {
  toc: TocEntry[];
}

export default function TableOfContents({ toc }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "0px 0px -70% 0px" }
    );

    toc.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  if (toc.length === 0) return null;

  return (
    <aside className="w-48 shrink-0">
      <div className="sticky top-20">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
          On this page
        </p>
        <nav className="space-y-1">
          {toc.map((entry) => (
            <a
              key={entry.id}
              href={`#${entry.id}`}
              className={`block truncate text-sm transition-colors ${
                entry.level > 2 ? "pl-3" : ""
              } ${
                activeId === entry.id
                  ? "font-medium text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {entry.text}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
