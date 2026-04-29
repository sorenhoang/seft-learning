---
title: "Information Architecture — From Sitemaps to API Design"
order: 3
tags: ["ux", "information-architecture", "api-design", "navigation"]
date: "2026-04-29"
draft: false
lang: "en"
---

There's a quiet truth most engineers stumble into after enough years of shipping: **the way you organize your URL structure is the same problem as the way you organize your nav bar.** Both are information architecture (IA). Both succeed or fail for the same reasons. And both reward the same kind of disciplined thinking.

This chapter argues that IA is one of the highest-leverage UX investments a developer can make — not because it's glamorous, but because every other part of the product inherits it. A confused IA produces a confused nav, confused URLs, confused breadcrumbs, confused docs, and confused users. Get this layer right and a lot of downstream UX problems quietly vanish.

---

## A definition that earns its keep

**Information architecture** is the practice of organizing, structuring, and labelling content so that users can find what they need and complete tasks. It's a UX discipline that predates the web — librarians have been doing it for centuries — but it's where engineers and designers most clearly speak the same language.

In a product, IA shows up in five places at once:

1. **Navigation** — primary nav, secondary nav, sidebar, breadcrumbs.
2. **URL structure** — `/projects/acme/issues/142` is an IA decision.
3. **Search and filters** — what categories exist, what facets are exposed.
4. **API design** — REST resource hierarchies are IA.
5. **Database schema** — how tables relate often mirrors IA, intentionally or not.

When IA is well-considered, all five align. When it isn't, you get the symptom every product has had at some point: the nav says "Projects > Issues", the URL says `/issues?project=acme`, the API says `/v2/projects/{id}/issues`, the database has `project_issues`, and the search bar can't filter by project at all. Five mental models, all subtly different, fighting each other.

---

## The three layers IA actually operates on

Most IA failures are confusion between three layers that should be kept distinct.

### Layer 1: Information structure

The actual *things* the product contains and how they relate. A B2B SaaS app might have:

```
Workspace
├── Members
├── Projects
│   ├── Issues
│   │   └── Comments
│   └── Documents
└── Settings
```

This is the data model, more or less. It's how the world really works in your product.

### Layer 2: Conceptual organization

How users *think* about that information. This often differs from the data model. A user might mentally group things as:

- "My stuff" (issues assigned to me, regardless of project)
- "Things needing attention" (issues with unread comments, pending PRs)
- "Reference" (settings, billing, team list)

This is why "My Tasks" or "Inbox" views exist. They cut across the data hierarchy.

### Layer 3: Navigation surface

The actual visible thing — the sidebar, the breadcrumbs, the URL. This is the *expression* of layers 1 and 2. It can prioritize one or the other, but it has to make a choice.

The trap: most products' nav is just a flat reflection of layer 1 (the data model), even though users live in layer 2 (their conceptual organization). The fix is to design layer 3 around layer 2 while keeping layer 1 intact under the hood.

**Linear** does this well. The sidebar leads with "Inbox" and "My Issues" (layer-2 views), with team and project nav below (layer-1 hierarchy). Users land in their conceptual home, then drill into structure when they need to.

---

## Cognitive load and Miller's 7±2

George Miller's 1956 paper *The Magical Number Seven, Plus or Minus Two* observed that working memory holds about 5–9 items. The number is debated and context-dependent, but the rough constraint is real: **users can't hold a long flat list of options in their head while making a choice.**

The IA implication is concrete:

- **Top-level nav: aim for 4–7 items.** More than that, you're losing people; fewer is usually fine.
- **Submenu items: aim for 5–9.** Beyond that, group into sub-sections or rethink the structure.
- **Maximum nav depth: 3 clicks.** "Settings → Billing → Plans → Compare" is the upper bound. Past that, users get lost.

These are guidelines, not laws — Notion has many sidebar items but groups them well; GitHub has dozens of settings pages but searches well. The principle remains: **deep nesting and long flat lists both fail, in different ways.**

---

## The five organizational schemes

When you sit down to organize content, there are essentially five schemes to choose from. Most products use a combination.

| Scheme | When to use | Example |
|---|---|---|
| **Alphabetical** | Users know the name, not the category | Contact lists, country pickers |
| **Chronological** | Users care about recency | Activity feeds, version history |
| **Geographic** | Spatial relationships matter | Maps, location-based search |
| **Topical** | Categories are stable and meaningful | Documentation, settings groups |
| **Audience** | Different roles need different views | "For Developers" vs "For Buyers" landing pages |

The two that consistently work for product UI are **topical** (for stable categories like Settings) and **chronological** (for activity-style feeds). Audience-based IA is powerful when you have clearly distinct user roles but adds complexity.

---

## Navigation patterns that work in 2026

Three patterns dominate modern product UI, and choosing between them is one of the highest-leverage IA decisions you'll make.

### Sidebar navigation (left or right)

The default for most B2B and prosumer apps. Linear, Notion, GitHub, Vercel all use it. Strengths: lots of room for hierarchy, persistent context, clear primary nav. Weaknesses: takes screen real estate, doesn't scale to mobile without redesign.

Use when: your product has clear hierarchy, users spend long sessions, you have ≥3 distinct sections.

### Top navigation

Common for content-heavy products and marketing sites. Stripe's docs, Vercel's marketing site, GitHub's profile pages. Strengths: full screen width for content, mobile-friendly. Weaknesses: limited to 5–7 items max, no room for deep hierarchy.

Use when: hierarchy is shallow, content needs full width, users navigate infrequently.

### Command palette / search-first

Linear, Notion, Slack, GitHub all have this as a power-user layer on top of visible nav. **`⌘K` is now an expected affordance in any product with more than ~10 navigable surfaces.** Strengths: scales to thousands of items, learnable, fast. Weaknesses: invisible to users who don't know it exists.

The combination — visible sidebar nav for discovery, command palette for speed — is the production-grade default in 2026.

---

## URLs are IA you wear in public

Every URL in your product is a public statement of how you've organized things. Think of URLs as the side-door view of your IA.

Three principles:

### 1. URLs should be human-readable

```
✓ /workspaces/acme/projects/website-redesign/issues/142
✗ /v2/wsp_8h3k2/proj_kxh82j/issue/142_xyz
```

Slug-based URLs make IA visible. They also serve a UX function: users can bookmark them, share them, mentally parse them, and even edit them by hand to navigate.

### 2. URL hierarchy should mirror conceptual hierarchy

If the user thinks "this issue belongs to a project, which belongs to a workspace," the URL should reflect that:

```
/{workspace}/projects/{project}/issues/{issue}
```

When the URL doesn't match the conceptual hierarchy, users get disoriented — back-button behaviour becomes unpredictable, deep-linking breaks, and SEO suffers.

### 3. URLs should be stable

Once you ship a URL, you've made a contract. Other people are bookmarking, linking, and embedding it. **Reorganizing URLs without redirects is one of the most common self-inflicted UX wounds in product engineering.**

If you must reorganize:

- Set up 301 redirects from old to new for every changed URL.
- Keep the redirects forever, not "for a year".
- Test the redirects in the same way you test routes.

---

## REST API design *is* IA

Here's the punchline of the chapter, which mostly answers itself once you've internalized the framing.

When you design a REST API, you're doing IA:

- Resource names → IA labels
- Resource hierarchies → IA structure
- Endpoint depth → IA navigation depth
- Query parameters → IA filters

A well-designed API feels like a well-designed nav. Stripe's API is a master class — every resource is a noun, hierarchies are shallow but expressive, names match user vocabulary (`charges`, `customers`, `subscriptions` — not `transaction_records` or `entity_billing_relationships`).

Two specific IA principles transfer cleanly to API design:

**Flat over nested when relationships are loose.** Stripe's API allows `GET /charges?customer=cus_123` instead of forcing `GET /customers/cus_123/charges`. The flatter form is more flexible — it also lets you pull charges across customers in one call. Reserve nesting for genuinely hierarchical relationships (like comments under an issue).

**Plural nouns, consistently.** `/customers`, `/invoices`, `/charges` — never mix `/customer` and `/invoices`. Same as your nav: don't have "Project" sit next to "Documents".

> **Going deeper.** This isn't just an aesthetic claim. When your API and your UI share the same IA, your engineering team and your product team end up with one mental model instead of two. The ripple effects are big — onboarding is faster, support tickets get categorized correctly, error messages can use the same names as UI labels. **One IA across all five surfaces** (nav, URL, search, API, DB) is the production goal.

---

## A practical IA checklist

When designing or auditing an IA:

1. **Can you sketch the structure on a napkin?** If it takes a whiteboard, it's too complex.
2. **Top-level nav: 4–7 items, no more.** Trim ruthlessly.
3. **Maximum depth: 3 clicks.** Past that, search beats hierarchy.
4. **URLs are human-readable and mirror the conceptual hierarchy.**
5. **The same name is used everywhere** — nav label, URL slug, API resource, DB table.
6. **Power users have a search/command palette.** No exceptions for products with >10 navigable surfaces.
7. **You've planned redirects for any future restructure.**

Run any IA proposal through these seven questions before committing it to code. Most failures are visible at this list.

---

## What you should walk away with

- **IA is one problem, expressed in five surfaces** — nav, URL, search, API, DB. Aligning them is a force multiplier; misaligning them is a long-term tax.
- **Conceptual organization (how users think) often differs from information structure (how data is stored).** Design the nav for the first, keep the second under the hood.
- **Constraints are real.** Top nav: 4–7 items. Depth: 3 levels. Past those, you need search.
- **Stripe's API is a UX artefact.** Read its docs as if you were studying a sitemap — most of the lessons transfer to your product.

In chapter 4 we narrow back in from whole-product IA to the visual-design layer of individual screens — specifically the dashboards and admin panels developers ship most often.

---

*Next up — Chapter 4: Visual Hierarchy for Dashboards and Admin Panels. Why the average internal tool feels like a wall of equally-loud elements, and what fixes it.*
