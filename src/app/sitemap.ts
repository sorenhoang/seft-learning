import type { MetadataRoute } from "next";
import { buildContentTree } from "@/lib/content";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const tree = buildContentTree();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
  ];

  for (const cat of tree.categories) {
    entries.push({
      url: `${BASE_URL}/${cat.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });

    for (const book of cat.books) {
      entries.push({
        url: `${BASE_URL}/${cat.slug}/${book.slug}`,
        lastModified: book.date ? new Date(book.date) : now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
      for (const ch of book.chapters) {
        entries.push({
          url: `${BASE_URL}/${cat.slug}/${book.slug}/${ch.slug}`,
          lastModified: ch.date ? new Date(ch.date) : now,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }

    for (const post of cat.posts) {
      entries.push({
        url: `${BASE_URL}/${cat.slug}/${post.slug}`,
        lastModified: post.date ? new Date(post.date) : now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
