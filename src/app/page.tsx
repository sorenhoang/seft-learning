import Link from "next/link";
import type { Metadata } from "next";
import { buildContentTree } from "@/lib/content";
import BookCard from "@/components/content/BookCard";
import PostCard from "@/components/content/PostCard";

export const metadata: Metadata = {
  title: "Soren Learning",
  description: "Personal knowledge base — technical notes, product thinking, design, and growth.",
};

export default function HomePage() {
  const tree = buildContentTree();

  const recentPosts = tree.categories
    .flatMap((cat) => cat.posts)
    .sort((a, b) => (b.date > a.date ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Hero */}
      <div className="mb-12">
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Soren Learning
        </h1>
        <p className="max-w-xl text-zinc-500 dark:text-zinc-400">
          A personal collection of technical notes, product thinking, design principles, and growth frameworks.
        </p>
      </div>

      {/* Categories */}
      <section className="mb-14">
        <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Categories
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tree.categories.map((cat) => {
            const count = cat.books.length + cat.posts.length;
            return (
              <Link
                key={cat.slug}
                href={`/${cat.slug}`}
                className="group rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <h3 className="mb-1.5 font-semibold text-zinc-900 group-hover:text-zinc-600 dark:text-zinc-100 dark:group-hover:text-zinc-300">
                  {cat.title}
                </h3>
                <p className="mb-3 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {cat.description}
                </p>
                <span className="text-xs text-zinc-400">
                  {count} item{count !== 1 ? "s" : ""}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Series */}
      {tree.categories.some((c) => c.books.length > 0) && (
        <section className="mb-14">
          <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Series
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tree.categories
              .flatMap((cat) => cat.books)
              .map((book) => (
                <BookCard key={`${book.category}/${book.slug}`} book={book} />
              ))}
          </div>
        </section>
      )}

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <section className="mb-14">
          <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Recent Posts
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentPosts.map((post) => (
              <PostCard key={`${post.category}/${post.slug}`} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Tag cloud */}
      {tree.allTags.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {tree.allTags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${tag}`}
                className="rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
              >
                {tag}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
