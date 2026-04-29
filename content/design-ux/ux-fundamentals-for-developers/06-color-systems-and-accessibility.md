---
title: "Color Systems and Accessibility — WCAG, with Real Code"
order: 6
tags: ["ux", "color", "accessibility", "wcag", "design-system", "tailwind"]
date: "2026-04-29"
draft: false
lang: "en"
---

Color is the part of UI design where ad-hoc choices accumulate fastest. Today's "let me just darken this gray a touch" becomes next year's product where 47 distinct shades of gray exist and nobody can say which one is the "right" gray. This chapter is about preventing that — building a colour system you can defend, with accessibility (WCAG) baked in from the start rather than retrofitted under audit pressure.

We'll cover how to think about colour in tiers, the WCAG contrast rules everyone in 2026 should know by heart, the most common accessibility failures, and how to encode the whole thing in Tailwind so you can't accidentally violate it.

---

## Color in three tiers

Most products' colour confusion comes from mixing up three distinct uses. Separate them:

### Tier 1: Brand colour

The colour that says "this is our product." Usually one or two values. **Use sparingly** — for primary actions, key brand moments, and decorative accents. Never as a default body or text colour.

Stripe's purple. Linear's deep blue-violet. GitHub's black-and-white plus the green PR-merge colour. The brand colour is a punctuation mark, not a paragraph.

### Tier 2: Neutral palette

A grayscale ramp that does the heavy lifting in any product. Body text, secondary text, borders, backgrounds, dividers, disabled states, surfaces — almost everything that *isn't* a primary action lives here.

Tailwind's gray scale (or slate, zinc, neutral, stone — pick one and stick to it) is your neutrals. **Most of any well-designed UI is gray.** Look at GitHub or Linear and squint — what you'll see is mostly gray, with occasional bursts of brand colour for emphasis.

### Tier 3: Semantic colours

Colours that carry meaning across the product:

- **Success** (something completed, succeeded, is good) — usually green
- **Warning** (caution, action required) — usually amber/yellow
- **Danger / Error** (something failed, destructive action, alert) — usually red
- **Info** (neutral information, in-progress) — usually blue

These should be reserved for their meaning. Don't use red for an "Edit" button just because the design looks nice in red. Red means error/destructive. Stripe gets this right: their "Refund" button is red because refunds are destructive; non-destructive actions never use red.

---

## The WCAG numbers everyone should memorize

The Web Content Accessibility Guidelines (WCAG) define quantitative thresholds for text contrast. Memorize these — they come up in every design review, every accessibility audit, every Lighthouse report.

| Text size | AA (the regulatory baseline most jurisdictions adopt) | AAA (best practice) |
|---|---|---|
| **Normal text** (under 18pt or under 14pt bold) | **4.5 : 1** | 7 : 1 |
| **Large text** (18pt+ or 14pt+ bold) | **3 : 1** | 4.5 : 1 |
| **UI components and graphical objects** | **3 : 1** | — |

A few practical implications most developers learn the hard way:

- **`text-gray-400` on `bg-white` is below 4.5:1** and fails WCAG AA for body text. It's the most common offender — that "subtle" placeholder grey is illegible to a non-trivial fraction of users.
- **Light gray text on white** for things like timestamps, metadata, and "Posted by…" labels frequently fails. If it's information the user needs to act on, it must hit 4.5:1.
- **Disabled buttons and form fields are exempt** from contrast minimums — but that's a UX trap of its own; truly disabled controls should look disabled while still being announceable to screen readers.

The contrast ratio is computed from relative luminance, which is non-linear and counter-intuitive — `#999999` on white is **2.85:1**, not what you'd guess from "it's about half-and-half gray". Don't try to eyeball it; use a tool.

---

## Tools that take the guessing out

Three tools, in order of frequency of use:

### Browser DevTools (built-in)

Modern Chrome and Firefox both show contrast ratios inline when you inspect a text element. Open DevTools, click on a text node, look at the colour picker — it shows the AA / AAA pass/fail badges.

This should be the first thing you check on any new colour combination. It takes about three seconds.

### Lighthouse / Axe

Both audit a whole page in one pass. Lighthouse is built into Chrome (`Cmd+Option+I` → Lighthouse tab → Run audit). Axe is a more thorough alternative, available as a browser extension or CLI. Both will surface every contrast failure, with the specific element and the failing ratio.

Run Lighthouse on every screen before you call it done. It catches contrast issues, missing labels, missing alt text, and a half-dozen other accessibility basics in one shot.

### WebAIM Contrast Checker

When designing a colour system from scratch, [WebAIM's contrast checker](https://webaim.org/resources/contrastchecker/) lets you punch in two hex values and get the exact ratio with AA/AAA verdicts. The most useful tool for pinning down whether `gray-600` is "good enough" against `gray-50`.

---

## The most common color-accessibility failures

Six failure modes that account for most accessibility issues in production:

### 1. Light gray secondary text

`text-gray-400` (`#9ca3af`) on white is `2.85:1` — fails AA for normal text. The fix: use `text-gray-500` (`#6b7280`, `4.6:1`) at minimum, or `text-gray-600` (`#4b5563`, `7:1`) to be safely above the bar.

### 2. Hover states with insufficient contrast change

A button that goes from `bg-blue-500` to `bg-blue-600` on hover — barely visible. Hover should change *enough* to be unmistakably new. Increase contrast or add an underline, scale, or shadow change.

### 3. Focus rings removed

`outline: none;` without replacement is the single most common accessibility failure on the web. Keyboard users navigate by tabbing — without a visible focus indicator, they cannot tell where they are.

```css
/* Bad — kills accessibility */
button:focus { outline: none; }

/* Good — replace, don't remove */
button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
```

In Tailwind, never override `focus-visible:` styles to nothing. Use `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500` (or similar) on every interactive element.

### 4. Color as the only signal

A red dot for "error" and a green dot for "success" — invisible to ~8% of men with red-green colour-blindness. Always pair colour with a second cue: an icon, a text label, an underline, a shape difference.

```tsx
// Bad: color-only
<span className="text-red-600">●</span>

// Good: color + icon + text
<span className="text-red-600 inline-flex items-center gap-1">
  <ExclamationIcon className="w-4 h-4" /> Error
</span>
```

### 5. Placeholder text as label

```tsx
// Bad: placeholder disappears on focus, no permanent label
<input placeholder="Email address" />

// Good: visible label, placeholder for example only
<label className="block">
  <span className="block text-sm font-medium text-gray-700 mb-1">
    Email address
  </span>
  <input placeholder="you@example.com" className="..." />
</label>
```

Placeholder-as-label fails on multiple axes: low contrast, disappears on focus, screen-reader behaviour varies. Always provide a visible `<label>`.

### 6. Background images behind text

Hero sections with text overlaid on a photo. Even when the image's average luminance gives an okay contrast, parts of the image often fail locally. Add a semi-transparent overlay (`bg-black/40`) or use a solid background for any text that needs to be readable.

---

## A Tailwind colour system in practice

Here's a complete starter system using Tailwind defaults. Most products can ship with exactly this and only customize the brand colour.

```tsx
// tailwind.config.ts (concept — Tailwind 4 syntax may differ)
export default {
  theme: {
    extend: {
      colors: {
        // Tier 1: brand
        brand: {
          DEFAULT: '#4f46e5',  // indigo-600 ish
          dark:    '#3730a3',  // for hover
        },
        // Tier 2: neutrals — just use Tailwind's gray
        // (gray-50 through gray-900 are already there)

        // Tier 3: semantic — alias to standard scales for consistency
        success: { DEFAULT: '#16a34a', subtle: '#dcfce7' },  // green-600 / green-100
        warning: { DEFAULT: '#d97706', subtle: '#fef3c7' },  // amber-600 / amber-100
        danger:  { DEFAULT: '#dc2626', subtle: '#fee2e2' },  // red-600 / red-100
        info:    { DEFAULT: '#2563eb', subtle: '#dbeafe' },  // blue-600 / blue-100
      },
    },
  },
}
```

Usage rules to write into your team docs:

- **Body text** uses `text-gray-700` or `text-gray-900` (never lighter than `gray-500` for primary content).
- **Secondary text** uses `text-gray-500` or `text-gray-600`.
- **Borders** use `border-gray-200` or `border-gray-300`.
- **Surfaces** are `bg-white` or `bg-gray-50` (never anything brighter for the main canvas).
- **Brand color** appears only on primary CTAs and brand moments — not on regular text or borders.
- **Semantic colors** are reserved for their meaning — never decorative.

---

## Dark mode — the second contrast battle

If you ship dark mode, every contrast decision happens twice. Common pitfalls:

- **Direct color inversion fails.** `bg-white` → `bg-black` is too contrasty for dark mode body. Use `bg-gray-900` or `bg-gray-950` instead — slightly off-black is easier on the eyes for long sessions.
- **Pure white text on near-black background is harsh.** Use `text-gray-100` or `text-gray-200` for primary text instead of `text-white`.
- **Brand colors often need adjustment.** A saturated `indigo-600` that pops on white can feel muddy on a dark background. Most dark-mode systems use slightly desaturated or lighter brand variants.

Tailwind's `dark:` variant makes this manageable — every colour declaration has a dark counterpart:

```tsx
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
  …
</div>
```

Run Lighthouse on the dark version too. Dark-mode contrast bugs are the most frequently shipped accessibility issue in 2026.

---

> **Going deeper.** Modern CSS supports the **OKLCH** color space, designed around perceptual uniformity — equal numerical changes correspond to equal perceived changes in lightness or chroma. Design tools like Radix Colors and Tailwind 4's default palette have moved toward perceptually-uniform scales for this reason. When generating a brand palette with 50/100/…/900 steps, use OKLCH-based tools like [oklch.com](https://oklch.com) or [Radix Colors](https://www.radix-ui.com/colors) rather than naïve HSL interpolation — the resulting scale feels like even lightness steps, which is what your eye expects. For application code this is mostly "set it once and forget it"; you import the scale as CSS variables or Tailwind config and stop thinking about colour-space math.

---

## A color & accessibility checklist

For every screen and every PR that touches colour:

1. **Body text contrast: ≥ 4.5:1** against its background. Verify with DevTools.
2. **Large headings: ≥ 3:1.** (You usually have plenty of headroom here.)
3. **Interactive elements have visible `focus-visible:` rings.** Never `outline: none` without replacement.
4. **Color is never the only signal.** Pair with icon, label, or shape.
5. **Hover states change enough to be obvious.** Subtle `bg-blue-500 → bg-blue-600` is not enough.
6. **Placeholder is example, not label.** Every input has a visible `<label>`.
7. **Lighthouse run on the page, no contrast errors.** And again in dark mode if you ship it.
8. **Brand color used only on CTAs and brand moments**, not for body or borders.
9. **Semantic colors used only for their meaning**, not as decoration.

---

## What you should walk away with

- **Three tiers — brand, neutral, semantic — and most of any UI is neutral.** Brand colour is punctuation.
- **WCAG AA contrast: 4.5:1 normal, 3:1 large.** Memorize these. Browser DevTools makes verifying them a 3-second check.
- **Six common failures** (light gray text, weak hover, missing focus, color-only signal, placeholder-as-label, image-behind-text) account for most accessibility issues in production. Audit for them deliberately.
- **Dark mode doubles the contrast work** — run the same checks on every screen in both modes.

In chapter 7 we leave the visual layer and dig into one of the highest-leverage interaction surfaces in any product: forms.

---

*Next up — Chapter 7: Form Design — Validation, Errors, and Micro-Interactions. Why most forms fail in the same five ways, and how to ship one that doesn't.*
