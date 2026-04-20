"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { BookMeta } from "@/types/content";

interface SidebarProps {
  book: BookMeta;
}

export default function Sidebar({ book }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 lg:block 2xl:w-72">
      <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto pr-4">
        {/* Book title */}
        <Link
          href={`/${book.category}/${book.slug}`}
          className="mb-4 block text-sm font-semibold text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
        >
          {book.title}
        </Link>

        {/* Chapter list */}
        <nav className="space-y-0.5">
          {book.chapters.map((chapter) => {
            const href = `/${book.category}/${book.slug}/${chapter.slug}`;
            const active = pathname === href;
            return (
              <Link
                key={chapter.slug}
                href={href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-zinc-900 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                }`}
              >
                <span className="w-5 shrink-0 text-xs text-zinc-400">
                  {String(chapter.order).padStart(2, "0")}
                </span>
                <span className="truncate">{chapter.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Tags */}
        {book.tags.length > 0 && (
          <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
              Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {book.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${tag}`}
                  className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
