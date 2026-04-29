---
title: "Storybook in Practice — Documentation, Testing, and Living Specs"
order: 4
tags: ["design-system", "storybook", "testing", "documentation", "react"]
date: "2026-04-29"
draft: false
lang: "en"
---

A design system without a documented surface is a system in name only. Engineers consuming it have to grep through source code to find what's available; designers reviewing it have to ask an engineer to spin up a sandbox; new hires onboard slower than they should. The conventional answer to all three problems is **Storybook** — an isolated component playground that doubles as documentation, testing harness, and the living spec for the system.

This chapter is about how to use Storybook *well*: what makes a story collection that earns its keep vs one that gets abandoned, the patterns that scale, and how Storybook fits into a CI-driven design-system workflow with visual regression and interaction testing layered on top.

---

## Why Storybook (and not just a docs site)

Three things distinguish Storybook from a static documentation site:

1. **Components run live.** You see real React rendering at real screen sizes, with real interactivity. A documentation site shows screenshots; Storybook shows the actual thing.
2. **Stories are code.** They live next to the component, version with it, and break the build when the component breaks. A docs site requires manual sync; Storybook is intrinsically synced.
3. **Stories are testable surfaces.** Visual regression tools (Chromatic), interaction tests (Playwright, Storybook's built-in test runner), and accessibility checks (Storybook's a11y addon) all run *against the stories*. The same artifact is documentation and test fixture.

In 2026, the common alternatives — Ladle, Histoire, custom MDX setups — exist and are worth considering for specific cases. But Storybook is the lingua franca, has by far the largest plugin ecosystem, and is what most engineers are already familiar with. We'll use it as the reference here.

> **Going deeper.** One conspicuous outlier: shadcn/ui — the most influential component pattern in 2026 — does not use Storybook. Its docs site is a custom Next.js app rendering live components in MDX. The reason: shadcn's whole thesis is that consumers *own* the components, so the system has no separate library to document. For a system that *is* a library (most of them), Storybook is still the right answer.

---

## The CSF 3.0 syntax

Stories in 2026 are written in **Component Story Format (CSF) 3.0** — a TypeScript-friendly, declarative format. A typical file:

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";
import { PlusIcon } from "lucide-react";

const meta: Meta<typeof Button> = {
  component: Button,
  title: "Primitives/Button",
  args: {
    children: "Save",
    variant: "primary",
    size: "md",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "destructive"],
    },
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Cancel" },
};

export const Loading: Story = {
  args: { loading: true, children: "Saving…" },
};

export const WithIcon: Story = {
  args: {
    leftIcon: <PlusIcon className="h-4 w-4" />,
    children: "Add task",
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
```

Everything in this file is real and ships in production design systems. Walking through what each piece earns its place:

### `meta`

The default export. Defines the *component* the stories are for, the *title* (which becomes the navigation path in Storybook's sidebar), and shared `args` (default props for every story in this file).

### `argTypes`

Tells Storybook how to render the controls panel — the live UI that lets you tweak props in the browser. `select` for closed enums; `radio` for small options; `text`, `boolean`, `number` for primitives. Without `argTypes`, Storybook tries to infer controls from TypeScript, which works most of the time but is worth nailing for variant-style props.

### Individual stories

Each named export is one story. The minimum story is `export const Default: Story = {}` — Storybook will use the meta's `args` to render the component. Per-story `args` override the defaults.

### `render` for compositions

When a story shows multiple instances of a component (like the `Sizes` story above), use `render` instead of `args`. `render` is just a function that returns JSX — full creative control.

---

## What stories should exist for every component

A common Storybook anti-pattern is one story per component (`Default`) and nothing else. The component compiles; Storybook renders something; the team moves on. The result is a Storybook that's nice to *have* but not actually *useful* — nobody opens it because there's nothing to learn from one story.

The discipline that makes Storybook earn its keep: **every component has the same baseline set of stories**, plus component-specific extras.

### The baseline (every component)

1. **`Default`** — the most common usage, with default props.
2. **One story per major variant** — `Primary`, `Secondary`, `Ghost`, etc. (For Button: 4 stories.)
3. **Sizes** — a single story showing all sizes side-by-side.
4. **States** — separate stories for `Disabled`, `Loading`, `Focused` (where applicable).
5. **EdgeCases** — long text, very short text, no text, mobile-narrow viewport.

For Button, that's already ~10 stories — and that's correct. Each one is a vector for catching regressions.

### Component-specific stories

For more complex components, add stories that exercise the API:

- **Dialog:** `Default`, `WithCustomHeader`, `LongContent`, `WithMultipleButtons`, `Destructive`, `Nested` (a dialog opening another dialog), `OnSmallScreen`.
- **Tabs:** `Default`, `ManyTabs` (10+), `WithIcons`, `Vertical`, `WithLazyContent`.
- **Form components (Input/Select/etc.):** `Default`, `WithError`, `Disabled`, `WithLabel`, `WithHelperText`, `Required`.

The rule: **whenever a bug is reported, add a story for the bug-reproduction case.** The story stays in the codebase forever as a regression test (especially when paired with visual regression — see below). This is how a Storybook compounds in value over time.

---

## Where stories live, organizationally

Two conventions exist; both work:

### Convention A: Stories next to components

```
components/
├── Button/
│   ├── Button.tsx
│   ├── Button.stories.tsx
│   ├── Button.test.tsx
│   └── index.ts
└── Dialog/
    ├── Dialog.tsx
    ├── Dialog.stories.tsx
    └── …
```

Stories are colocated with the component they document. This is the default for monorepos and most teams. Pro: easy to discover, easy to keep in sync. Con: adds files to component folders.

### Convention B: Stories in a parallel tree

```
components/
└── Button/
    ├── Button.tsx
    └── index.ts
stories/
└── Button.stories.tsx
```

Less common. Used when stories are maintained by a separate team or when there's a strong reason to keep production code "story-free." Most teams find this slows them down.

**Default to A unless you have a specific reason to do otherwise.**

---

## Storybook as documentation source of truth

A Storybook that's just stories is a playground. A Storybook with **autodocs** is documentation.

In CSF 3.0, you opt into auto-generated docs via:

```tsx
const meta: Meta<typeof Button> = {
  component: Button,
  title: "Primitives/Button",
  tags: ["autodocs"],
  // …
};
```

This generates a "Docs" tab that shows:

- The component's props table (extracted from TypeScript types)
- Each story rendered with live controls
- Per-story descriptions if you provide them via JSDoc comments on the component or stories

For most components, autodocs is enough. For components with complex usage notes (forms, accessibility-critical components), supplement with **MDX** files:

```mdx
{/* Button.mdx */}
import { Meta, Canvas } from "@storybook/blocks";
import * as ButtonStories from "./Button.stories";

<Meta of={ButtonStories} />

# Button

A primary interactive element. Use the `primary` variant for the main action,
`secondary` for confirmations, `destructive` for deletions, and `ghost` for
tertiary actions.

## Variants

<Canvas of={ButtonStories.Default} />
<Canvas of={ButtonStories.Secondary} />

## Accessibility

- The button is rendered as `<button>` by default, with `<a>` available via `asChild`.
- Disabled state is `disabled` on the underlying element + `aria-disabled="true"` (Storybook's a11y addon will verify this).
- Loading state announces "Loading…" to screen readers via `aria-live`.

## Anti-patterns

- Don't use `<Button>` for things that aren't actually buttons. Tabs, links, and toggles all have their own components.
- Don't override `className` to change the variant — add a new variant in the cva config instead.
```

MDX is what turns a Storybook from "components in isolation" into "the canonical reference for the system." Most well-run design systems have MDX for at least their non-trivial components.

---

## Visual regression testing with Chromatic

Once you have stories, **visual regression testing** is the highest-leverage thing you can layer on top. Every component, every variant, every state, screenshotted on every PR. If anything changes pixel-wise, the change is surfaced explicitly for review.

The standard tool is **Chromatic** (built by the Storybook team). The setup:

1. Sign up for Chromatic, get a project token.
2. Add the GitHub Action: on every PR, run Chromatic against the changed stories.
3. Reviewers see a side-by-side of "before" and "after" for every visual change, click "approve" or "deny" in the Chromatic UI.

```yaml
# .github/workflows/chromatic.yml
name: Chromatic
on: [pull_request]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - uses: chromaui/action@v11
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

Why this matters more than unit tests for components:

- **CSS regressions are invisible to unit tests.** A `Button` whose hover state silently broke still passes its render-test.
- **Cross-browser, cross-viewport rendering is checked.** Chromatic runs each story in multiple browsers and at multiple widths.
- **The reviewer sees the change.** "Approve this 3-pixel padding shift?" is a much more useful question than "do these 47 lines of CSS look right?"

For internal/budget-conscious teams, **`@storybook/test-runner`** with **Playwright snapshots** is a free local alternative. It's less polished than Chromatic but gives you most of the value.

> **Going deeper.** Visual regression on every PR sounds great until you ship a redesign and 200 stories all "regress" at once. The right workflow: review and approve the entire batch in Chromatic's UI in one sweep, then merge. The tooling is built for this — bulk-approving a redesign isn't fighting the system, it's the system working as intended. The anti-pattern is *avoiding visual regression* because the redesign is "too big to track" — that's exactly when you most need it.

---

## Interaction testing in stories

Storybook 7+ supports **play functions** — interaction tests that run inside stories:

```tsx
import { userEvent, within, expect } from "@storybook/test";

export const ClickToLoad: Story = {
  args: { children: "Save" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /save/i });

    await userEvent.click(button);
    await expect(button).toHaveAttribute("data-loading", "true");
  },
};
```

These run automatically in Storybook's test runner and in CI. They serve two purposes:

1. **Documentation.** Reading the play function tells you what the component does on interaction.
2. **Regression.** If the click handler breaks or the loading state stops applying, the test fails.

Use play functions for **state transitions** (clicks that reveal something, focus that triggers something) and **a11y interactions** (keyboard navigation through compound components). Don't use them for simple render assertions — those belong in unit tests.

---

## Accessibility checks for free

Storybook's a11y addon (`@storybook/addon-a11y`) runs **axe-core** against every story. The cost: install one addon. The benefit: every component and every variant gets accessibility-audited continuously.

```ts
// .storybook/preview.ts
import type { Preview } from "@storybook/react";

const preview: Preview = {
  parameters: {
    a11y: {
      // optional: configure axe rules per-project
      element: "#storybook-root",
      manual: false,
    },
  },
};

export default preview;
```

The addon shows a "Violations" panel for each story listing accessibility failures with severity, rule, and a link to the WCAG criterion. This catches the categories of accessibility issues from chapter 6 of the UX Fundamentals series — missing labels, low contrast, focus issues — *automatically*, in dev.

In CI, run `@storybook/test-runner --check-a11y` to fail the build on critical violations.

---

## What stories *not* to write

A common Storybook anti-pattern: stories for entire pages or feature flows.

```tsx
// Don't do this
<SettingsPage />

// Or this
<CheckoutFlow currentStep={2} />
```

Stories are for *components*, not pages. The reasons:

- Pages have routing, data fetching, server state — none of which Storybook is designed to mock cleanly.
- Page tests belong in your e2e suite (Playwright, Cypress) where the full app is running.
- Storybook bloats fast if you treat it as an integration-test environment.

The right division: **Storybook for components and small compositions; e2e for whole pages and flows.** Some overlap is fine (a complex form might warrant a Storybook composition), but resist the urge to put every screen in there.

---

## A Storybook discipline checklist

Before merging a new component:

1. **At least Default + variant + state stories** for every variant the component supports.
2. **Args + argTypes** so the controls panel works correctly for every prop.
3. **`tags: ["autodocs"]`** for autogenerated docs, plus an MDX file if the component has non-trivial usage notes.
4. **A11y addon shows zero violations** for all stories.
5. **At least one play function** if the component has interactive behaviour beyond plain props.
6. **Every reported bug has a regression story.** No exceptions.
7. **Stories live next to the component** (or wherever your team's convention is — but consistently).
8. **Visual regression CI runs** (Chromatic or `@storybook/test-runner` snapshots) on every PR.

---

## What you should walk away with

- **Storybook is the canonical workflow for design system components in 2026.** It's documentation, test harness, and live spec all in one.
- **Discipline beats setup.** A Storybook with a baseline set of stories per component (default + variants + states + edge cases) earns its keep; a Storybook with one story per component doesn't.
- **Layer testing on top.** Visual regression (Chromatic), interaction tests (play functions), and accessibility checks (a11y addon) turn Storybook from documentation into safety net.
- **Stories are for components, not pages.** Page-level testing belongs in e2e.

In chapter 5 we tackle the discipline that keeps a design system alive across years — versioning, breaking changes, deprecation policies, and the migration tooling that lets you actually evolve.

---

*Next up — Chapter 5: Versioning and Breaking Changes — The Long-Game Discipline. The single biggest difference between a design system that lasts and one that gets quietly abandoned in 18 months.*
