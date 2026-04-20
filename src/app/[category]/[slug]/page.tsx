import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  buildContentTree,
  resolveSlugType,
  getBookReadme,
  getPostContent,
} from "@/lib/content";
import { markdownToHtml, extractToc } from "@/lib/markdown";
import { formatDate } from "@/lib/date";
import MarkdownRenderer from "@/components/content/MarkdownRenderer";
import TableOfContents from "@/components/content/TableOfContents";

interface PageProps {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateStaticParams() {
  const tree = buildContentTree();
  const paths: { category: string; slug: string }[] = [];

  for (const cat of tree.categories) {
    for (const book of cat.books) {
      paths.push({ category: cat.slug, slug: book.slug });
    }
    for (const post of cat.posts) {
      paths.push({ category: cat.slug, slug: post.slug });
    }
  }

  return paths;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const tree = buildContentTree();
  const cat = tree.categories.find((c) => c.slug === category);
  if (!cat) return {};

  const book = cat.books.find((b) => b.slug === slug);
  if (book) {
    const ogUrl = `/api/og?title=${encodeURIComponent(book.title)}&type=book&category=${encodeURIComponent(cat.title)}`;
    return {
      title: book.title,
      description: book.description,
      openGraph: { images: [{ url: ogUrl, width: 1200, height: 630 }] },
      twitter: { card: "summary_large_image" },
    };
  }

  const post = cat.posts.find((p) => p.slug === slug);
  if (post) {
    const ogUrl = `/api/og?title=${encodeURIComponent(post.title)}&type=post&category=${encodeURIComponent(cat.title)}`;
    return {
      title: post.title,
      description: post.description,
      openGraph: { images: [{ url: ogUrl, width: 1200, height: 630 }] },
      twitter: { card: "summary_large_image" },
    };
  }

  return {};
}

export default async function SlugPage({ params }: PageProps) {
  const { category, slug } = await params;
  const type = resolveSlugType(category, slug);
  if (!type) notFound();

  const tree = buildContentTree();
  const cat = tree.categories.find((c) => c.slug === category);
  if (!cat) notFound();

  if (type === "book") {
    const book = cat.books.find((b) => b.slug === slug);
    if (!book) notFound();

    const { content } = getBookReadme(category, slug);
    const html = await markdownToHtml(content);
    const toc = extractToc(content);
    const firstChapter = book.chapters[0];

    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-zinc-400">
          <Link href="/" className="hover:text-zinc-600 dark:hover:text-zinc-200">Home</Link>
          <span>/</span>
          <Link href={`/${category}`} className="hover:text-zinc-600 dark:hover:text-zinc-200">
            {cat.title}
          </Link>
          <span>/</span>
          <span className="text-zinc-700 dark:text-zinc-300">{book.title}</span>
        </nav>

        <div className="flex gap-10">
          {/* Main content */}
          <div className="min-w-0 flex-1">
            <div className="mb-6">
              {book.cover && (
                <img
                  src={book.cover}
                  alt={book.title}
                  className="mb-6 w-full rounded-xl object-cover"
                  style={{ maxHeight: "360px" }}
                />
              )}
              <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {book.title}
              </h1>
              {book.description && (
                <p className="text-zinc-500 dark:text-zinc-400">{book.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {book.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${tag}`}
                    className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Chapter list */}
            <div className="mb-8 rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {book.chapters.length} Chapters
              </h2>
              <ol className="space-y-1">
                {book.chapters.map((ch) => (
                  <li key={ch.slug}>
                    <Link
                      href={`/${category}/${slug}/${ch.slug}`}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    >
                      <span className="w-5 text-xs text-zinc-400">
                        {String(ch.order).padStart(2, "0")}
                      </span>
                      {ch.title}
                    </Link>
                  </li>
                ))}
              </ol>
            </div>

            {/* README content */}
            {content.trim() && <MarkdownRenderer html={html} />}

            {/* Start button */}
            {firstChapter && (
              <div className="mt-8">
                <Link
                  href={`/${category}/${slug}/${firstChapter.slug}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  Start reading
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>

          {/* TOC — hidden on smaller screens */}
          {toc.length > 0 && (
            <div className="hidden xl:block">
              <TableOfContents toc={toc} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Standalone post
  const post = cat.posts.find((p) => p.slug === slug);
  if (!post) notFound();

  const { content } = getPostContent(category, slug);
  const html = await markdownToHtml(content);
  const toc = extractToc(content);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/" className="hover:text-zinc-600 dark:hover:text-zinc-200">Home</Link>
        <span>/</span>
        <Link href={`/${category}`} className="hover:text-zinc-600 dark:hover:text-zinc-200">
          {cat.title}
        </Link>
        <span>/</span>
        <span className="text-zinc-700 dark:text-zinc-300">{post.title}</span>
      </nav>

      <div className="flex gap-10">
        {/* Main content */}
        <article className="min-w-0 flex-1">
          <header className="mb-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {post.title}
            </h1>
            {post.description && (
              <p className="mb-3 text-zinc-500 dark:text-zinc-400">{post.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              {post.date && (
                <time className="text-sm text-zinc-400">
                  {formatDate(post.date)}
                </time>
              )}
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${tag}`}
                    className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </header>

          <MarkdownRenderer html={html} />
        </article>

        {/* TOC — hidden on smaller screens */}
        {toc.length > 0 && (
          <div className="hidden xl:block">
            <TableOfContents toc={toc} />
          </div>
        )}
      </div>
    </div>
  );
}
