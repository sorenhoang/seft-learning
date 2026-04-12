export interface ChapterMeta {
  slug: string;
  title: string;
  order: number;
  tags: string[];
  date: string;
  draft?: boolean;
}

export interface BookMeta {
  slug: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
  cover?: string;
  date: string;
  draft?: boolean;
  chapters: ChapterMeta[];
}

export interface PostMeta {
  slug: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
  cover?: string;
  date: string;
  draft?: boolean;
}

export interface CategoryMeta {
  slug: string;
  title: string;
  description: string;
  cover?: string;
  books: BookMeta[];
  posts: PostMeta[];
}

export interface ContentTree {
  categories: CategoryMeta[];
  allTags: string[];
}

export type SearchEntryType = "category" | "book" | "post";

export interface SearchEntry {
  type: SearchEntryType;
  title: string;
  description: string;
  url: string;
  category?: string;
  tags?: string[];
  searchableText: string;
}
