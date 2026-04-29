---
title: "Component API Design — Props, Variants, and Composition"
order: 3
tags: ["design-system", "react", "component-api", "variants", "typescript"]
date: "2026-04-29"
draft: false
lang: "en"
---

A design system is judged by its components, and components are judged by their APIs. Visual polish and clean tokens don't save a `Dialog` whose props collection has grown to 23 boolean flags over three years. Conversely, a slightly rough but well-designed API survives years of feature requests because each new requirement has somewhere natural to fit.

This chapter is about *the API surface* of components — what props mean, when to add a variant vs a separate component, when to use compound patterns, and how to write component types that stay compile-time correct as the system grows. We'll redesign the `Button` from chapter 2 into a proper system component along the way.

---

## The four API patterns

Almost every component you'll design uses one of four patterns or a combination of them. Knowing when to reach for which is most of the skill of component API design.

### Pattern 1: Variant props

Discrete styles selected via prop values:

```tsx
<Button variant="primary" size="md">Save</Button>
<Button variant="secondary" size="sm">Cancel</Button>
<Button variant="ghost" size="lg">More</Button>
```

This is the right pattern when:

- The component has a closed, finite set of visual variations
- All variations share the same structure (a button is always one rectangle with text)
- The variations differ in *style*, not *behaviour*

Almost every "primitive" component in a design system uses this pattern: `Button`, `Badge`, `Input`, `Alert`, `Toast`. It's the default — start here.

### Pattern 2: Compound components

Multiple components that work together as a unit, with shared state managed by a parent:

```tsx
<Tabs defaultValue="account">
  <Tabs.List>
    <Tabs.Trigger value="account">Account</Tabs.Trigger>
    <Tabs.Trigger value="password">Password</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Panel value="account">…</Tabs.Panel>
  <Tabs.Panel value="password">…</Tabs.Panel>
</Tabs>
```

This is the right pattern when:

- The component has multiple related sub-elements with different behaviour
- Consumers need to control the layout/order of those sub-elements
- A "props for everything" approach would balloon to 15+ props

Compound components are how Radix UI ships almost all its primitives. They're more verbose than variant-prop components, but they scale to genuinely complex UI without the prop explosion. `Dialog`, `DropdownMenu`, `Tabs`, `Accordion`, `Select` should almost always be compound.

### Pattern 3: Composition with `asChild` (slot pattern)

A component delegates its rendering to a child element while keeping its behaviour:

```tsx
{/* Default: renders a <button> */}
<Button>Save</Button>

{/* Renders an <a> while keeping Button's styles + behaviour */}
<Button asChild>
  <Link href="/settings">Settings</Link>
</Button>
```

This is the right pattern when:

- The component's *visual appearance* is its identity but consumers might need it to be different DOM elements
- Buttons that need to navigate (and thus be `<a>` tags), inputs that need to be `<textarea>` sometimes, etc.

Radix popularised this with `Slot` — a component that merges its props into its single child. It's the right escape hatch for "this is a Button, but sometimes it's a link."

### Pattern 4: Render props / function children

A component exposes its internal state to consumers via a function:

```tsx
<Disclosure>
  {({ isOpen }) => (
    <>
      <Disclosure.Button>{isOpen ? "Hide" : "Show"} details</Disclosure.Button>
      <Disclosure.Panel>…</Disclosure.Panel>
    </>
  )}
</Disclosure>
```

Use this **sparingly**. It's powerful but dense, and most modern systems prefer compound components instead. Render props are appropriate when the state genuinely needs to be threaded into custom consumer logic that compound components can't express.

---

## Building the running example: `Button`

Let's redesign the chapter 2 `Button` properly. Starting requirements:

- **Variants:** `primary`, `secondary`, `ghost`, `destructive` (visual style)
- **Sizes:** `sm`, `md`, `lg`
- **Loading state**, **disabled state**, optional **icon**
- Should support being rendered as a different element (link button)

### Step 1: Variant props with `cva`

The `class-variance-authority` (cva) library is the modern way to express variants in Tailwind. It's small (1KB), typed, and used by shadcn/ui internally.

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  // Base styles applied to all variants
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:     "bg-brand text-white hover:bg-brand-hover focus-visible:ring-brand",
        secondary:   "border border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-brand",
        ghost:       "text-gray-700 hover:bg-gray-100 focus-visible:ring-brand",
        destructive: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

type ButtonVariants = VariantProps<typeof buttonVariants>;
```

`cva` does three useful things at once:

1. Defines the variant classes in one place (no scattered ternaries in JSX).
2. Generates a TypeScript type (`VariantProps`) that you can use on the component's props.
3. Picks the right combination of classes based on the variant + size you pass in.

### Step 2: The component

```tsx
import { Slot } from "@radix-ui/react-slot";
import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonVariants } from "./button-variants";
import type { VariantProps } from "class-variance-authority";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  leftIcon,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      data-loading={loading}
      {...props}
    >
      {loading ? (
        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
      ) : leftIcon ? (
        <span className="mr-2 flex">{leftIcon}</span>
      ) : null}
      {children}
    </Comp>
  );
}
```

A few decisions worth calling out:

- **`asChild` via Radix's `Slot`** — gives consumers the escape hatch to render as `<a>` or any other element while keeping all the button styles and props.
- **`disabled || loading`** — a loading button is also functionally disabled, but we want to track the two semantically distinct states. The `data-loading` attribute lets stylesheets and tests target it.
- **`cn` utility** — the classic `clsx + tailwind-merge` combination, so consumer-supplied `className` overrides default classes correctly.
- **`leftIcon` as a discrete slot** — better than letting consumers render whatever inside `children`, because we can space it consistently.

### Step 3: Usage

```tsx
<Button>Save</Button>
<Button variant="secondary" size="sm">Cancel</Button>
<Button variant="destructive" loading>Deleting…</Button>

<Button asChild>
  <Link href="/settings">Open settings</Link>
</Button>

<Button leftIcon={<PlusIcon className="h-4 w-4" />}>Add task</Button>
```

This is roughly the API shadcn/ui ships. It's not the most flexible button possible — but it's the *right amount* of flexibility for 95% of use cases, and the rest can be solved with `asChild` or `className` overrides.

---

## When variants stop being enough

The `Button` above is closed: a finite list of variants and sizes. That's the correct shape for atoms. Compound patterns become necessary when the component has multiple sub-elements with different behaviour.

Take `Dialog`. The variant-props approach is:

```tsx
{/* This API gets ugly fast */}
<Dialog
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Delete account"
  description="This action cannot be undone."
  primaryActionLabel="Delete"
  onPrimaryAction={handleDelete}
  secondaryActionLabel="Cancel"
  onSecondaryAction={() => setIsOpen(false)}
  primaryDestructive
  showCloseButton
  size="md"
/>
```

Six props in, you can already feel the weight. Twelve months in, this prop list will be 25 long.

The compound version:

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Delete account</Dialog.Title>
      <Dialog.Description>This action cannot be undone.</Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="destructive" onClick={handleDelete}>Delete</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog>
```

More verbose? Yes. But the layout is now in the consumer's hands. Want a third action? Add another `<Button>`. Want a custom header? Replace `<Dialog.Header>` with whatever. The component never has to grow a `tertiaryActionLabel` prop.

The rule of thumb: **once a component has more than two semantically-distinct sub-regions, switch to compound.**

---

## The props explosion anti-pattern

Three signs your component API has gone wrong:

### 1. Boolean prop accumulation

```tsx
<Card
  bordered
  rounded
  shadowed
  hoverable
  selectable
  collapsible
  draggable
  loading
  disabled
/>
```

Each boolean is a binary visual switch. Eight booleans = 256 combinations, of which maybe 12 are intentional. The rest are bugs waiting to be discovered.

**Refactor:** turn the booleans into a discriminated `variant` or break the component apart. A `Card` that's `bordered + rounded + shadowed` is one variant; `bordered + rounded` (no shadow) is another. Name them.

### 2. Props that contradict each other

```tsx
<Button primary secondary />   {/* which is it? */}
<Input small large />
<Modal open closed />
```

The compiler can't help you. Your team won't either. **Refactor:** any time you have multiple booleans that represent positions on the same axis, replace with a single string-typed prop (`variant: "primary" | "secondary"`).

### 3. Render-prop everything

```tsx
<Table
  data={rows}
  renderRow={...}
  renderHeader={...}
  renderCell={...}
  renderEmpty={...}
  renderLoading={...}
  renderError={...}
  renderFooter={...}
/>
```

If half your props are functions, you've reinvented compound components badly. **Refactor:** `<Table.Header>`, `<Table.Body>`, `<Table.Row>`, `<Table.Empty>` as compound subcomponents.

---

## Polymorphism: the `as` prop

A pattern with a clear name and a clear cost. `as` lets a component render as a different element:

```tsx
<Heading as="h1">…</Heading>
<Heading as="h2">…</Heading>
<Text as="p">…</Text>
<Text as="span">…</Text>
```

This is appropriate for components that exist *because of their styling*, where the underlying HTML element varies by usage (typography components are the classic example). For these, `as` is a clean API.

The cost is in the types — making `as` correctly typed (so consumers get IntelliSense for `<Heading as="h1">` knowing it's an `h1`) requires generic prop forwarding that's notoriously difficult in TypeScript. Most teams either use a library (`react-polymorphic-types`) or accept that `as` typing has rough edges.

For most components — buttons, inputs, dialogs — **prefer `asChild` over `as`.** `asChild` doesn't need polymorphic typing because the consumer brings their own element (with its own types). It's the cleaner pattern in 2026.

---

## Strict TypeScript: the API contract in code

The TypeScript types for a component are part of its API. Make them strict.

### Use string unions for variant-like props

```tsx
// Good: discriminated union, IntelliSense suggests valid values
type Variant = "primary" | "secondary" | "ghost";

// Bad: any string compiles
type Variant = string;
```

### Make required props required

```tsx
// Good: TypeScript blocks <Input /> with no value or onChange
interface InputProps {
  value: string;
  onChange: (next: string) => void;
}

// Bad: optional everything → consumers can build broken inputs
interface InputProps {
  value?: string;
  onChange?: (next: string) => void;
}
```

### Use discriminated unions for mutually-exclusive prop combinations

```tsx
// Either show a tooltip OR not — never both
type ButtonProps = (
  | { tooltip: string; "aria-label"?: never }
  | { tooltip?: never; "aria-label"?: string }
) & {
  /* shared props */
};
```

Discriminated unions catch real bugs at the type level — combinations of props that don't make sense in production simply won't compile in dev.

> **Going deeper.** A useful design exercise: write the `interface ButtonProps` *before* writing any of the component code. The shape of the props forces you to articulate what the component is and isn't. If you can't write 8 props that fully specify the component without overlap, the component itself is probably trying to do too much.

---

## API stability — the unspoken contract

The moment a component is consumed by another team's code, its props are an API. Same rules apply as backend APIs:

- **Adding optional props is non-breaking.** Existing consumers keep working.
- **Adding a required prop is breaking.** Every consumer needs to update.
- **Removing a prop is breaking.** Even if "nobody's using it" — somebody is.
- **Renaming a prop is breaking.** This is a rename + deprecation window, not a single change.
- **Changing the meaning of a prop is breaking,** and worse than removing it because it silently breaks consumers.

Chapter 5 covers this in depth — semver applied to design systems, deprecation policies, codemods. For now, internalize: **once a component's props ship, they're a contract you owe consumers.**

---

## A component-API checklist

Before you ship a new component:

1. **API pattern picked deliberately** — variant props, compound, `asChild`, render-props — not "I just started typing."
2. **Variants are discriminated string unions**, not boolean accumulations.
3. **No more than ~6 props on any single sub-component.** More than that, refactor toward compound.
4. **`asChild` available** if the component might need to render as a link or different element.
5. **TypeScript types are strict.** Required props are required. Mutually-exclusive props are a discriminated union.
6. **Disabled, loading, focus, hover states** all designed and tested.
7. **`cn` utility used** for `className` merging — consumers can override.
8. **Component ships with at least 3 example usages** in Storybook (chapter 4) showing the variants.

---

## What you should walk away with

- **Four API patterns — variant props, compound, `asChild`, render props — cover ~95% of components.** Pick deliberately; don't drift in by accident.
- **Variant props are the default for atoms** (Button, Badge, Input). Use `cva` for the implementation.
- **Compound components scale to complex UIs** (Dialog, Tabs, Menu) without prop explosion. Switch to compound the moment a component has >2 semantic sub-regions.
- **`asChild` is the modern escape hatch** for "render as a different element." Prefer it over `as` for non-typography components.
- **TypeScript types are the API contract.** Strict types catch real bugs and document the component for free.

In chapter 4 we move from designing components in isolation to *displaying and testing* them: Storybook, the canonical workflow, and what makes a story collection that earns its keep.

---

*Next up — Chapter 4: Storybook in Practice — Documentation, Testing, and Living Specs. Why every well-run design system has a Storybook, and what makes the difference between a Storybook that gets used and one that gets abandoned.*
