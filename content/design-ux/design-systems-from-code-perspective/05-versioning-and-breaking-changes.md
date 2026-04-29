---
title: "Versioning and Breaking Changes — The Long-Game Discipline"
order: 5
tags: ["design-system", "versioning", "semver", "breaking-changes", "migration"]
date: "2026-04-29"
draft: false
lang: "en"
---

A design system has a brutal lifecycle. The first six months are exciting — a clean codebase, a small team, every change is greenfield. Then consumers arrive. By month twelve, three teams have shipped production UI built on the system, and the design lead has decided the colour palette needs rethinking. Now what?

The answer to "now what?" is the difference between a design system that lasts a decade and one that gets quietly abandoned by year two. **Versioning discipline is the most important non-technical skill** in design system work, and it's the single area where most home-grown systems fall down.

This chapter is about how to version a design system, what counts as a breaking change vs not, how to deprecate gracefully, and the tooling — codemods, deprecation warnings, version coexistence — that lets a system actually evolve without taking down its consumers.

---

## Why versioning matters more for design systems

A typical npm package has consumers who control their own upgrade timing. They upgrade when they have a feature need; if your v2 breaks them, they stay on v1 until they're ready.

Design systems don't have that luxury, because the *visual identity* of the product depends on the system being current. If the marketing site is on v3 and the dashboard is on v2, users see two different visual languages, and you've defeated the entire point of the system. Every consumer needs to be on (close to) the same version, all the time.

This means:

- **Breaking changes have an organizational cost** that backend libraries don't.
- **Deprecations need real lead time** — at least a quarter, often two.
- **Migration tooling has to exist** before you can make breaking changes credibly.

A design system without versioning discipline isn't a system at all — it's a moving target consumers eventually stop following.

---

## Semver, applied

The standard contract: `MAJOR.MINOR.PATCH`. Applied to a design system:

| Version bump | What it means |
|---|---|
| **Patch** (1.0.0 → 1.0.1) | Bug fixes that don't change the API or visual output meaningfully |
| **Minor** (1.0.0 → 1.1.0) | New components, new props, new variants — purely additive |
| **Major** (1.0.0 → 2.0.0) | Anything that requires consumers to change their code or that visually shifts an existing component |

The boundaries get fuzzy in practice. A few hard cases worth pre-deciding as a team:

### Visual-only changes — minor or major?

If `Button`'s padding changes from `12px` to `14px`, no consumer code changes. Is it a minor bump or a major bump?

The strict-semver answer: **it's a major bump.** Visual changes affect screenshots, snapshots, and possibly downstream layouts (a 2px padding change on a button could shift content reflow on a dense page).

The pragmatic answer most teams adopt: **visual tweaks within a "polish" range are minor; visual changes that consumers will actually notice are major.** Define the boundary explicitly. "If a designer would call it a tweak, it's minor; if they'd call it a redesign, it's major."

### Token renames — always major

`color.text.primary` → `color.text.body` is a breaking change even if the value is identical. Anyone using the old name breaks. **Treat token names with even more rigor than component prop names.**

### New required prop on existing component — always major

Adding `<Button required="someprop" />` to an existing Button breaks every existing usage. Major bump, period. (Better: make it optional, with a default that preserves current behaviour.)

### Adding a new component — minor

A new `<DatePicker>` doesn't break existing consumers. Minor bump.

### Bug fixes that change behaviour — judgment call

If `Tabs` previously had a bug where keyboard navigation skipped disabled tabs, and you fix it, some consumers may have built workarounds. Strictly, fixing user-observable behaviour is breaking. Pragmatically, most teams ship it as a patch with a CHANGELOG note. Document your team's stance.

---

## What's a breaking change, exactly

A useful operational definition for a design system: **a change is breaking if a consumer who upgrades without changing their code will see different output, see new errors, or fail to compile.**

Run any change through that test:

| Change | Breaking? | Why |
|---|---|---|
| Adding a new optional prop | No | Existing consumers compile and render unchanged. |
| Adding a new variant value | No | Existing consumers don't reference it. |
| Renaming a prop | Yes | Existing consumers fail to compile. |
| Removing a prop | Yes | Existing consumers fail to compile. |
| Changing the default of a prop | Yes (in spirit) | Existing consumers see different output. |
| Changing the visual appearance of a variant | Yes (usually) | Existing consumers see different output. |
| Changing a component's underlying DOM element | Yes | Existing consumers' CSS overrides may stop matching. |
| Adding a new required prop | Yes | Existing consumers fail to compile. |
| Adding a new component | No | Doesn't affect anyone. |
| Bumping a peer dependency major version | Yes | Consumers must coordinate. |

The "spirit" cases (default changes, visual changes, DOM changes) are where most arguments happen. **Err on the side of treating them as breaking.** It's cheaper to over-version than to under-version — under-versioning erodes consumer trust.

---

## The deprecation lifecycle

Breaking a thing is rarely the right move. **Deprecating it** — marking it as scheduled-for-removal while keeping it working — gives consumers time to migrate at their own pace.

The lifecycle:

```
1. Deprecate (still works, warns)        v1.5.0
2. Wait                                    (≥ 1 quarter)
3. Remove                                  v2.0.0
```

### Stage 1: Mark as deprecated

In TypeScript, the `@deprecated` JSDoc tag does most of the work — IDEs strike through deprecated identifiers automatically:

```tsx
interface ButtonProps {
  /**
   * @deprecated Use `variant="ghost"` instead. Will be removed in v2.0.
   */
  flat?: boolean;

  variant?: "primary" | "secondary" | "ghost" | "destructive";
}
```

For runtime warnings, log a one-time deprecation warning when the deprecated path is used:

```tsx
const warnedDeprecations = new Set<string>();

function warnDeprecated(key: string, message: string) {
  if (process.env.NODE_ENV === "production") return;
  if (warnedDeprecations.has(key)) return;
  warnedDeprecations.add(key);
  console.warn(`[design-system] ${message}`);
}

export function Button({ flat, variant, ...props }: ButtonProps) {
  if (flat !== undefined) {
    warnDeprecated(
      "Button.flat",
      'The `flat` prop is deprecated. Use `variant="ghost"` instead. Will be removed in v2.0.'
    );
  }

  // …
}
```

The runtime warning is intentionally dev-only — production users shouldn't see console spam.

### Stage 2: Wait

The wait period is non-negotiable. Real consumers need real time to migrate. Recommended minimums:

| Consumer count | Wait period |
|---|---|
| 1–3 internal teams | 4–8 weeks |
| 5–10 internal teams | 1–2 quarters |
| Public/external consumers | 6+ months, often longer |

During the wait, **track adoption**. Every release, see what fraction of consumers are still on the deprecated path. If it's still >10% by the time you're ready to remove, extend the deprecation.

### Stage 3: Remove in a major version

The removal happens in a major version bump, with the deprecation note repeated in the CHANGELOG and migration guide.

```
## v2.0.0 - 2026-09-01

### Removed (breaking)
- `Button.flat` prop. Use `variant="ghost"` instead.
  Deprecated since v1.5.0 (2026-04-15).

### Migration

Replace:
  <Button flat>Click</Button>
With:
  <Button variant="ghost">Click</Button>

A codemod is available: `npx @your-system/codemod button-flat-to-ghost`
```

---

## Migration guides — write them or pay later

A migration guide is a document that tells a consumer exactly what to do to move from v1 to v2. **Every breaking change must have a corresponding entry.**

A complete migration guide entry has:

1. **What changed** — the specific change, with before/after code.
2. **Why** — context that justifies the breaking change (so consumers don't feel jerked around).
3. **How to migrate** — a step-by-step or codemod.
4. **What happens if you don't** — the failure mode (compile error? runtime warning? wrong rendering?).

Skip this and the migration cost falls entirely on consumer teams. They'll grep, guess, and miss subtleties — which means support tickets land on you anyway, plus broken UIs in production. **Write the guide. Pay the cost upfront.**

---

## Codemods — the migration multiplier

For mechanical changes — a renamed prop, a refactored component — write a **codemod**: an automated transformation that updates consumer code. The most common tool is **jscodeshift** (or its TypeScript-aware sibling `@codeshift/cli`).

A simple codemod that renames `flat` → `variant="ghost"`:

```ts
// codemods/button-flat-to-ghost.ts
import type { API, FileInfo } from "jscodeshift";

export default function transformer(file: FileInfo, api: API) {
  const j = api.jscodeshift;
  const root = j(file.source);

  root
    .find(j.JSXOpeningElement, { name: { name: "Button" } })
    .forEach((path) => {
      const flatAttr = path.node.attributes?.find(
        (a) => a.type === "JSXAttribute" && a.name.name === "flat"
      );
      if (!flatAttr) return;

      // Remove `flat`
      path.node.attributes = path.node.attributes!.filter(
        (a) => !(a.type === "JSXAttribute" && a.name.name === "flat")
      );

      // Add `variant="ghost"` if no `variant` already exists
      const hasVariant = path.node.attributes!.some(
        (a) => a.type === "JSXAttribute" && a.name.name === "variant"
      );
      if (!hasVariant) {
        path.node.attributes!.push(
          j.jsxAttribute(j.jsxIdentifier("variant"), j.literal("ghost"))
        );
      }
    });

  return root.toSource();
}
```

Consumers run it with one command:

```bash
npx jscodeshift -t button-flat-to-ghost.ts src/
```

The bigger the system and the more consumers, the more codemods earn their keep. **A migration that requires 30 minutes of manual work per consumer × 12 consumer teams = 6 hours of organizational time.** A codemod takes a couple of hours to write and runs in seconds. The math is obvious as soon as you have more than two consumers.

For really big migrations (Material UI v4 → v5, GitHub Primer's React rewrite), codemods aren't optional — they're the only way the migration finishes within a year.

---

## Multi-version coexistence

Sometimes a major migration is too big to do all at once. The pragmatic pattern: **two major versions of the system can run side-by-side temporarily.**

```json
// package.json of a consumer mid-migration
{
  "dependencies": {
    "@your-system/components": "^1.5.0",
    "@your-system/components-v2": "npm:@your-system/components@^2.0.0"
  }
}
```

The aliased import lets the consumer use both:

```tsx
import { Button as ButtonV1 } from "@your-system/components";
import { Button as ButtonV2 } from "@your-system/components-v2";

// Migrate page by page
// Old page uses ButtonV1
// New page uses ButtonV2
```

This is ugly. It's also the only way some migrations actually finish — a 200-page app cannot rewrite every page in one PR. The interim ugliness is the cost of *making progress* vs *making no progress*.

The coexistence period should be time-bounded. A typical playbook:

1. Major v2 ships.
2. New code uses v2.
3. Existing pages are migrated, page-by-page, over 1–2 quarters.
4. v1 is removed from package.json once the last consumer migrates.

---

## Internal vs external systems

The discipline above applies to *all* systems, but the rigor scales with the audience:

### Internal systems (single org, internal consumers)

- Slack channel for breaking-change announcements is enough.
- 4–8 week deprecation periods are usually feasible.
- Codemods are a polish, not a requirement.
- Coordinated upgrades are achievable — "everyone please be on v2 by month-end."

### Public systems (open-source, external consumers)

- Breaking changes need months of lead time.
- Codemods are nearly mandatory.
- Migration guides need to be polished documentation, not Slack messages.
- You can't coordinate consumer upgrades — they happen on their schedule, not yours.

If you're building an internal system that *might* go open-source someday, run with the public-system discipline from the start. The extra rigor is much cheaper than the migration to it.

---

## Real-world references worth studying

Three systems whose versioning practice is worth studying:

- **Material UI v4 → v5** (2021). One of the largest design-system migrations in JavaScript history. Came with extensive codemods, a multi-month deprecation period, and a comprehensive migration guide. Worth reading even if you don't use MUI.
- **GitHub Primer.** Has a public versioning policy, deprecation lifecycle, and CHANGELOG that's genuinely useful. The Primer team's blog posts on deprecation are short and sharp.
- **Stripe API.** Not a design system, but the canonical example of "long-lived API with rigorous versioning." Stripe's API has multiple supported versions running concurrently for *years*. The discipline is the same; the audience is just larger.

---

## Tooling worth knowing

A short list of tools that make versioning concrete:

| Tool | What it does |
|---|---|
| **Changesets** | The de-facto standard for monorepo versioning + changelog generation in 2026. Each PR adds a "changeset" file declaring what changed; the release workflow consumes them. |
| **release-please** (Google) | Alternative changeset-style tool, with conventional-commit-driven version bumps. |
| **jscodeshift / @codeshift/cli** | Code transformation tools for codemods. Both are stable and mature. |
| **`@deprecated` JSDoc + ESLint plugin** | Surface deprecations in IDE and lint. The `eslint-plugin-deprecation` rule fails CI on usage of deprecated APIs. |
| **Semantic-release** | If you want fully automated releases driven by commit messages. Powerful but opinionated; not for everyone. |

Pick one and adopt it from day one. Adding versioning rigor *after* you've shipped breaking changes is more painful than the discipline itself.

---

## A versioning checklist

For every change to the design system:

1. **Categorized as patch / minor / major** before merging — not after.
2. **CHANGELOG entry written** with consumer-facing language, not internal jargon.
3. **For breaking changes: marked `@deprecated`** in a minor release first, with a runtime warning where possible.
4. **For breaking changes: migration guide written**, with before/after and a codemod where mechanical.
5. **Deprecation period respected** — at least one quarter for internal systems, longer for external.
6. **Tracked adoption of deprecated paths** — don't remove until consumers have actually migrated.
7. **Multi-version coexistence supported** for migrations too big to do at once.
8. **Versioning tool (Changesets etc.) is in CI**, not in someone's head.

---

## What you should walk away with

- **Design systems version differently from generic libraries** because consumers can't realistically run multiple versions long-term.
- **Semver applies, but with judgment.** Visual changes are usually breaking; token renames always are; bug fixes that change behaviour are case-by-case.
- **Deprecate before you remove.** A minimum quarter of warning, longer for larger consumer bases. Use `@deprecated` + dev-only runtime warnings.
- **Migration guides and codemods aren't optional** if you have more than a handful of consumers. The cost of writing them is much less than the cost of every consumer figuring it out independently.
- **The single biggest factor in a design system's longevity is whether the team running it has versioning discipline from day one.** Visual polish doesn't save a system that broke its consumers' trust.

In chapter 6 we move to one of the most-requested design-system features and one of the easiest to ship badly: dark mode.

---

*Next up — Chapter 6: Dark Mode — Implementation Done Right. Why most dark-mode implementations age poorly, and the token-based pattern that doesn't.*
