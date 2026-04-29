---
title: "Migrating from Ad-Hoc CSS to a Design System"
order: 7
tags: ["design-system", "migration", "refactoring", "css", "playbook"]
date: "2026-04-29"
draft: false
lang: "en"
---

Most design systems aren't built on greenfield. They're retrofitted onto codebases that have spent two or three years accumulating ad-hoc CSS — every PR adding a new shade of gray, every feature shipping a slightly-different button, every component a one-off reinvention of patterns that already exist three pages over. By the time the team accepts that "this needs a design system," the codebase has 47 distinct buttons, 12 modal implementations, and a CSS file that nobody understands.

This chapter is the playbook for that migration. It's structured around five phases that have to happen in roughly that order, the anti-patterns that derail teams every time, and the tooling that turns a hopeless rewrite into a tractable engineering project. The running `Button` component from chapters 2–6 finally gets to play its real role: the lever that pries an entire codebase into a design system.

---

## The "before" state

Before we walk through phases, take an honest inventory. The typical codebase that needs migration has:

- **No tokens.** Hex codes scattered through CSS. The same shade of gray appears as `#666`, `#666666`, `rgb(102, 102, 102)`, and `var(--text-muted)` across the codebase.
- **Component drift.** Three different `Button` implementations — one in the marketing site, one in the dashboard, one inherited from a Bootstrap migration in 2021. None match.
- **Semantic confusion.** "Primary blue" appears in 8 places, with values ranging from `#3b82f6` to `#4f46e5` to `#5b6cff`. Nobody can say which one is correct.
- **CSS spread across surfaces.** Tailwind in some files, CSS modules in others, styled-components legacy in a third. Each was the right answer at the time it was added.
- **Specific cargo-culted patterns.** `!important` everywhere because nobody can resolve specificity conflicts. Z-index numbers in the high thousands. Magic 17px paddings.

If your codebase has fewer than three of these, you may not need a full migration — targeted cleanup might be cheaper. If you have all five, this chapter is for you.

---

## The two failure modes

Before the playbook, the two ways teams fail at this migration. Both are common; both are predictable.

### Failure mode 1: The big-bang rewrite

"We'll spend Q2 building the design system, then Q3 migrating everything to it." Nine months later, the design system is half-built, the migration hasn't started, and feature work has been blocked the entire time. Eventually the project gets quietly cancelled.

Why it fails: **a design system built without real consumers gets the wrong abstractions.** You build a `<DataGrid>` that nobody wanted and miss the `<EmptyState>` that everyone needs. By the time you discover this, the team has lost momentum.

### Failure mode 2: The endless coexistence

"We'll start using the design system for new features, and migrate old code as we touch it." Two years later, 70% of the codebase is still on the old system. New engineers can't tell which is canonical. Every PR is a debate about which side of the line a change falls on. The team has two design systems indefinitely.

Why it fails: **without a forcing function, "as we touch it" never adds up.** Old code stays old. The migration has no end state.

The playbook below avoids both failure modes by **building the system in parallel with consumer migration** (not separately) and by **time-boxing the coexistence period** (not letting it run forever).

---

## The 5-phase playbook

### Phase 1: Audit

**Time: 1–2 weeks. Done by 1–2 engineers.**

Before designing anything, inventory what's there. Two artifacts come out of this phase:

- **A token audit:** every distinct colour, spacing value, font size, and border radius in the codebase, with counts. The output is usually horrifying — "we have 47 distinct grays" — and that's the point. The horror is the motivation.
- **A component audit:** every UI primitive that exists in more than one form. Buttons, inputs, modals, toasts, tabs. For each, note where the implementations live and how they differ.

Tools that help:

- **`whatthecss`** or **CSS Stats** — count distinct CSS properties.
- A grep script for hex codes: `grep -roE "#[0-9a-fA-F]{3,8}" src/ | sort -u | wc -l`. Same for `rgb()`, named colours, etc.
- A spreadsheet listing every component with screenshots side-by-side. Visual evidence carries weight in stakeholder conversations.

The audit's purpose is twofold: it scopes the migration realistically, and it produces a presentation that gets buy-in for the work.

### Phase 2: Tokens

**Time: 2–4 weeks. Designer + 1–2 engineers.**

The first thing to ship is the *token layer* — colours, spacing, typography, shadows. As covered in chapter 2: primitives, semantic, optional component-level.

Critically: **the tokens are derived from the audit, not from a clean-slate design.** You're not redesigning the product. You're picking the most-used grays and standardizing on those. If the audit shows 47 grays clustered around 4 actual values, the token table has 4 grays — not 9 derived from a pristine ramp.

The output of phase 2:

- A `tokens.ts` (or equivalent) file in the design-system package.
- CSS variables generated from it.
- A Tailwind config (or `@theme` block in Tailwind 4) referencing them.
- The design tool (Figma) updated to use the same token names.

**Critically, no components are built yet.** Phase 2 is just tokens. Resist the urge to start with `Button` — tokens have to come first because every component will consume them.

### Phase 3: Build core components

**Time: 4–8 weeks. 1–2 engineers full-time.**

Pick the **5–10 components used most**, per the audit. Build them with the patterns from chapter 3: variant props or compound, `cva` for variants, strict TypeScript types, all states designed.

A typical "first 10":

1. `Button`
2. `Input`
3. `Label`
4. `Card`
5. `Dialog`
6. `Toast`
7. `Badge`
8. `Tabs`
9. `Select`
10. `Tooltip`

These cover ~80% of UI usage in most apps. Add Storybook stories for each (chapter 4). Set up Chromatic. Ship to a `@yourorg/design-system` package or wherever your monorepo houses shared code.

**Don't build components that aren't already used in the codebase.** The temptation to "build a `<Calendar>` while we're here" is strong; resist. Components without consumers are dead code.

### Phase 4: Migrate page by page

**Time: 1–3 quarters. Distributed across the team.**

This is the killer phase — the one most migrations skip or do badly. The discipline:

- **One page at a time.** A whole settings page, a whole dashboard, a whole modal flow.
- **Migrated in a single PR per page** (if feasible).
- **Tracked publicly** — a spreadsheet or GitHub project showing which pages are migrated.
- **No new code in the old system** after a page is migrated. Locked down by lint rules.

Why page-by-page and not component-by-component?

- **Page-by-page is testable.** You can verify the migrated page works visually (with screenshots, with users) before moving on.
- **Component-by-component leaves orphans.** Migrate `Button` everywhere and you've touched 200 files in one PR — too risky to review.
- **Page-by-page produces visible progress.** Stakeholders see "5 pages migrated this week." Stakeholders never see "we migrated `Button` this week."

This phase is also where **codemods earn their keep**. Many migrations have a mechanical translation:

- `<button class="btn btn-primary">` → `<Button variant="primary">`
- `<div class="card-elevated">` → `<Card elevated>`
- `color: #333` → `color: var(--color-text-primary)`

Write the codemods, run them per-page, hand-fix the residue. A codemod that handles 80% of the translation makes the human work tractable.

### Phase 5: Lock down

**Time: ongoing, set up once.**

The migration only "ends" when **regression to the old system is impossible**. Mechanisms:

- **ESLint rules** that fail PRs containing direct hex codes, `bg-white`/`bg-black` strings, or imports from old style files.
- **Stylelint rules** for the same in CSS files.
- **A CI check** that fails the build if the size of the legacy CSS file goes up.
- **A deprecation plan** for the old system: when can it be deleted? Set a date.

```js
// .eslintrc.js — example rules
module.exports = {
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
        message: "Hex colors are not allowed. Use a token from @design-system/tokens.",
      },
    ],
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["legacy/styles/*", "old-design/*"],
            message: "Old design system is being removed. Use @design-system instead.",
          },
        ],
      },
    ],
  },
};
```

Without this enforcement layer, the migration unravels. New engineers, not knowing the migration history, will reach for the easiest path — often the old patterns. **Make the right path the easy path.**

---

## The "two systems coexist" interim

Phase 4 takes time. During it, **two systems run side by side**: old pages on the legacy CSS, new pages on the design system. This is uncomfortable but unavoidable.

Tactics that make coexistence less painful:

- **Namespace the design system imports.** All design-system code comes from `@design-system/*`; everything else is legacy by elimination.
- **Visually mark "migrated" status.** A simple GitHub README badge, an internal dashboard, or even a comment at the top of each page file: `// MIGRATED: 2026-04-29` or `// LEGACY: needs migration`.
- **Set a hard deadline for end of coexistence.** "Old system removed by end of Q3" is a forcing function. Without it, the work drags on indefinitely.
- **Resist building bridges.** "Components that work with both systems" sounds clever; it always becomes maintenance debt. Better to be temporarily inconsistent than permanently complex.

---

## Anti-patterns that derail migrations

Six common ways teams sabotage their own migration, in rough order of frequency:

### 1. Building too many components upfront

Phase 3's "5–10 most-used components" gets stretched to 30 because someone wants to be thorough. By the time phase 4 starts, three months have passed, and the team has lost momentum. **Ship the minimum viable set; add components as real consumers ask for them.**

### 2. Designing in isolation from the existing product

The token table is invented from scratch by a designer who hasn't looked at production. The new system clashes visually with everything that exists. Migration becomes a *redesign*, which is 10× more work. **Tokens come from the audit, not from a Figma blank page.**

### 3. Not investing in codemods

The team manually rewrites `<button class="btn btn-primary">` to `<Button variant="primary">` 800 times. The migration takes 4 quarters instead of 2. **Every recurring transformation is a codemod opportunity.**

### 4. Skipping the lock-down phase

Phase 5 is the boring part nobody wants to do. The migration "completes" without enforcement, and within 6 months legacy patterns creep back in. **The lock-down phase is the migration's seatbelt — invisible until the crash.**

### 5. Migrating pages partially

A page is "half-migrated" — header uses new components, body is old. The visual result is worse than either system alone, because the inconsistency is now visible. **All-or-nothing per page; complete the migration or revert.**

### 6. Ignoring dark mode in the migration

If the product will need dark mode (chapter 6), build the migration with dark-mode-ready tokens from day one. Adding dark mode after a migration just completed is essentially a second migration. **One pass through the codebase, not two.**

---

## A real-world template: the migration spreadsheet

The single most useful artifact of a successful migration is a public tracker. Something like:

| Page / Feature | Owner | Status | Migrated date | Notes |
|---|---|---|---|---|
| Dashboard / overview | Alice | ✅ Done | 2026-04-12 | Codemod handled buttons |
| Dashboard / sidebar | Alice | ✅ Done | 2026-04-15 | |
| Settings / profile | Bob | 🟡 In progress | — | Custom date picker — needs new component |
| Settings / billing | Bob | ⚪ Not started | — | |
| Settings / team | Carol | ✅ Done | 2026-04-20 | |
| Auth / login | — | ⚪ Not started | — | Low traffic; defer |
| Auth / signup | — | ⚪ Not started | — | High traffic; prioritize |

The spreadsheet does five things at once:

- **Forces estimation.** You can see how big the migration is.
- **Distributes ownership.** Every page has someone responsible.
- **Surfaces blockers.** "Needs new component" is a ticket against the design-system team.
- **Shows progress.** Stakeholders see momentum.
- **Sets the end state.** When every row is ✅, the migration is done.

Without this artifact, the migration becomes mythical — everyone agrees it's "in progress" forever.

> **Going deeper.** The migration spreadsheet works partly because it's *socially* visible — leadership can ask "what's our migration progress this quarter?" and get a number. A buried Jira epic does not have the same property. The unglamorous truth of design system migrations is that they're as much a coordination problem as a code problem; tools that broadcast progress (a public spreadsheet, a Slack-channel weekly update, a CI badge in the README showing migrated-page percentage) are doing the actual organizational work. Treat the tracker as a deliverable, not a side effect.

---

## When the migration is done

The real "done" criteria — not just "we shipped the system":

1. **Every page in the product uses design system components for the patterns the system covers.** The migration spreadsheet is all green.
2. **No new code can be added in the legacy system.** Lint rules enforce this.
3. **Legacy CSS file sizes are trending toward zero.** A graph in CI tracks this.
4. **A scheduled deletion date** for the legacy system is set and announced.
5. **Onboarding new engineers** points exclusively at the design system. No "and there's also this older code" caveat.

When all five are true, the migration is done. Until then, you're in some phase of it — even if the work is invisible.

---

## A migration checklist

If you're scoping or auditing a migration, these are the questions worth answering up front:

1. **Have you done the audit?** You need the numbers before scoping.
2. **Are tokens the first thing you'll ship, before any components?**
3. **Is your "first 10 components" list driven by audit data, not designer wishlist?**
4. **Do you have codemods planned for the most common mechanical changes?**
5. **Is there a public tracker showing which pages are migrated?**
6. **Do you have a hard deadline for legacy-system removal?**
7. **Are lint rules in place to prevent regression to old patterns?**
8. **Has the team agreed on the boundary between "migrated" and "in progress" — no half-migrated pages?**
9. **Are dark-mode-ready tokens part of the new system from day one?**
10. **Has the migration been costed honestly — including the 10–30% engineer time for ongoing maintenance after?**

A "no" on any of these is a tractable problem. A "no" on multiple is a sign the migration will stall.

---

## Closing the series

That's the path: from "we don't have a design system" to "we have one and most of our codebase uses it." Across seven chapters, the through-line:

- **Chapter 1** defined the system as a contract, expressed as code, that's canonical — and pushed back on the temptation to build one too early.
- **Chapter 2** established the foundation: tokens, three-tiered, semantic-first.
- **Chapter 3** designed the API layer: variant props, compound components, `asChild`, strict types.
- **Chapter 4** added the documentation and testing harness via Storybook.
- **Chapter 5** put the discipline around long-term evolution: semver, deprecation, codemods.
- **Chapter 6** tackled the most-requested cross-cutting feature: dark mode, done at the token layer.
- **Chapter 7** — this chapter — provided the playbook for migrating an existing codebase without grinding feature work to a halt.

The running `Button` example, traced from chapter 2 onward: from a pile of hardcoded Tailwind classes, to a token-aware component, to a typed variant API, to a Storybook-documented and Chromatic-tested artifact, to a v1→v2 with a codemod, to a dark-mode-aware version, to the lever that finally pries the rest of the codebase into the system.

What you have, after reading all seven, is a working framework for design systems as engineering work — not as an aesthetic exercise. The hardest parts are not technical: they're token naming (chapter 2), API design (chapter 3), versioning discipline (chapter 5), and the social work of migrating consumers (chapter 7). The technical parts are tractable; the rest is the actual work.

The rest is reps.

---

*Thanks for reading the series. If you ship even a small design system off the back of these chapters — or just stop accumulating new shades of gray — that's the whole point. Go ship it well.*
