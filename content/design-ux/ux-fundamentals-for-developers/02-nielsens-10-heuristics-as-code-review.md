---
title: "Nielsen's 10 Heuristics as a Code Review Lens"
order: 2
tags: ["ux", "usability", "code-review", "heuristics"]
date: "2026-04-29"
draft: false
lang: "en"
---

If you only learned one UX framework, it should be this one. Jakob Nielsen first published these ten heuristics in 1994 and lightly revised them in 2020. Three decades later, they're still the most useful checklist a developer can run a UI through — partly because they're framed as principles rather than prescriptions, and partly because they cover the full surface from "what's the system doing right now?" to "how does the user recover when something breaks?"

This chapter walks through all ten, but with an unusual framing: each heuristic becomes a **question you'd ask during code review**. Not "is the design beautiful?" but "is this PR introducing a UI that satisfies heuristic X?" That reframing turns what is normally a designer's tool into something engineering teams can adopt without changing how they ship.

---

## Why heuristics, not rules

Nielsen called them *heuristics* deliberately. They're rules of thumb, not laws. Two of them will sometimes pull in opposite directions ("Aesthetic and minimalist design" vs "Visibility of system status"), and your job is to make a judgment call.

This is also why they survive — every "specific UI rule" ages badly (remember "always use a hamburger menu"?), but principles like "the system should always tell users what's going on" don't.

---

## The ten, with code-review framings

### 1. Visibility of system status

**Principle:** Users should always know what the system is doing — through appropriate, timely feedback.

**Code review question:** *When a user clicks this button, is there feedback within 100ms that something happened?*

The most common failure mode is the **silent click**. User clicks "Save", the form does an async API call, the button looks identical for 800ms, the user clicks again, the user clicks five more times, and now the API has been called six times.

```tsx
// Failure: nothing tells the user a request is in flight.
<button onClick={handleSave}>Save</button>

// Better: button reflects state immediately.
<button onClick={handleSave} disabled={isSaving}>
  {isSaving ? "Saving…" : "Save"}
</button>
```

**Real example:** Linear's command palette — every action gives instant visual confirmation, often before the network round-trip completes. Stripe's dashboard puts a subtle progress bar at the top of the page during navigation. Both are applications of this heuristic.

### 2. Match between system and the real world

**Principle:** Use the user's language, not internal jargon. Follow real-world conventions.

**Code review question:** *Would a user without access to our internal documentation understand the words on this screen?*

Engineers smuggle internal language into UI more than any other failure mode. "Entity not found" instead of "We couldn't find that customer." "Validation failed: schema mismatch" instead of "Email is invalid." "Tenant" instead of "Workspace."

**A simple test:** Read every visible string on a screen aloud. If it sounds like a database error message, it is one.

> **Going deeper.** This applies to icons too. A floppy disk for "save" is now a generation older than most users. A wrench for "settings" is fine; a gear is better. When in doubt, label icons — the cost of the extra word is far less than the cost of a confused user.

### 3. User control and freedom

**Principle:** Users make mistakes. Provide a clearly marked "emergency exit" — undo, cancel, back.

**Code review question:** *If a user gets to this state by mistake, can they get out without using the back button or refreshing?*

Two patterns developers consistently underbuild:

- **Undo for destructive actions.** Deleting a row should not require a confirmation modal *and* be irreversible. Pick one — either the action is reversible (no modal needed) or it isn't (modal explains why). Linear's "task moved to trash, undo?" toast is the canonical implementation.
- **Cancellable in-flight operations.** Long-running uploads, exports, and reports should be cancellable. Without a cancel button, users either wait nervously or close the tab and lose context.

```tsx
// A clean pattern: optimistic delete + undo toast.
async function handleDelete(id: string) {
  const item = await softDelete(id);
  toast.success("Item deleted", {
    action: { label: "Undo", onClick: () => restore(id) },
    duration: 5000,
  });
}
```

### 4. Consistency and standards

**Principle:** Don't invent. Same things look the same, different things look different — both within your product and across the platform.

**Code review question:** *Does this PR introduce a button/modal/input pattern that already exists somewhere else in the codebase, just slightly different?*

Three layers of consistency to watch for:

1. **Internal consistency.** "Save" buttons on different screens should look identical. The most common drift point is when team A ships a feature with one button style and team B ships another two months later with a slightly different style.
2. **External consistency.** If your product is on the web, ⌘K means "open command palette" — don't rebind it to something else. Right-click should show a context menu where users expect one.
3. **Component library discipline.** A design system isn't a brand exercise; it's a consistency-enforcement mechanism. Even a 10-component shadcn install is enough to prevent most of this drift.

### 5. Error prevention

**Principle:** The best error message is the one that never shows up. Design out the error before it can happen.

**Code review question:** *Could this error state have been prevented by the UI not allowing the action in the first place?*

Disable buttons that aren't actionable. Don't show "Submit" until required fields are filled. Don't let the user pick an end date before the start date. Don't let them upload a file type your backend doesn't accept.

A specific high-leverage example: **destructive action confirmations.** A confirmation dialog with a "Delete" and "Cancel" button is weak prevention because users habitually click "Delete" without reading. Stronger: require typing the resource name to confirm (GitHub's repo deletion). Or even stronger: make destructive actions a two-step soft-delete, like in heuristic 3.

### 6. Recognition rather than recall

**Principle:** Don't make users remember things. Show them.

**Code review question:** *Are users expected to remember information from a previous screen, or is it visible here?*

Recognition is easy; recall is hard. This is why dropdowns are easier than free-text fields, why command palettes show recent items, why "type to filter" is better than "type the exact name."

A common failure: a multi-step form that doesn't show what was entered in earlier steps. Users have to remember they typed `acme-prod-cluster` two pages ago to make sense of the "Configure cluster" step. Show it. Even a small "Cluster: acme-prod-cluster" label at the top of step 3 closes this gap.

### 7. Flexibility and efficiency of use

**Principle:** Novices and experts have different needs. Serve both.

**Code review question:** *Is there a power-user shortcut for this action, in addition to the obvious clickable path?*

The cheap version of this heuristic: **keyboard shortcuts**. The expensive version: customizable workflows, saved filters, macros.

Most products underinvest in the cheap version. Adding `⌘K` for command palette, `Esc` to close modals, `↑/↓/Enter` for list navigation, `?` for shortcut help — these are afternoons of work that compound for power users every day.

```tsx
// A minimal global shortcut hook.
useEffect(() => {
  function onKey(e: KeyboardEvent) {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      openCommandPalette();
    }
  }
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, []);
```

### 8. Aesthetic and minimalist design

**Principle:** Every extra unit of information competes with the relevant ones. Cut what doesn't earn its place.

**Code review question:** *What can be removed from this screen without reducing the user's ability to complete their task?*

This is the heuristic that pulls against #1 (visibility of status). The resolution: every element on a screen should be either *helping the primary task* or *visible because the user might need it next*. Everything else is noise.

Common offenders on dashboards:

- Six metrics at the top when the user only acts on one.
- A sidebar with 14 nav items, of which 11 are visited monthly at most.
- Three calls-to-action of equal visual weight.

The Linear vs typical-Jira contrast is the canonical example here. Both ship issue trackers. Linear's screens have one or two prominent actions; Jira's have eight. Both are functional. Only one feels usable.

### 9. Help users recognize, diagnose, and recover from errors

**Principle:** Error messages should explain what went wrong, in plain language, with a path to recovery.

**Code review question:** *When this error fires, can a user (a) tell what happened, (b) tell whether it was their fault, and (c) tell how to fix it?*

Bad: `Error: 422`. Slightly better: `Validation failed`. Good: `Email address is invalid — make sure there's no space before the @`. Best: same message, *and* the field is highlighted in red, *and* the cursor is moved to the field.

Three elements every error message should have:

1. **What happened**, in user terms.
2. **Why it happened**, if relevant (file too large, network down, server error).
3. **What to do next** — the action verb. "Try again", "Check your connection", "Contact support".

For unknown errors (truly unexpected), the script is: "Something went wrong on our end. We've been notified. Please try again, and if it persists, contact support." Plus a recovery action that actually works.

### 10. Help and documentation

**Principle:** Even great UIs sometimes need explanation. Make it easy to find.

**Code review question:** *Where would a confused user click for help on this screen, and would they get a useful answer?*

Two flavours of in-product help that pay rent:

- **Just-in-time tooltips.** A small `?` next to a confusing field that, on hover, explains in one sentence. Don't write paragraphs.
- **Empty-state guidance.** When a screen has no data, that's the moment to show how to add the first one. Notion and Linear both do this beautifully — the empty state of any view is half explanation, half call-to-action.

The bar for "help" isn't a 200-page docs site. It's: *can the user, on the screen they're stuck on, get unstuck without leaving the product?*

---

## The checklist version

Distil the ten into review questions you ask before merging any UI PR:

1. **Status:** does the user get feedback within 100ms of every action?
2. **Language:** are visible strings in user terms, not internal jargon?
3. **Exits:** can users undo or cancel mistakes?
4. **Consistency:** does this match patterns elsewhere in the product?
5. **Prevention:** could this error have been designed out?
6. **Recognition:** is required information visible, not memorized?
7. **Efficiency:** is there a shortcut for power users?
8. **Minimalism:** is every element earning its place?
9. **Errors:** do error messages explain what, why, and how to fix?
10. **Help:** can a confused user get unstuck without leaving?

Print it. Tape it to your monitor. Run every UI PR through it for a month. By month two, you'll be applying it instinctively.

> **Going deeper.** Nielsen Norman Group publishes a free version of these heuristics with examples on their site. For a more developer-focused treatment, the *Refactoring UI* book by Adam Wathan and Steve Schoger is the practical companion. Both reward re-reading every six months — the heuristics deepen the more interfaces you've shipped.

---

## What you should walk away with

- **Nielsen's 10 are checkable in code review.** Reframe them as questions, not aesthetics.
- **The framework is robust because it's general.** Specific UI rules age; principles like "tell users what's happening" don't.
- **Two heuristics consistently pull in opposite directions** — visibility (#1) vs minimalism (#8). The judgment call is the work.

The next chapter zooms out from individual screens to whole-product structure: information architecture, and how the way you organize URLs, navigation, and resources mirrors the way you'd design an API.

---

*Next up — Chapter 3: Information Architecture — From Sitemaps to API Design. Why the structure of your nav and the structure of your REST endpoints are the same problem in different clothing.*
