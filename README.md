# Soren Learning

Personal knowledge base — technical notes, product thinking, design principles, and growth frameworks.

## Content Guide

All content lives in the `/content/` folder. The site rebuilds automatically on every `git push` — no CMS, no API, just Markdown files.

### Content terminology

| Term | What it is | Example URL |
|---|---|---|
| **category** | A top-level folder with a `README.md` | `/technical` |
| **series** | A subfolder inside a category — contains chapters | `/technical/system-design-fundamentals` |
| **chapter** | A single `.md` file inside a series | `/technical/system-design-fundamentals/01-introduction` |
| **post** | A standalone `.md` file directly inside a category | `/technical/docker-essentials` |

The full hierarchy: `category → series → chapter` and `category → post`.

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
lang: "en"
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
lang: "en"
---

Chapter content here...
```

> Do **not** repeat the chapter title as an `# H1` in the body — the page already renders it as the H1. Start your body at `##`.

> `order` controls the position in the sidebar. Chapters are sorted ascending by this number. Use gaps (`1, 3, 5`) if you plan to insert chapters later.

---

### Adding images

All images are hosted on **Cloudinary** — do not commit image files to this repo.

**Steps:**
1. Upload your image to [Cloudinary](https://cloudinary.com) (account: `dmwr6giop`)
2. Copy the uploaded URL and insert `f_auto,q_auto` into the path before the version segment
3. Paste it into your Markdown

**URL format:**
```
https://res.cloudinary.com/dmwr6giop/image/upload/f_auto,q_auto/{version}/{filename}
```

**Example:**
```markdown
![Diagram description](https://res.cloudinary.com/dmwr6giop/image/upload/f_auto,q_auto/v1234567890/my-diagram_abc123.png)
```

> `f_auto` — delivers WebP or AVIF automatically based on the browser.  
> `q_auto` — compresses to optimal quality without visible loss.  
> Never use local paths like `/images/...` — they will not work.

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
| `description` | string | recommended | Shown on cards and in search results. **Do not set on chapters** — it is ignored. |
| `tags` | string[] | optional | Used for tag pages and search filtering. See note below. |
| `order` | number | chapters only | Sort order in the sidebar |
| `date` | string | optional | Format: `YYYY-MM-DD` |
| `draft` | boolean | optional | `true` = hidden in production |
| `lang` | string | optional | `"en"` or `"vi"` — passed to the audio player. Defaults to `"en"`. |
| `cover` | string | optional | Cover image URL (declared but not yet rendered). |

> **Tag formatting:** use **lowercase-kebab-case** only (e.g. `"ci-cd"`, not `"CI/CD"` or `"CiCd"`). Tag comparison is case-sensitive — `"Agile"` and `"agile"` will create two separate tag pages.

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
