---
title: "Design Tokens — The Bridge Between Designers and Developers"
order: 2
tags: ["design-system", "design-tokens", "css-variables", "tailwind"]
date: "2026-04-29"
draft: false
lang: "en"
---

If a design system is a contract, **design tokens are the clauses**. They're the atomic, named values that everything else in the system is built from — every colour, spacing unit, font size, border radius, shadow, breakpoint, and motion duration. Tokens are also the layer where most design systems live or die: get the token taxonomy right and components compose effortlessly; get it wrong and you'll spend a year painting yourself out of corners.

This chapter covers what a token actually is, the three-tier model that scales without collapsing, the pipeline that delivers tokens from designer tools to runtime CSS, and why naming a token is the hardest non-technical problem you'll solve in this series.

---

## What a token actually is

A **design token** is a named, semantically-meaningful value that represents a single design decision. The simplest possible example:

```ts
const tokens = {
  color: {
    primary: "#4f46e5",
  },
};
```

That tiny object is a token table with one entry. The *name* `color.primary` is the contract; the *value* `#4f46e5` is the implementation. Every component that needs a primary colour references the token by name, never by raw value.

This indirection is the entire point. When the brand changes from indigo to purple in 2027, you change one line in the token table and 487 components across 6 products update simultaneously. Without tokens, you'd be grepping for `#4f46e5` across the codebase and praying no one wrote it as `rgb(79, 70, 229)` somewhere.

> **Going deeper.** The W3C Design Tokens Community Group has been formalizing a JSON-based token format spec for several years. As of 2026 it's stable enough to be the lingua franca for design tools (Tokens Studio, Style Dictionary), and adopting the spec means your tokens are portable across tooling. For most application teams this is overkill — but if you're building a system used across multiple products with multiple build pipelines, it pays for itself.

---

## The three-tier model

The single most important architectural decision in tokens is recognizing that tokens come in **three semantic tiers**, and conflating them is the source of most design-system pain.

### Tier 1: Primitive tokens

Raw values, named by what they *are*, not by what they *mean*.

```ts
const primitives = {
  color: {
    blue50:  "#eff6ff",
    blue100: "#dbeafe",
    blue500: "#3b82f6",
    blue600: "#2563eb",
    blue700: "#1d4ed8",
    gray50:  "#f9fafb",
    gray500: "#6b7280",
    gray900: "#111827",
    // …
  },
  spacing: {
    1:  "4px",
    2:  "8px",
    4:  "16px",
    8:  "32px",
  },
};
```

Primitives are large, exhaustive, and *not directly consumed by components*. Tailwind's full default palette is essentially a set of primitives — every blue from `blue-50` to `blue-950`, every gray from `gray-50` to `gray-950`.

### Tier 2: Semantic tokens

Names that describe *intent*, mapped onto primitives.

```ts
const semantic = {
  color: {
    text: {
      primary:   primitives.color.gray900,
      secondary: primitives.color.gray500,
      inverse:   primitives.color.gray50,
    },
    background: {
      surface:   primitives.color.gray50,
      elevated:  "#ffffff",
      brand:     primitives.color.blue600,
    },
    border: {
      subtle:    primitives.color.gray200,
      strong:    primitives.color.gray400,
    },
  },
};
```

Semantic tokens are *what components actually consume*. A `Button` component uses `color.background.brand`, not `blue-600`. This means swapping the brand colour from blue to indigo is a one-line change in the semantic table — no component code changes.

This is also the layer where **dark mode** lives, which is why we have a whole chapter on it (chapter 6). In dark mode, `color.text.primary` maps to a *different* primitive (`gray100` instead of `gray900`). Components don't know or care.

### Tier 3: Component tokens

Tokens scoped to a specific component, used when that component has values that don't fit the global semantic vocabulary.

```ts
const componentTokens = {
  button: {
    primary: {
      background:       semantic.color.background.brand,
      backgroundHover:  primitives.color.blue700,
      text:             semantic.color.text.inverse,
    },
    secondary: {
      background:       "transparent",
      border:           semantic.color.border.subtle,
      text:             semantic.color.text.primary,
    },
  },
};
```

Component tokens are optional and should be added sparingly — only when a component has a meaningful local value that other components don't share. The trap is creating a component-token explosion that mirrors the component itself, which doubles your token surface area without adding clarity.

### Why three tiers, not one

The temptation when starting a design system is to skip the primitive layer:

```ts
// Don't do this
const tokens = {
  brandPrimary: "#4f46e5",
  brandPrimaryHover: "#4338ca",
  textPrimary: "#111827",
  // …
};
```

It's compact and feels clean. The problem shows up in 6 months when:

- You need to add a third "brand" shade for a new feature, and you have to invent `brandPrimaryDarkerHover` on the fly.
- A designer asks "what's the next-darker blue?" and you can't answer without picking a hex value out of thin air.
- You need to support dark mode and there's no neutral palette to remap into.

Three tiers seems like over-engineering. It isn't. It's the difference between a system that grows gracefully and one that calcifies.

---

## Naming tokens — the hardest part

Token *names* are the API of your design system. Once a name ships, every consumer depends on it; renaming is a breaking change (chapter 5). So getting names right early matters more than almost any other early decision.

A few naming rules that hold up across systems:

### 1. Use intent over visual description

```
✓ color.text.danger        // intent: "this text means something bad"
✗ color.text.red           // visual: "this text is red"
```

The intent name survives a brand rebrand from red to orange; the visual name doesn't.

### 2. Use consistent verb-noun ordering

Pick **`category.subcategory.variant`** or **`variant.subcategory.category`** and apply it everywhere. Mixing both is the source of "wait, is it `border.color.subtle` or `color.border.subtle`?" confusion.

```
✓ color.border.subtle      // category-first, consistent
✓ color.text.primary
✓ spacing.padding.md

✗ color.text.primary        // sometimes category-first
✗ borderColorSubtle         // sometimes variant-first
```

### 3. Use consistent scale words

For sizes and spacing, pick a vocabulary and stick to it: `xs / sm / md / lg / xl / 2xl` is the most common; Tailwind uses it for almost everything. Don't mix `small` and `sm` and `compact` across different categories.

### 4. Don't bake in the value

```
✗ spacing.16px             // breaks if you ever change to rem-based
✗ color.indigo600          // visual; what if brand changes?
```

The token name should be the *intent*, not the *current implementation*.

### 5. Allow for growth

If you have `color.text.primary` and `color.text.secondary`, leave room for `color.text.tertiary` and `color.text.disabled`. Don't paint into a corner with a binary primary/secondary that has to be renamed when you discover a third level.

> **Going deeper.** Naming tokens is a place where a half-day with a designer pays back enormously. The engineer wants names that compile cleanly; the designer wants names that match how they describe the system in design files. The intersection is a vocabulary both sides can refer to. Without that conversation early, you'll end up with engineering naming that doesn't match the Figma layer names — every cross-discipline conversation will require translation.

---

## The token pipeline

Tokens have to live somewhere both designers and developers can author them, and they have to be transformed into whatever format the consumer code uses. The pipeline:

```
Source of truth          Transformation             Consumer formats
(Figma / JSON)    →     (Style Dictionary,    →    CSS variables
                         Tokens Studio,             Tailwind config
                         custom build)              JS objects
                                                    iOS / Android values
```

Three real-world setups, in increasing complexity:

### Setup A: JSON in the repo, transformed at build

The simplest pipeline. Tokens live as JSON or TypeScript in your repo. A small build step (Style Dictionary, or a hand-rolled script) transforms them into CSS variables, a Tailwind config, and a JS export.

```ts
// tokens/source.ts
export const tokens = {
  color: { /* primitives + semantic */ },
  spacing: { /* … */ },
};

// tokens/build.ts (run at build time)
import { tokens } from "./source";
import fs from "node:fs";

const css = `:root {
  --color-primary: ${tokens.color.brand.primary};
  --color-text-primary: ${tokens.color.text.primary};
  /* … */
}`;

fs.writeFileSync("./generated/tokens.css", css);
```

This works for small-to-medium systems and keeps tokens version-controlled alongside the code. Recommended starting point.

### Setup B: Figma-as-source via Tokens Studio

Tokens are authored in Figma (using the Tokens Studio plugin), exported as JSON, committed to a tokens repo or branch. Style Dictionary picks them up and runs the transformation.

This setup is appropriate when you have an active design team that wants Figma to be the source of truth. It introduces a sync step (Figma → JSON), which is both a feature (designers own the values) and a coordination cost (engineers can't unilaterally change tokens).

### Setup C: Multi-platform pipeline

Same source JSON, multiple outputs: web (CSS variables), iOS (Swift constants), Android (XML resources), React Native (JS objects). This is what large design systems like Polaris and Primer do.

For most teams this is over-engineered. For platform companies shipping cross-platform UIs, it's the only sane way to keep visual consistency.

---

## Tokens in practice — the running example

Let's tokenize the `Button` component we'll evolve through the rest of the series. Starting state:

```tsx
// Pre-token: hard-coded values
function Button({ children, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700"
    >
      {children}
    </button>
  );
}
```

Now apply the three-tier model. Primitives stay where Tailwind has them (we don't reinvent its colour palette). Semantic tokens are introduced as CSS variables in a single `tokens.css`:

```css
/* tokens.css */
:root {
  /* Primitives (subset) */
  --color-blue-600: #2563eb;
  --color-blue-700: #1d4ed8;
  --color-white:    #ffffff;

  /* Semantic — what components consume */
  --color-brand:       var(--color-blue-600);
  --color-brand-hover: var(--color-blue-700);
  --color-on-brand:    var(--color-white);
}
```

The component now references semantic tokens (`brand`, `brand-hover`, `on-brand`) instead of raw values:

```tsx
// Tokenized — references the system, not raw values
function Button({ children, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="
        bg-[--color-brand]
        text-[--color-on-brand]
        px-4 py-2 rounded-md font-medium
        hover:bg-[--color-brand-hover]
      "
    >
      {children}
    </button>
  );
}
```

The next chapter cleans this up further with a proper component API and replaces the arbitrary-value syntax with named Tailwind utilities (see "Tailwind 4 makes this almost free" below). For now the point is: the colour values aren't in the component anymore. They're in the token layer, named by intent. Change one CSS variable, watch the entire product update.

### Tailwind 4 makes this almost free

Tailwind 4 has built-in support for theming via the `@theme` directive in CSS, which means tokens defined as CSS variables are *automatically* available as Tailwind utilities:

```css
@theme {
  --color-brand: #4f46e5;
  --color-brand-hover: #4338ca;
  --spacing-button-x: 1rem;
  --spacing-button-y: 0.5rem;
}
```

```tsx
<button className="bg-brand hover:bg-brand-hover px-button-x py-button-y">
  Click me
</button>
```

This collapses the previously-painful "tokens as JS object that you have to translate to Tailwind config" pipeline into a single CSS file. As of 2026, this is the recommended pattern for new Tailwind projects.

---

## Common token mistakes

Five failure modes that account for most design-system-token regret:

### 1. Skipping the semantic layer

Components reference primitives directly (`bg-blue-600` instead of `bg-brand`). Brand changes require touching every component. Dark mode becomes architecturally impossible without a refactor.

### 2. Over-tokenizing

Creating a token for every value that might ever change. `font.body.weight.regularButNotItalic`. The token system becomes harder to navigate than the values would have been. Rule of thumb: **a token earns its place by being referenced from at least two components**, or by being a value that designers explicitly need to control.

### 3. Inconsistent naming

`color.text.primary` next to `colorBackgroundBrand` next to `border-color-subtle`. The system *works*, but every consumer has to learn three vocabularies. Settle the convention early; rename ruthlessly while the consumer count is still small.

### 4. Tokens that don't match the design tool

Engineers ship `spacing.md = 12px`; designers' Figma file uses 16px for the same role. Whichever is wrong, the disconnect creates a constant drift. Either generate from the same source (setup B above) or have a quarterly audit.

### 5. Renaming tokens late

A token name shipped is a contract. Renaming it in v3 requires a migration across every consumer. Plan names with at least 5x more thought than the variable name in your component code — *because that's what tokens are*: variable names with many more dependents.

---

## A token-design checklist

Before you ship a token table:

1. **Three tiers separated** — primitives, semantic, (optional) component.
2. **Names express intent**, not visual properties or current values.
3. **Consistent ordering** — `category.subcategory.variant` everywhere, no exceptions.
4. **Consistent scale vocabulary** — `xs / sm / md / lg / xl` (or your alternative), used uniformly.
5. **Components consume only semantic tokens.** They never reference primitives directly.
6. **Token source is in the repo and version-controlled.** Generated outputs (CSS, Tailwind config) are committed too — ergonomics for grep.
7. **Dark-mode strategy is a remap of semantic tokens**, not a separate component (chapter 6).
8. **Naming review with a designer** is on the calendar before the next major version.

---

## What you should walk away with

- **Tokens are the atoms of a design system.** Every component is composed of them; every brand change ripples through them.
- **Three tiers — primitives, semantic, component — are the architecture that scales.** Skipping the semantic layer is the most common, most regretted shortcut.
- **Naming is the hardest part.** Names are public API; they outlive the values they wrap.
- **The pipeline matters less than the principles.** Style Dictionary or a hand-rolled script are both fine; Tailwind 4's `@theme` collapses much of the pipeline. What matters is that components reference names, not values.

In chapter 3 we move up one layer to the next API: components themselves. We'll redesign the running `Button` with a proper variant + size + composition API, and meet the patterns that make component APIs survive scaling to dozens of consumers.

---

*Next up — Chapter 3: Component API Design — Props, Variants, and Composition. Why "just add a prop for that" is the slow path to a 40-prop component, and the patterns that scale instead.*
