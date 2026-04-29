---
title: "Form Design — Validation, Errors, and Micro-Interactions"
order: 7
tags: ["ux", "forms", "validation", "react", "accessibility"]
date: "2026-04-29"
draft: false
lang: "en"
---

Forms are the single most-used interactive surface in any product. Every signup, login, settings page, search, comment, payment, support request, and onboarding step is a form. They're also where developers most consistently ship UX failures — partly because forms have many independent decisions (label position, validation timing, error formatting, focus management, submit behaviour) and a wrong call on any one of them shows up as friction.

This chapter walks through the principles that separate a form users blast through from one they abandon, with a complete React + Tailwind implementation that you can lift into a real project.

---

## What "good form" actually means

A good form has a small number of measurable properties:

- **Time to complete is low** — users don't get stuck.
- **Error rate is low** — users finish without entering something the form rejects.
- **Recovery is fast** — when an error does happen, users fix it without rereading the whole form.
- **Abandonment is low** — users actually submit instead of giving up halfway.

Every principle in this chapter optimizes one or more of these. Pretty forms are nice; *measurable* forms are valuable. If you ship a form and metrics don't move, the form's fancy.

---

## Label position — settle this once

Three options exist, and the developer community has converged on one as the right default.

| Position | Pros | Cons | Verdict |
|---|---|---|---|
| **Above the input** | Always visible, easy to scan, fast to read | Slightly more vertical space | ✓ Default for nearly all cases |
| **Inside the input (placeholder-as-label)** | Compact | Disappears on focus, low contrast, accessibility issues | ✗ Avoid |
| **Beside the input (left-aligned label)** | Compact horizontally | Hard to scan a column of fields, mobile-unfriendly | ✗ Avoid in modern UI |

**Use labels above inputs.** This isn't aesthetic preference — it's the position that scans fastest, survives mobile layouts, supports screen readers without contortions, and never disappears.

```tsx
<label className="block">
  <span className="block text-sm font-medium text-gray-700 mb-1">
    Email address
  </span>
  <input
    type="email"
    placeholder="you@example.com"
    className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
  />
</label>
```

The placeholder is for *example content* (`you@example.com`), not for *labelling* the field.

---

## Validation timing — the surprisingly hard problem

When should you validate a field? The choices and their tradeoffs:

- **On submit only** — user fills out the whole form, hits submit, gets a wall of errors. Clean if the form is short, frustrating for longer ones.
- **On change (every keystroke)** — instant feedback, but reports "invalid email" while the user has typed `b@`. Annoying.
- **On blur (when the field loses focus)** — the user moves on, *then* gets the verdict. The right default.
- **On blur, then on change once an error is shown** — the polished version. After the field becomes invalid, real-time validation kicks in so the user sees the error clear as they fix it.

The rule of thumb: **silent until the user has had a chance to enter the field; chatty once an error exists.**

```tsx
function EmailField() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  function validate(v: string) {
    if (!v) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Email looks invalid.";
    return null;
  }

  // Validate on change only after the user has blurred at least once.
  function handleChange(v: string) {
    setValue(v);
    if (touched) setError(validate(v));
  }

  function handleBlur() {
    setTouched(true);
    setError(validate(value));
  }

  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">
        Email address
      </span>
      <input
        type="email"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        aria-invalid={!!error}
        aria-describedby={error ? "email-error" : undefined}
        className={`w-full border rounded-md px-3 py-2
          focus:ring-2 focus:ring-blue-500
          ${error ? "border-red-500" : "border-gray-300"}`}
      />
      {error && (
        <p id="email-error" className="text-sm text-red-600 mt-1">
          {error}
        </p>
      )}
    </label>
  );
}
```

For real projects, **react-hook-form + zod** does this whole pattern declaratively and is worth the dependency. The principles are the same; the boilerplate goes away.

> **Going deeper.** The `aria-invalid` and `aria-describedby` attributes are doing screen-reader work — when the field becomes invalid, an assistive technology announces the error message. Without these, a screen reader user sees their field highlight but has no idea why. This is one of the smallest accessibility wins a form can ship.

---

## Error messages that earn their pixels

Bad: `Invalid input`. Slightly better: `Email is invalid`. Good: `Email is invalid — make sure there's no space before the @`.

The pattern from chapter 2's heuristic 9, applied specifically to forms:

1. **What's wrong**, in plain words.
2. **Why it's wrong**, if non-obvious.
3. **What to do**, as an action.

For common patterns:

| Bad | Better |
|---|---|
| "Required" | "Please enter your email" |
| "Invalid input" | "Phone number must include country code" |
| "Failed" | "We couldn't reach our server. Try again in a moment." |
| "Password too weak" | "Use at least 12 characters with one number or symbol." |

Place the error directly below the field it refers to, in a colour that passes WCAG (`text-red-600` on white = 4.7:1, passes AA). Don't pile errors at the top of the form — users have to scroll back to find each field.

---

## Don't lose what the user typed

The single most user-hostile form behaviour: clearing fields on submit-error. The user fills out 12 fields, hits submit, sees "passwords don't match", and the password fields have been cleared. They retype both. Now there are 2 errors, both because the form helpfully erased their work.

**Rule:** never reset valid fields on error. Only clear fields after a successful submit. Even password fields, if you must clear them, should make it crystal clear *why* (a brief inline note saying "please re-enter for security").

The corollary: persist form state during navigation. If a user opens a "Help" link mid-form, they shouldn't lose what they typed when they come back. For long forms, save draft state to localStorage on every change.

---

## Disabled buttons need reasons

A submit button greyed out with no explanation is the form equivalent of a locked door with no sign. Users assume something's wrong with their browser, double-click it, refresh the page, etc.

If the submit is disabled because required fields aren't filled, **let users click it anyway and surface the errors**. They'll learn what's missing.

```tsx
async function handleSubmit() {
  const errors = validateAll(fields);
  if (errors.length > 0) {
    setErrors(errors);
    // Focus the first errored field — see "focus management" below
    document.querySelector<HTMLInputElement>(`[name="${errors[0].field}"]`)?.focus();
    return;
  }
  // …submit…
}

<button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded">
  Submit
</button>
```

Alternatively, keep the button enabled but show inline tooltips on disabled fields. Either is acceptable; the *silent* disabled button is the failure mode.

---

## Focus management — the invisible UX

When a user submits a form with errors, where does their cursor go? In most products, nowhere — they have to scroll up, scan for the highlighted field, and click it. With proper focus management, the cursor lands on the first errored field automatically.

```tsx
useEffect(() => {
  if (firstErrorField) {
    const el = document.querySelector<HTMLInputElement>(`[name="${firstErrorField}"]`);
    el?.focus();
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}, [firstErrorField]);
```

This single behavior — focus the first error — is one of the most underrated form UX wins. Free, invisible until you need it, dramatically reduces error-recovery time.

Other focus rules:

- **Auto-focus the first field of a single-purpose form** (login, search). Saves a click for the common case.
- **Don't auto-focus inside a long form on a content page.** Stealing focus mid-scroll is jarring.
- **After submit-success, send focus to the success message or the next logical action.** A confirmed deletion should focus the next item in the list, for example.

---

## Multi-step forms — show progress, don't lose state

For forms that span multiple steps (signup with profile, checkout, multi-page surveys):

- **Show a progress indicator.** "Step 2 of 4" with a bar, or a horizontal stepper with labels. Users tolerate length; they don't tolerate uncertainty about how much length.
- **Allow back navigation.** Users will want to revise step 1 from step 3. The back button should not lose state.
- **Validate per-step, not just on final submit.** If step 1 has an invalid email, the user should know before completing step 4.
- **Save progress between steps.** If they refresh, persist what they've entered (localStorage, URL state, or server-side draft).

Real example: **Stripe Checkout**. A multi-step flow (typically email → payment → confirm) with clear progress, back-navigation that preserves state, and every field validated as it's filled. The exact layout has evolved over the years, but the principles — visible progress, no lost state, inline validation — have held throughout. It's the polished gold standard for multi-step in 2026.

---

## Submission states — the four moments

Every form submit has four states. Designing all four is what separates "ships" from "ships well."

1. **Idle** — button enabled, no in-flight state.
2. **Submitting** — button shows loading state (`Saving…`), form is locked from re-submission.
3. **Success** — confirmation message, optional redirect, focus moved to "what's next".
4. **Error** — server error displayed clearly, fields are still populated, user can retry without retyping.

```tsx
function MyForm() {
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setServerError(null);
    try {
      await submitToServer(fields);
      setState("success");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Fields */}

      {serverError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="bg-blue-600 text-white px-4 py-2 rounded font-medium disabled:opacity-60"
      >
        {state === "submitting" ? "Saving…" : "Save"}
      </button>

      {state === "success" && (
        <p className="text-sm text-green-700">Saved successfully.</p>
      )}
    </form>
  );
}
```

The pattern is generic. Adapt the wording (`Saving / Sending / Submitting`), but the four states should always be designed.

---

## Micro-interactions — the polish layer

Once the basics are right, micro-interactions are the layer that takes a form from "good" to "Linear-quality":

- **Inline checkmark on validated field.** When an email passes validation, a small green checkmark inside the input — confirms success without an explicit message.
- **Subtle hover / focus animations.** Tailwind's `transition-colors duration-150` on borders. Cheap, clean, professional.
- **Success transition.** When the form submits successfully, a brief animation before redirect — fade, scale, or a checkmark draw-on. Tells the user "yes, that worked."
- **Loading skeleton instead of spinner** for form-loaded data. Gives the user a sense of layout while waiting.

These are 5-line additions per element that compound across a product.

> **Going deeper.** Stripe Elements (their hosted card-input component) is the canonical study in form micro-interactions. Every state change is animated; errors are surfaced inline; the disabled state has a visible reason. Worth opening their checkout demo and just clicking around — many of the patterns transfer to any form.

---

## Real-world forms to study

Three forms worth analyzing in detail:

- **Stripe Checkout.** The standard for payment forms — error timing, multi-step, accessibility.
- **Linear's quick-add task form.** Minimal, keyboard-first, immediate validation.
- **GitHub's PR creation form.** Long form done right — clear sections, smart defaults, draft state, never loses progress.

---

## A form-design checklist

Before merging any form PR:

1. **Labels are above inputs.** No placeholder-as-label.
2. **Validation timing: silent → on blur → on change after error.**
3. **Error messages explain what, why (if needed), and how to fix.**
4. **Submit-error doesn't clear valid fields.**
5. **Disabled submit button has a reason** (or is enabled with click-to-show errors).
6. **First error gets focus on submit failure.**
7. **All four submission states (idle, submitting, success, error) are designed.**
8. **`aria-invalid` and `aria-describedby` set on errored fields.**
9. **Keyboard navigation works end-to-end** (tab through, submit with Enter).
10. **Multi-step forms have visible progress and back-navigation that preserves state.**

---

## What you should walk away with

- **Forms have many independent decisions, and every one of them is visible.** Get any of them wrong and friction shows up.
- **Validation timing matters: silent until first blur, then real-time once an error exists.**
- **Never clear valid fields on error.** This single rule fixes a huge class of form frustrations.
- **All four submit states (idle, submitting, success, error) are part of the form, not afterthoughts.**
- **Focus management is invisible UX** — sending focus to the first error on submit is one of the cheapest, highest-leverage form behaviors.

In chapter 8 — the final one — we cover the four states every screen has and most apps ship only one of: empty, loading, populated, error.

---

*Next up — Chapter 8: The Forgotten States — Empty, Loading, Error. The states that separate "ships" from "shipped well", and the difference between a screen with one path and a screen that handles reality.*
