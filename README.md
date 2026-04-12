# Soren Learning

Personal knowledge base — technical notes, product thinking, design principles, and growth frameworks.

## Content Guide

All content lives in the `/content/` folder. The site rebuilds automatically on every `git push` — no CMS, no API, just Markdown files.

### Content types

There are three types of content:

| Type | Structure | URL |
|---|---|---|
| **Category** | A folder with `README.md` | `/technical` |
| **Series** | A subfolder inside a category | `/technical/system-design` |
| **Post** | A single `.md` file inside a category | `/technical/docker-tips` |

---

### Adding a new Category

Create a folder and a `README.md` inside it:

```
content/
  my-new-category/
    README.md
```

**`README.md` frontmatter:**

```yaml
---
title: "My New Category"
description: "A short description shown on the home page and category card."
---

Optional body text shown on the category page.
```

---

### Adding a standalone Post

Create a `.md` file directly inside a category folder:

```
content/technical/my-new-post.md
```

**Frontmatter:**

```yaml
---
title: "My Post Title"
description: "A short summary shown on cards and in search results."
tags: ["tag-one", "tag-two"]
date: "2024-04-01"
draft: false
---

Your content here...
```

> Set `draft: true` to hide a post in production while writing it. It will still be visible in local dev.

---

### Adding a Series (multi-chapter)

Create a subfolder inside a category with a `README.md` (series overview) and one file per chapter:

```
content/technical/
  my-series/
    README.md          ← series overview
    01-introduction.md
    02-deep-dive.md
    03-conclusion.md
```

**Series `README.md` frontmatter:**

```yaml
---
title: "My Series Title"
description: "What this series covers."
tags: ["tag-one", "tag-two"]
date: "2024-04-01"
draft: false
---

Overview content shown on the series page before the chapter list.
```

**Chapter frontmatter:**

```yaml
---
title: "Introduction"
order: 1
tags: ["tag-one"]
date: "2024-04-01"
draft: false
---

Chapter content here...
```

> `order` controls the position in the sidebar. Chapters are sorted ascending by this number. Use gaps (`1, 3, 5`) if you plan to insert chapters later.

---

### Adding images

Put images in `public/images/` and reference them in Markdown:

```
public/
  images/
    technical/
      my-post/
        diagram.png
```

```markdown
![Diagram description](/images/technical/my-post/diagram.png)
```

---

### Markdown features

| Feature | Syntax |
|---|---|
| GitHub Flavored Markdown | Tables, task lists, strikethrough |
| Syntax highlighting | Fenced code blocks with language tag |
| Math (inline) | `$E = mc^2$` |
| Math (block) | `$$\sum_{i=1}^{n} x_i$$` |
| Heading anchors | Auto-generated from heading text |

**Code block example:**

````markdown
```python
def hello():
    print("Hello, world!")
```
````

**Math example:**

```markdown
The formula is $f(x) = x^2$ inline, or as a block:

$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

---

### Frontmatter reference

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | yes | Displayed as page heading and in search |
| `description` | string | recommended | Shown on cards and in search results |
| `tags` | string[] | optional | Used for tag pages and search filtering |
| `order` | number | chapters only | Sort order in the sidebar |
| `date` | string | optional | Format: `YYYY-MM-DD` |
| `draft` | boolean | optional | `true` = hidden in production |

---

### Current categories

| Folder | Topic |
|---|---|
| `technical/` | Engineering, system design, DevOps |
| `product-mindset/` | Product strategy, decision making |
| `design-ux/` | Visual design, UX principles |
| `growth-softskill/` | Productivity, learning, soft skills |

---

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Changes to Markdown files are picked up on the next page navigation (no hot-reload for content — refresh the page).

## Deployment

Push to `main` → Vercel rebuilds automatically. New content is live within ~45 seconds.

Set `NEXT_PUBLIC_SITE_URL` in Vercel environment variables to your production domain (see `.env.example`).
