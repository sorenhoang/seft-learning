import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type {
  CategoryMeta,
  BookMeta,
  PostMeta,
  ChapterMeta,
  ContentTree,
  SearchEntry,
} from "@/types/content";

const CONTENT_DIR = path.join(process.cwd(), "content");
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// ─── Parsers ────────────────────────────────────────────────────────────────

function readFrontmatter(filePath: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { data, content };
}

function parseChapter(bookDir: string, filename: string): ChapterMeta {
  const { data } = readFrontmatter(path.join(bookDir, filename));
  return {
    slug: filename.replace(".md", ""),
    title: (data.title as string) || filename.replace(".md", ""),
    order: (data.order as number) ?? 99,
    tags: (data.tags as string[]) ?? [],
    date: (data.date as string) || "",
    draft: (data.draft as boolean) ?? false,
  };
}

function parseBook(categorySlug: string, bookSlug: string): BookMeta {
  const bookDir = path.join(CONTENT_DIR, categorySlug, bookSlug);
  const { data } = readFrontmatter(path.join(bookDir, "README.md"));

  const chapters = fs
    .readdirSync(bookDir)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .map((f) => parseChapter(bookDir, f))
    .filter((c) => !(IS_PRODUCTION && c.draft))
    .sort((a, b) => a.order - b.order);

  return {
    slug: bookSlug,
    category: categorySlug,
    title: (data.title as string) || bookSlug,
    description: (data.description as string) || "",
    tags: (data.tags as string[]) ?? [],
    cover: data.cover as string | undefined,
    date: (data.date as string) || "",
    draft: (data.draft as boolean) ?? false,
    chapters,
  };
}

function parsePost(categorySlug: string, filename: string): PostMeta {
  const { data } = readFrontmatter(
    path.join(CONTENT_DIR, categorySlug, filename)
  );
  const slug = filename.replace(".md", "");
  return {
    slug,
    category: categorySlug,
    title: (data.title as string) || slug,
    description: (data.description as string) || "",
    tags: (data.tags as string[]) ?? [],
    cover: data.cover as string | undefined,
    date: (data.date as string) || "",
    draft: (data.draft as boolean) ?? false,
  };
}

function parseCategory(categorySlug: string): CategoryMeta {
  const categoryDir = path.join(CONTENT_DIR, categorySlug);
  const readmePath = path.join(categoryDir, "README.md");
  const { data } = readFrontmatter(readmePath);

  const entries = fs.readdirSync(categoryDir, { withFileTypes: true });

  const books: BookMeta[] = entries
    .filter((e) => e.isDirectory())
    .map((e) => parseBook(categorySlug, e.name))
    .filter((b) => !(IS_PRODUCTION && b.draft));

  const posts: PostMeta[] = entries
    .filter(
      (e) =>
        e.isFile() && e.name.endsWith(".md") && e.name !== "README.md"
    )
    .map((e) => parsePost(categorySlug, e.name))
    .filter((p) => !(IS_PRODUCTION && p.draft));

  return {
    slug: categorySlug,
    title: (data.title as string) || categorySlug,
    description: (data.description as string) || "",
    cover: data.cover as string | undefined,
    books,
    posts,
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function buildContentTree(): ContentTree {
  if (!fs.existsSync(CONTENT_DIR)) {
    return { categories: [], allTags: [] };
  }

  const categories = fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => parseCategory(d.name));

  const allTags = Array.from(
    new Set(
      categories.flatMap((cat) => [
        ...cat.books.flatMap((b) => b.tags),
        ...cat.posts.flatMap((p) => p.tags),
      ])
    )
  ).sort();

  return { categories, allTags };
}

export function buildSearchIndex(tree: ContentTree): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const category of tree.categories) {
    entries.push({
      type: "category",
      title: category.title,
      description: category.description,
      url: `/${category.slug}`,
      searchableText: `${category.title} ${category.description}`,
    });

    for (const book of category.books) {
      const chapterTitles = book.chapters.map((c) => c.title).join(" ");
      entries.push({
        type: "book",
        title: book.title,
        description: book.description,
        url: `/${category.slug}/${book.slug}`,
        category: category.slug,
        tags: book.tags,
        searchableText: `${book.title} ${book.description} ${chapterTitles}`,
      });
    }

    for (const post of category.posts) {
      entries.push({
        type: "post",
        title: post.title,
        description: post.description,
        url: `/${category.slug}/${post.slug}`,
        category: category.slug,
        tags: post.tags,
        searchableText: `${post.title} ${post.description}`,
      });
    }
  }

  return entries;
}

export function getChapterContent(
  categorySlug: string,
  bookSlug: string,
  chapterSlug: string
): { content: string; data: Record<string, unknown> } {
  const filePath = path.join(
    CONTENT_DIR,
    categorySlug,
    bookSlug,
    `${chapterSlug}.md`
  );
  return readFrontmatter(filePath);
}

export function getPostContent(
  categorySlug: string,
  postSlug: string
): { content: string; data: Record<string, unknown> } {
  const filePath = path.join(CONTENT_DIR, categorySlug, `${postSlug}.md`);
  return readFrontmatter(filePath);
}

export function getBookReadme(
  categorySlug: string,
  bookSlug: string
): { content: string; data: Record<string, unknown> } {
  const filePath = path.join(
    CONTENT_DIR,
    categorySlug,
    bookSlug,
    "README.md"
  );
  return readFrontmatter(filePath);
}

export function getCategoryReadme(
  categorySlug: string
): { content: string; data: Record<string, unknown> } {
  const filePath = path.join(CONTENT_DIR, categorySlug, "README.md");
  return readFrontmatter(filePath);
}

// Determine if a slug under a category is a book (directory) or post (file)
export function resolveSlugType(
  categorySlug: string,
  slug: string
): "book" | "post" | null {
  const dirPath = path.join(CONTENT_DIR, categorySlug, slug);
  const filePath = path.join(CONTENT_DIR, categorySlug, `${slug}.md`);

  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    return "book";
  }
  if (fs.existsSync(filePath)) {
    return "post";
  }
  return null;
}
