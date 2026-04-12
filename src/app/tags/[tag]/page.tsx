import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { buildContentTree } from "@/lib/content";
import BookCard from "@/components/content/BookCard";
import PostCard from "@/components/content/PostCard";

interface PageProps {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  const tree = buildContentTree();
  return tree.allTags.map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `#${tag}`,
    description: `All content tagged with "${tag}"`,
  };
}

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params;
  const tree = buildContentTree();

  if (!tree.allTags.includes(tag)) notFound();

  const matchingBooks = tree.categories
    .flatMap((cat) => cat.books)
    .filter((book) => book.tags.includes(tag));

  const matchingPosts = tree.categories
    .flatMap((cat) => cat.posts)
    .filter((post) => post.tags.includes(tag));

  const total = matchingBooks.length + matchingPosts.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/" className="hover:text-zinc-600 dark:hover:text-zinc-200">Home</Link>
        <span>/</span>
        <span className="text-zinc-700 dark:text-zinc-300">#{tag}</span>
      </nav>

      <div className="mb-10">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          #{tag}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          {total} item{total !== 1 ? "s" : ""} tagged with &quot;{tag}&quot;
        </p>
      </div>

      {/* Other tags */}
      <div className="mb-10 flex flex-wrap gap-2">
        {tree.allTags
          .filter((t) => t !== tag)
          .map((t) => (
            <Link
              key={t}
              href={`/tags/${t}`}
              className="rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
            >
              {t}
            </Link>
          ))}
      </div>

      {matchingBooks.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-5 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Series
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matchingBooks.map((book) => (
              <BookCard key={`${book.category}/${book.slug}`} book={book} />
            ))}
          </div>
        </section>
      )}

      {matchingPosts.length > 0 && (
        <section>
          <h2 className="mb-5 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Posts
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matchingPosts.map((post) => (
              <PostCard key={`${post.category}/${post.slug}`} post={post} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
