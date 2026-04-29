---
title: "Dark Mode — Implementation Done Right"
order: 6
tags: ["design-system", "dark-mode", "theming", "css-variables", "tailwind"]
date: "2026-04-29"
draft: false
lang: "en"
---

Dark mode has gone from "nice-to-have" to "your product looks dated without it" in five years. Yet most dark-mode implementations age poorly — invisible focus rings, brand colours that look muddy on dark backgrounds, that one component that nobody updated when the rest of the app went dark, the "flash of light theme" that hits users on every page load.

These are all consequences of one mistake: **adding dark mode after the fact**, by sprinkling `dark:` modifiers into existing components. The right way is to design dark mode as a *theme of the token system* from the start. Components don't know what theme they're in; they just consume semantic tokens whose values flip when the theme changes.

This chapter is about the token-driven approach to dark mode, the architectural decisions that have to happen up front, and the runtime mechanics — class-based theming, system-preference detection, the FOUC fix — that make the experience polished.

---

## The wrong way and the right way

### The wrong way: per-component dark variants

```tsx
// Don't do this
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
  <h1 className="text-gray-900 dark:text-gray-100">Title</h1>
  <p className="text-gray-700 dark:text-gray-300">Body</p>
  <button className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400">
    Save
  </button>
</div>
```

Every component owns its dark variants. Every consumer has to remember `dark:` everywhere. New components forget half of it. The system grows visually inconsistent in dark mode because each component made its own decisions.

### The right way: components consume tokens; tokens flip

```tsx
<div className="bg-surface text-primary">
  <h1 className="text-primary">Title</h1>
  <p className="text-secondary">Body</p>
  <button className="bg-brand text-on-brand hover:bg-brand-hover">
    Save
  </button>
</div>
```

The component classes never reference dark mode. They reference *semantic tokens* — `bg-surface`, `text-primary`, `bg-brand`. Those tokens are CSS variables whose values are *different in the two themes*:

```css
/* Light theme — default */
:root {
  --color-surface: #ffffff;
  --color-text-primary: #111827;
  --color-text-secondary: #4b5563;
  --color-brand: #4f46e5;
  --color-brand-hover: #4338ca;
  --color-on-brand: #ffffff;
}

/* Dark theme */
:root.dark {
  --color-surface: #0a0a0a;
  --color-text-primary: #f5f5f5;
  --color-text-secondary: #a3a3a3;
  --color-brand: #818cf8;
  --color-brand-hover: #6366f1;
  --color-on-brand: #0a0a0a;
}
```

When the `<html>` element gets the `dark` class, *every* CSS variable flips. Every component re-renders with the new values automatically. There is no "did we forget a `dark:`" bug because nothing references "dark" at the component level.

This is the entire architecture. The rest of the chapter is about the details — how to wire it up correctly, what tokens to flip vs not, and how to avoid the FOUC.

---

## Class-based vs media-query theming

There are two ways to detect dark mode:

### Media query

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-surface: #0a0a0a;
    /* … */
  }
}
```

The browser switches automatically based on OS settings. **Pure media-query theming has no manual override** — users who prefer light on a dark-OS day can't override your site.

### Class-based

```css
/* The selector targets <html class="dark"> — the class is added to the root element */
:root.dark {
  --color-surface: #0a0a0a;
  /* … */
}
```

A JavaScript snippet adds `.dark` to `<html>` based on user preference (often stored in localStorage). The `next-themes` library uses class-based theming by default (`attribute="class"`), and the `:root.dark` selector above matches what it produces. **Class-based theming gives users control.**

**The recommended pattern in 2026 is class-based theming with `prefers-color-scheme` as the default for first-time visitors.** That gets you both: respects the OS by default, lets users override.

```ts
// On page load, before React hydrates:
function applyTheme() {
  const stored = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const theme = stored ?? (prefersDark ? "dark" : "light");
  document.documentElement.classList.toggle("dark", theme === "dark");
}
```

We'll see how to ship this *before* React paints, in the FOUC section below.

---

## Tailwind's `dark:` variant — when to use it (and when not)

Tailwind has a `dark:` variant that lets you write per-component dark styles inline:

```tsx
<div className="bg-white dark:bg-gray-900">…</div>
```

Configured in CSS for Tailwind 4 (the recommended pattern in 2026, consistent with chapter 2's `@theme` approach):

```css
/* globals.css */
@import "tailwindcss";

/* Class-based dark mode: `.dark` anywhere on or above an element activates dark variants */
@custom-variant dark (&:where(.dark, .dark *));
```

For Tailwind v3 codebases, the equivalent JS config is `module.exports = { darkMode: "class" }`. The Tailwind v4 CSS-first version is preferred for new projects — same behaviour, less indirection.

The temptation is to use `dark:` everywhere. Resist it for components in your design system — the per-component approach is what we explicitly *don't* want for components.

**Where `dark:` is the right tool:**

- **One-off marketing pages** outside the design system, where the per-component approach is fine because there's no system to keep consistent.
- **Specific opt-out cases** within a system component, where one element legitimately should look different in dark mode in a way the token system doesn't capture — e.g., an illustration with two PNG variants.

**Where `dark:` is the wrong tool:**

- **Inside design system components.** Use semantic tokens that flip via CSS variables, as shown above.
- **For colour decisions.** Anything that's a colour should be a token, not a `dark:bg-X` modifier.

The mental model: `dark:` is for *deviations* from the token system, not the *implementation* of it.

---

## Which tokens flip vs not

Not every token changes between themes. The split:

### Tokens that flip

**Colour tokens almost always flip.** Surface colours, text colours, border colours, brand colours (often), semantic colours (success/warning/danger) — all need different values in dark mode.

```css
:root {
  --color-surface: #ffffff;
  --color-text-primary: #111827;
  --color-success: #16a34a;     /* slightly different in dark mode */
}

:root.dark {
  --color-surface: #0a0a0a;
  --color-text-primary: #f5f5f5;
  --color-success: #22c55e;     /* lighter for dark mode */
}
```

### Tokens that don't flip

**Spacing, typography sizes, border radii, breakpoints — these stay the same.** A `padding-md` of `16px` is `16px` in both themes. Don't fall into the trap of theming things that aren't visual properties of colour.

```css
:root {
  --spacing-md: 16px;          /* same in both themes */
  --radius-sm: 4px;            /* same in both themes */
  --font-size-base: 16px;      /* same in both themes */
}
```

This is one of the reasons the three-tier token model from chapter 2 matters: keeping the structural tokens separate from the colour tokens makes "what flips" obvious.

### Edge cases

A few tokens are debatable:

- **Shadows.** Light-mode shadows are usually `rgba(0,0,0,…)`. Dark-mode shadows are often subtler, sometimes inverted to look like soft glows. Worth flipping.
- **Brand colours.** A saturated `indigo-600` looks great on white but can feel oppressive on near-black. Many systems use a slightly lighter, slightly desaturated brand variant in dark mode. Subtle tweak, big impact.
- **Borders.** White-on-white needs a subtle gray border to define edges. Black-on-black needs a similar treatment but with a subtle lighter gray. Both flip.

---

## Designing the dark palette

The single biggest mistake in dark mode design: **inverting the light palette.**

`#ffffff` does not invert to `#000000`. Pure black-on-white-text reads beautifully; pure white-on-pure-black reads as harsh and induces eye strain on long sessions. Real dark themes use:

- **Background: not pure black.** `#0a0a0a` (Tailwind `gray-950`) or `#1a1a1a` is much easier on eyes.
- **Body text: not pure white.** `#f5f5f5` (Tailwind `gray-100`) or `#e5e5e5` (`gray-200`).
- **Secondary text: meaningfully lower contrast** but still meets WCAG.
- **Surface elevation** is achieved by *lighter* backgrounds in dark mode (the inverse of light mode where elevation = lighter or shadowed). A "card" on a `#0a0a0a` background might be `#1a1a1a`.

A starter palette that works for most products:

```css
:root.dark {
  /* Surfaces */
  --color-bg-base:     #0a0a0a;   /* page background */
  --color-bg-surface:  #171717;   /* card, modal, etc. */
  --color-bg-elevated: #262626;   /* tooltips, popovers */

  /* Text */
  --color-text-primary:   #f5f5f5;
  --color-text-secondary: #a3a3a3;
  --color-text-disabled:  #525252;

  /* Borders */
  --color-border-subtle: #262626;
  --color-border-strong: #404040;

  /* Brand — usually a touch lighter than light-mode brand */
  --color-brand:         #818cf8;  /* indigo-400 */
  --color-brand-hover:   #6366f1;  /* indigo-500 */
  --color-on-brand:      #0a0a0a;

  /* Semantic */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger:  #ef4444;
  --color-info:    #3b82f6;
}
```

Verify every text-on-surface pair with a contrast checker. Same WCAG rules as chapter 6 of the UX Fundamentals series — 4.5:1 for normal text, 3:1 for large.

---

## The flash-of-wrong-theme (FOUC)

The most universally hated dark-mode bug: the user prefers dark, the page loads in light, and for ~200ms there's a blinding white flash before the JavaScript runs and switches to dark.

The fix: **apply the theme class before React renders.** That means inline JavaScript in `<head>`, executed synchronously before the page paints.

In Next.js 16:

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme = stored || (prefersDark ? 'dark' : 'light');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

Three details that matter:

- **Inline, not external.** An external script wouldn't load in time.
- **`suppressHydrationWarning`** on `<html>` — React will see the class added by the script and otherwise warn about a server/client mismatch.
- **`try/catch`** — localStorage can throw in some sandboxed contexts; never let the theme script crash the page.

This pattern is well-trodden — `next-themes`, the de-facto theming library for Next.js, ships exactly this script under the hood. Most teams just install `next-themes` and let it handle this. Fine — but knowing what's underneath means you can debug it when it goes wrong.

---

## The theme toggle

A working toggle uses `useTheme` (from `next-themes` or your equivalent) with system as a third option:

```tsx
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon, MonitorIcon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex rounded-md border border-subtle">
      <button
        onClick={() => setTheme("light")}
        aria-label="Light theme"
        className={cn("p-2", theme === "light" && "bg-surface")}
      >
        <SunIcon className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        aria-label="Dark theme"
        className={cn("p-2", theme === "dark" && "bg-surface")}
      >
        <MoonIcon className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("system")}
        aria-label="System theme"
        className={cn("p-2", theme === "system" && "bg-surface")}
      >
        <MonitorIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
```

Three options is the right default: **Light / Dark / System**. Two-state toggles force users to commit to one preference instead of "match my OS." System should be the *default* state for users who haven't expressed a preference.

> **Going deeper.** Storing the theme preference in localStorage is fine for most apps. For products with logged-in users where preferences should follow them across devices, store the preference server-side and apply it server-rendered. The trade-off: a roundtrip on first paint. Most teams accept the localStorage approach because the gain isn't worth the complexity.

---

## Common dark mode pitfalls

Six failure modes that account for most dark-mode regressions:

### 1. Pure black + pure white

`#000000` background with `#ffffff` text is the harshest possible reading experience. Use `gray-950 / gray-100` or `gray-900 / gray-50` ranges.

### 2. Direct colour inversion

`bg-blue-600` does not become "good dark-mode blue" by inverting it. Brand colours typically shift *up* the value scale in dark mode (indigo-600 → indigo-400), and may need slight desaturation.

### 3. Focus rings disappearing

A focus ring of `ring-blue-500` works on white. On near-black, the same blue is barely visible. Either use a different focus colour for dark mode (`dark` token flips the ring colour too) or use a thicker ring with an offset for visibility.

### 4. Images and illustrations

PNG illustrations baked for light mode stand out as bright rectangles in dark mode. Either:

- Use SVGs whose colours reference CSS variables, so they flip with the theme.
- Provide two PNG variants and swap with `<picture>` + `prefers-color-scheme`.
- Reduce illustration brightness in dark mode via `filter: brightness(0.85)`.

### 5. Code blocks not theming

Syntax-highlighted code blocks often have hardcoded colours from a theme like `github-light`. Most syntax highlighters (Shiki, Prism) support per-theme color schemes — switch the theme based on the parent `dark` class.

### 6. Forgotten components

A new component shipped that didn't get token-aware. Two months later the team realizes it. **Solution: make missing token usage a lint rule.** ESLint plus a custom rule that flags `bg-white`, `bg-black`, `text-gray-X`, etc. when used directly in design-system components catches this at PR time.

---

## Real-world references

Three implementations worth studying:

- **shadcn/ui's theming setup.** Token-flipping via CSS variables, exactly the pattern in this chapter. The `globals.css` template is the cleanest reference implementation in 2026.
- **Linear's dark mode.** Slightly off-black backgrounds, lighter brand variant, careful elevation through subtle shading. Worth opening light-mode and dark-mode side by side and noticing the deliberate differences.
- **Vercel's dashboard.** Defaults to system theme, snapshot-stable across major redesigns. The toggle is a 3-state segmented control like the one above.

---

## A dark-mode checklist

Before shipping dark mode (or auditing an existing implementation):

1. **Components consume semantic tokens, not raw colours.** No `bg-white`/`bg-black` in component code.
2. **Tokens flip via CSS variables on `:root.dark`** — single source of truth for both themes.
3. **Class-based theming with `next-themes` or equivalent**, not pure media query.
4. **System / Light / Dark toggle**, not just binary.
5. **Inline FOUC-prevention script in `<head>`**, before React renders.
6. **Dark palette is not pure black + pure white.** Verified with contrast checker.
7. **Focus rings, hover states, error states all visible in both themes.**
8. **Lighthouse a11y audit passes in both themes.**
9. **Storybook stories tested in both themes** (Storybook has a "dark mode" addon for this).

---

## What you should walk away with

- **Dark mode is a property of the token system, not of individual components.** The right architecture flips CSS variables based on a parent class; components never reference dark mode directly.
- **Class-based theming with system-preference default** is the 2026 standard. Pure media-query theming denies users control.
- **Don't invert your light palette.** Real dark themes use nuanced off-black backgrounds, slightly-shifted brand colours, and elevated surfaces via lighter (not darker) shading.
- **The FOUC fix is an inline script in `<head>` that runs before React.** `next-themes` ships this; if you're rolling your own, copy the pattern.
- **Lint and Storybook check dark mode continuously.** Otherwise it drifts.

In the final chapter we put everything together: how to take an existing codebase that doesn't have a design system and migrate it to one without grinding feature work to a halt.

---

*Next up — Chapter 7: Migrating from Ad-Hoc CSS to a Design System. The 5-phase playbook for the most common engineering migration of the late 2020s, with the anti-patterns that derail it and the codemods that don't.*
