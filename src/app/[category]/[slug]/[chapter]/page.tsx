import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { buildContentTree, getChapterContent } from "@/lib/content";
import { markdownToHtml, extractToc } from "@/lib/markdown";
import Sidebar from "@/components/layout/Sidebar";
import MobileSidebar from "@/components/layout/MobileSidebar";
import MarkdownRenderer from "@/components/content/MarkdownRenderer";
import TableOfContents from "@/components/content/TableOfContents";
import AudioPlayer from "@/components/content/AudioPlayer";

interface PageProps {
  params: Promise<{ category: string; slug: string; chapter: string }>;
}

export async function generateStaticParams() {
  const tree = buildContentTree();
  const paths: { category: string; slug: string; chapter: string }[] = [];

  for (const cat of tree.categories) {
    for (const book of cat.books) {
      for (const ch of book.chapters) {
        paths.push({ category: cat.slug, slug: book.slug, chapter: ch.slug });
      }
    }
  }

  return paths;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, slug, chapter } = await params;
  const tree = buildContentTree();
  const cat = tree.categories.find((c) => c.slug === category);
  const book = cat?.books.find((b) => b.slug === slug);
  const ch = book?.chapters.find((c) => c.slug === chapter);
  if (!ch || !book) return {};
  const ogUrl = `/api/og?title=${encodeURIComponent(ch.title)}&type=chapter&category=${encodeURIComponent(book.title)}`;
  return {
    title: `${ch.title} — ${book.title}`,
    description: `Chapter ${ch.order} of "${book.title}"`,
    openGraph: { images: [{ url: ogUrl, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ChapterPage({ params }: PageProps) {
  const { category, slug, chapter } = await params;

  const tree = buildContentTree();
  const cat = tree.categories.find((c) => c.slug === category);
  if (!cat) notFound();

  const book = cat.books.find((b) => b.slug === slug);
  if (!book) notFound();

  const currentIndex = book.chapters.findIndex((c) => c.slug === chapter);
  if (currentIndex === -1) notFound();

  const currentChapter = book.chapters[currentIndex];
  const prevChapter = book.chapters[currentIndex - 1] ?? null;
  const nextChapter = book.chapters[currentIndex + 1] ?? null;

  const { content, data: frontmatter } = getChapterContent(category, slug, chapter);
  const html = await markdownToHtml(content);
  const toc = extractToc(content);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:pb-10">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/" className="hover:text-zinc-600 dark:hover:text-zinc-200">Home</Link>
        <span>/</span>
        <Link href={`/${category}`} className="hover:text-zinc-600 dark:hover:text-zinc-200">
          {cat.title}
        </Link>
        <span>/</span>
        <Link href={`/${category}/${slug}`} className="hover:text-zinc-600 dark:hover:text-zinc-200">
          {book.title}
        </Link>
        <span>/</span>
        <span className="text-zinc-700 dark:text-zinc-300">{currentChapter.title}</span>
      </nav>

      {/* 3-column layout: Sidebar | Content | TOC */}
      <div className="flex gap-8">
        {/* Left sidebar — chapter nav */}
        <Sidebar book={book} />

        {/* Main content */}
        <article className="min-w-0 flex-1">
          <header className="mb-8">
            <p className="mb-1 text-sm font-medium text-zinc-400">
              Chapter {currentChapter.order}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {currentChapter.title}
            </h1>
            {currentChapter.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {currentChapter.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${tag}`}
                    className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </header>

          <AudioPlayer content={content} lang={frontmatter.lang as string | undefined} />

          <MarkdownRenderer html={html} />

          {/* Prev / Next navigation */}
          <nav className="mt-12 flex items-center justify-between border-t border-zinc-100 pt-8 dark:border-zinc-800">
            {prevChapter ? (
              <Link
                href={`/${category}/${slug}/${prevChapter.slug}`}
                className="group flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <div>
                  <p className="text-xs text-zinc-400">Previous</p>
                  <p className="font-medium text-zinc-700 group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-zinc-100">
                    {prevChapter.title}
                  </p>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {nextChapter ? (
              <Link
                href={`/${category}/${slug}/${nextChapter.slug}`}
                className="group flex items-center gap-2 text-right text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <div>
                  <p className="text-xs text-zinc-400">Next</p>
                  <p className="font-medium text-zinc-700 group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-zinc-100">
                    {nextChapter.title}
                  </p>
                </div>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <div />
            )}
          </nav>
        </article>

        {/* Right TOC — hidden on smaller screens */}
        {toc.length > 0 && (
          <div className="hidden xl:block">
            <TableOfContents toc={toc} />
          </div>
        )}
      </div>

      {/* Mobile chapter drawer — visible only on mobile */}
      <MobileSidebar book={book} />
    </div>
  );
}
