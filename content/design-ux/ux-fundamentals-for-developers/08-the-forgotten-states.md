---
title: "The Forgotten States — Empty, Loading, Error"
order: 8
tags: ["ux", "states", "empty-state", "loading", "error-handling", "react"]
date: "2026-04-29"
draft: false
lang: "en"
---

Every screen in your product has at least four states. Most apps design one of them, hope for the best on the second, and ignore the other two. The result: a UI that's perfect in the demo and broken in real use, because real use includes new users (empty), slow networks (loading), and unreliable infrastructure (error).

This final chapter is about the four states every data-driven screen actually has — empty, loading, populated, and error — with most of the focus on the three developers consistently underbuild. We'll close with a "before you ship" checklist that ties together everything from chapters 1–7.

---

## The four states every screen has

Take any screen that displays data — a list, a table, a card, a feed. It has at least these states:

1. **Empty (or initial)** — no data exists yet. New users land here. The empty state is the first impression of the feature.
2. **Loading** — data is being fetched. Could last 100ms, could last 8 seconds.
3. **Populated** — the happy path. Data loaded, everything works.
4. **Error** — the request failed, the data is corrupt, the server is down.

Plus these less-obvious states:

5. **Partial** — some data loaded, some failed (a list with some broken items)
6. **Refreshing** — populated, but in the middle of a re-fetch
7. **Optimistic** — showing a result before the server confirms (delete with undo, optimistic add)

Most products design state 3 carefully and treat the rest as edge cases. **The premium feel of Linear, Notion, and Stripe comes mostly from designing all of these.** It's the work that takes "this works" to "this is well-made."

---

## Empty states — the missed opportunity

The default empty state is "show nothing" or, slightly better, "show a generic message: No data."

This wastes the most valuable real estate in the feature. **The empty state is an opportunity to teach.** A user landing on an empty Tasks screen should learn:

- What this screen will eventually contain.
- How to add the first item.
- Why they would want to.

Three flavours of empty state, in increasing levels of polish:

### 1. The placeholder

Plain message saying "No data." Better than nothing. Worse than anything else. Use only as a fallback.

### 2. The instructive empty state

Explains what the feature is and shows a clear call to action.

```tsx
function EmptyTaskList() {
  return (
    <div className="text-center py-16 px-6">
      <ClipboardIcon className="w-12 h-12 mx-auto text-gray-400" />
      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        No tasks yet
      </h3>
      <p className="mt-2 text-sm text-gray-600 max-w-prose mx-auto">
        Tasks help you break work into actionable steps. Add your first one
        to see it appear here.
      </p>
      <button className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-md font-medium">
        Create your first task
      </button>
    </div>
  );
}
```

This is the pattern most products should ship as their default.

### 3. The illustrated, contextual empty state

The third flavour — and the one Linear, Notion, and Stripe consistently nail — adds an illustration or relevant pre-filled example. Linear's "no issues" state shows a peaceful illustration plus a "Create issue" CTA *and* keyboard shortcut hint. Notion's empty pages suggest templates. Stripe's empty Customers list shows you what an example customer would look like.

This level of polish requires a designer or stock illustrations, but the principle — **make the empty state useful, not invisible** — is achievable without one.

### Empty states for filters and search

A subtype that gets neglected: **the empty result of a filter or search**. Different empty state, different message:

```tsx
{results.length === 0 && hasActiveFilters && (
  <div className="text-center py-12">
    <p className="text-gray-700 font-medium">No tasks match these filters.</p>
    <p className="text-sm text-gray-500 mt-1">
      Try clearing some filters or expanding your date range.
    </p>
    <button className="mt-4 text-sm text-blue-600 hover:underline">
      Clear filters
    </button>
  </div>
)}
```

The "no results from filter" state is *different* from the "feature not used yet" state. The former needs a "clear filters" action; the latter needs a "create something" action. Don't conflate them.

---

## Loading states — when to use what

The most-asked question: **spinner or skeleton?**

The answer depends on duration:

- **Under 100ms** — show nothing. The eye doesn't perceive it; flashing a loader makes things feel slower.
- **100–500ms** — a spinner is fine. Compact, low-cost, signals "wait briefly."
- **500ms–3s** — a skeleton is better. Skeletons let the user see the layout that's coming, which feels faster even if the actual time is the same.
- **3+ seconds** — skeleton + progress signal (text like "This is taking longer than usual…" after 5s).
- **Truly long (10s+)** — switch to a different pattern: poll-and-notify, async with email-on-completion, etc. Don't make users wait on a spinner for that long.

### Spinners — minimal and inline

```tsx
function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin ${className}`}
    />
  );
}
```

Place it where the action happened — inside the button that was clicked, next to the "Loading…" text, in the data area being fetched. **Centered full-page spinners are usually wrong** — they communicate "the app is hung" more than "this section is loading."

### Skeletons — match the real layout

A skeleton's job is to match the size and shape of the real content. The closer the match, the less perceived layout shift when content arrives.

```tsx
function TaskListSkeleton() {
  return (
    <ul className="space-y-3" aria-busy="true" aria-label="Loading tasks">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 p-3 border rounded-md">
          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  );
}
```

Real-world: GitHub uses skeletons throughout. Linear uses them on slow operations like initial workspace load. Vercel uses them on dashboard panels. The pattern is well-established.

### The hidden cost: layout shift

A frequent skeleton bug: the skeleton has slightly different dimensions from the real content, so when the content loads, the screen jumps. **Fix this by matching the real layout exactly** — same padding, same height, same flex/grid behavior. The cost of a 1-line height mismatch is a janky-feeling app.

---

## Error states — the recovery imperative

Error states have to do three things:

1. **Tell the user what happened**, in plain language.
2. **Give the user a path to recover.**
3. **Preserve the user's context** — don't kick them back to a blank page.

The default React behaviour — uncaught errors → blank white screen — is a UX failure. Use error boundaries to catch them and show a meaningful state.

### Inline error states for failed sections

If one panel of a dashboard fails, the rest of the dashboard should still work. Error states should be scoped, not global.

```tsx
function TaskList({ data, error, onRetry }: Props) {
  if (error) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-800 font-medium">
          Couldn't load tasks
        </p>
        <p className="text-sm text-red-700 mt-1">
          {error.message ?? "Something went wrong on our end."}
        </p>
        <button
          onClick={onRetry}
          className="mt-3 text-sm font-medium text-red-800 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }
  // …happy path…
}
```

### Error boundaries for unhandled exceptions

```tsx
class FeatureErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to your error monitoring service
    reportError(error, info);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// Usage: scope to a feature, not the whole app
<FeatureErrorBoundary fallback={<TaskListErrorFallback />}>
  <TaskList />
</FeatureErrorBoundary>
```

The fallback should be informative, not just "Something went wrong." Tell the user what they were trying to do, give them a recovery action, and (in a serious app) an error reference ID they can share with support.

### Network errors are not the same as bugs

Distinguish in the UI:

- **Network/server errors** → "We couldn't reach our server. Check your connection and try again."
- **Validation errors** → "Email is required." (handled inline, not as an error state)
- **Permission errors** → "You don't have access to this. Contact your admin." (with a link)
- **Unknown errors** → "Something went wrong. We've been notified. Try again, and if it persists, contact support with reference #xyz."

Generic error states are easier to ship, but they conflate problems users *can* fix with problems they can't. Specific error states convert frustration into action.

---

## Optimistic UI — when to use it

For actions where success is overwhelmingly the common case (delete, like, mark-as-read), **optimistic UI** updates the screen immediately and rolls back on the rare failure.

```tsx
async function handleDelete(id: string) {
  // 1. Optimistic update
  removeFromList(id);

  // 2. Show undo affordance
  const undoToken = toast.success("Task deleted", {
    action: { label: "Undo", onClick: () => restore(id) },
    duration: 5000,
  });

  // 3. Send to server
  try {
    await deleteOnServer(id);
  } catch (err) {
    // 4. Roll back on failure
    addBackToList(id);
    toast.error("Couldn't delete task. Try again?");
    toast.dismiss(undoToken);
  }
}
```

The pattern: change the UI before the server confirms, give the user a clear undo, roll back gracefully on failure. Linear uses this for almost every action; it's most of why the product feels so fast.

Don't use optimistic UI for:

- Money-related operations (payments, transfers — users want certainty)
- Permanent deletions (use soft-delete + undo instead)
- Operations where failure modes are common (network upload of large files)

---

## A complete state-aware data hook

Putting it together — a React pattern that handles all four primary states:

```tsx
type State<T> =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; data: T[] }
  | { status: "error"; error: Error };

function useTasks(): State<Task> {
  const [state, setState] = useState<State<Task>>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    fetchTasks()
      .then((data) => {
        if (cancelled) return;
        setState(data.length === 0 ? { status: "empty" } : { status: "ready", data });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ status: "error", error: err });
      });

    return () => { cancelled = true; };
  }, []);

  return state;
}

function TaskScreen() {
  const state = useTasks();
  switch (state.status) {
    case "loading": return <TaskListSkeleton />;
    case "empty":   return <EmptyTaskList />;
    case "error":   return <TaskListError error={state.error} />;
    case "ready":   return <TaskList tasks={state.data} />;
  }
}
```

The discriminated union forces you to handle every state. TypeScript will fail the build if you forget one. **Use this pattern as the default for any data-fetching screen** — it makes "did we handle the empty state?" a compile-time check instead of a code-review concern.

In real projects, libraries like **TanStack Query** or **SWR** give you this for free with `data`, `isLoading`, `isError`, `error` — the principle is identical.

---

## Real-world studies

Three apps to open and explore for state-handling:

- **Linear.** The empty-state and optimistic-UI gold standard. Click around, do destructive things, observe.
- **Notion.** Excellent skeleton loading on long pages and tables. Empty states are illustrative and helpful.
- **Stripe Dashboard.** Production-grade error handling — partial-failure states, network errors, permission errors all distinct.

> **Going deeper.** This is the area of UX where developers can match designers most closely, because it's mostly engineering discipline. Designers don't generally specify error message wording, retry behavior, or when to show a skeleton vs a spinner. **These are engineering decisions, and treating them as such — building reusable state-handling primitives, naming the four states explicitly, requiring all four in code review** — is one of the highest-impact things an engineering team can do for product polish.

---

## The "before you ship a screen" checklist

The capstone checklist of the series. Every screen, every PR, run it through:

1. **Empty state designed.** Not just "no data" — explains the feature, offers a path forward.
2. **Filter/search empty state distinct from feature empty state.**
3. **Loading state matches the duration:** spinner if <500ms, skeleton if >500ms.
4. **Skeletons match the real layout dimensions** — no visible layout shift on load.
5. **Error states are scoped** — feature errors don't blank the whole page.
6. **Errors tell user what happened and how to recover.** Generic "something went wrong" only as last resort.
7. **Error boundaries scope unhandled exceptions** to the feature level.
8. **Optimistic UI used where appropriate** (with undo) — not used for money or permanent destruction.
9. **Discriminated union or equivalent forces all states to be handled** at the type level.
10. **Re-run all the earlier-chapter checklists** — heuristics, hierarchy, typography, color, forms.

---

## What you should walk away with

- **Every screen has at least four states. Most apps design one and ship the rest broken.**
- **Empty states are the highest-leverage UX investment for new users.** Make them teach.
- **Spinner vs skeleton is a duration question, not a stylistic one** — under 500ms spinner, over 500ms skeleton.
- **Errors must be scoped, recoverable, and specific** — generic error pages are an admission of giving up on UX at the boundary.
- **Discriminated unions / state machines force exhaustive state handling** at the type level, which is where this category of bug should be caught.

---

## Closing the series

That's the full path through UX fundamentals for developers — eight chapters, eight checklists, one reframing of design as an engineering discipline you can practice deliberately. The series intentionally didn't cover everything; specifically:

- **User research and analytics** — separate skill, separate series.
- **Animation and motion design** — micro-interactions touched in chapter 7, but full motion design is its own discipline.
- **Visual identity and branding** — the part where designers genuinely can't be replaced.

What you have, after reading all eight, is a working framework: definitions you can act on (chapter 1), a usability lens for code review (chapter 2), the structure-design layer (chapter 3), and four chapters of applied detail (4–7) culminating in the discipline of states (chapter 8).

Read once for the patterns. Re-read in six months when you've shipped enough UI to feel which chapter applies to your current PR. UX, like backend engineering, compounds with practice — one well-built form teaches more than ten read articles, and one screen with all four states designed teaches the difference between intentional and accidental shipping.

The rest is reps.

---

*Thanks for reading the series. If something here changed how you'd ship the next UI you build, that's the whole point. Go ship it well.*
