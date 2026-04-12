"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { BookMeta } from "@/types/content";

interface MobileSidebarProps {
  book: BookMeta;
}

export default function MobileSidebar({ book }: MobileSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const currentIndex = book.chapters.findIndex(
    (ch) => pathname === `/${book.category}/${book.slug}/${ch.slug}`
  );
  const current = book.chapters[currentIndex];

  return (
    <>
      {/* Sticky bottom bar — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-200 bg-white/95 backdrop-blur lg:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between px-4 py-3"
        >
          <div className="min-w-0 text-left">
            <p className="text-xs text-zinc-400">
              {book.title} · Chapter {current?.order ?? "—"}
            </p>
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {current?.title ?? "Overview"}
            </p>
          </div>
          <div className="ml-3 flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-zinc-400">
              {currentIndex + 1} / {book.chapters.length}
            </span>
            <svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
        </button>
      </div>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Drawer from bottom */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 pb-3 dark:border-zinc-800">
              <div>
                <p className="text-xs text-zinc-400">{book.title}</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {book.chapters.length} chapters
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chapter list */}
            <nav className="p-3">
              {book.chapters.map((ch) => {
                const href = `/${book.category}/${book.slug}/${ch.slug}`;
                const active = pathname === href;
                return (
                  <Link
                    key={ch.slug}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
                      active
                        ? "bg-zinc-900 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="w-5 shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                      {String(ch.order).padStart(2, "0")}
                    </span>
                    {ch.title}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom padding so content isn't hidden behind home indicator */}
            <div className="h-6" />
          </div>
        </div>
      )}
    </>
  );
}
