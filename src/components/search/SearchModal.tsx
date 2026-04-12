"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import type { SearchEntry } from "@/types/content";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

const TYPE_LABEL: Record<string, string> = {
  category: "Category",
  book: "Series",
  post: "Post",
};

const TYPE_COLOR: Record<string, string> = {
  category: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  book: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  post: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [allEntries, setAllEntries] = useState<SearchEntry[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const fuseRef = useRef<Fuse<SearchEntry> | null>(null);

  // Fetch search index once
  useEffect(() => {
    if (allEntries.length > 0) return;
    fetch("/api/search-index")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load search index: ${r.status}`);
        return r.json();
      })
      .then((data: SearchEntry[]) => {
        setAllEntries(data);
        const tags = Array.from(
          new Set(data.flatMap((e) => e.tags ?? []))
        ).sort();
        setAllTags(tags);
        fuseRef.current = new Fuse(data, {
          keys: ["searchableText", "title", "tags"],
          threshold: 0.35,
          includeScore: true,
        });
      })
      .catch((err) => {
        console.error("[search] Failed to load search index:", err);
      });
  }, [allEntries.length]);

  // Open: focus input + reset state
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveTag(null);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Run search whenever query or activeTag changes
  const runSearch = useCallback(
    (q: string, tag: string | null) => {
      let pool: SearchEntry[] = allEntries;

      if (tag) {
        pool = pool.filter((e) => e.tags?.includes(tag));
      }

      if (!q.trim()) {
        setResults(pool.slice(0, 8));
        return;
      }

      if (!fuseRef.current) return;
      const fuse = tag
        ? new Fuse(pool, {
            keys: ["searchableText", "title", "tags"],
            threshold: 0.35,
          })
        : fuseRef.current;

      setResults(fuse.search(q).map((r) => r.item).slice(0, 8));
    },
    [allEntries]
  );

  useEffect(() => {
    runSearch(query, activeTag);
    setActiveIndex(0);
  }, [query, activeTag, runSearch]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && results[activeIndex]) {
        router.push(results[activeIndex].url);
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, results, activeIndex, onClose, router]);


  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <svg
            className="h-4 w-4 shrink-0 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search posts, series, topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:text-zinc-100"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tag filter row */}
        {allTags.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto border-b border-zinc-100 px-4 py-2 dark:border-zinc-800">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  activeTag === tag
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">
              {query || activeTag ? "No results found." : "Start typing to search..."}
            </p>
          ) : (
            results.map((entry, i) => (
              <button
                key={entry.url}
                onClick={() => {
                  router.push(entry.url);
                  onClose();
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === activeIndex
                    ? "bg-zinc-100 dark:bg-zinc-800"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                }`}
              >
                <span
                  className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium ${TYPE_COLOR[entry.type]}`}
                >
                  {TYPE_LABEL[entry.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {entry.title}
                  </p>
                  {entry.description && (
                    <p className="truncate text-xs text-zinc-400">
                      {entry.description}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-zinc-100 px-4 py-2 dark:border-zinc-800">
          <span className="text-xs text-zinc-400">↑↓ navigate</span>
          <span className="text-xs text-zinc-400">↵ open</span>
          <span className="text-xs text-zinc-400">esc close</span>
        </div>
      </div>
    </div>
  );
}
