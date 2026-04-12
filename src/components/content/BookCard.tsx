import Link from "next/link";
import type { BookMeta } from "@/types/content";

interface BookCardProps {
  book: BookMeta;
}

export default function BookCard({ book }: BookCardProps) {
  const href = `/${book.category}/${book.slug}`;
  const firstChapter =
    book.chapters.length > 0
      ? `/${book.category}/${book.slug}/${book.chapters[0].slug}`
      : href;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <Link href={href} className="group mb-2 block">
        <h3 className="font-semibold text-zinc-900 group-hover:text-zinc-600 dark:text-zinc-100 dark:group-hover:text-zinc-300">
          {book.title}
        </h3>
      </Link>

      {book.description && (
        <p className="mb-3 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
          {book.description}
        </p>
      )}

      {/* Chapter count */}
      <p className="mb-3 text-sm text-zinc-400">
        {book.chapters.length} chapter{book.chapters.length !== 1 ? "s" : ""}
      </p>

      {/* Tags */}
      {book.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {book.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <Link
        href={firstChapter}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
      >
        Start reading
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
