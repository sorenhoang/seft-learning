---
title: "What \"UX\" Actually Means When You Don't Have a Designer"
order: 1
tags: ["ux", "design", "frontend", "developer-experience"]
date: "2026-04-29"
draft: false
lang: "en"
---

Before we open a single Tailwind config or talk about heuristics, we need to settle a definition. **UX** has been stretched to mean almost anything by anyone with a slide deck — design polish, branding, user research, animation, the colour of a button. Most of those interpretations are unhelpful for a developer trying to ship a usable product on a Tuesday afternoon.

This chapter does three things. It cuts UX down to a definition you can actually act on. It separates the parts of UX a developer controls from the parts they don't. And it sets the boundary for what this series will and won't try to teach you.

---

## A working definition

The cleanest definition of UX I've found, attributed to Don Norman who coined the term in the early 1990s:

> User experience is the totality of how a person experiences a product or service.

That sounds frustratingly broad until you read it carefully. **Totality** is the operative word. It includes:

- The first time the user sees the product (marketing site, app store screenshot, a colleague's link)
- The moment they sign up (does it ask for a phone number it doesn't need?)
- The empty state on first login (do they know what to do?)
- The loading time of the first action (perceived performance, not just real performance)
- The error message when something goes wrong (do they understand what happened?)
- The recovery path (can they fix it without contacting support?)
- The polish of the interaction (does it feel handmade or generic?)

Crucially, **none of these are about how the interface looks.** Visual design is one input to UX. Typography matters because it affects readability, which affects whether people understand what's on the screen. But pretty ≠ usable, and most "ugly" enterprise software is bad UX because it's confusing, not because it's beige.

---

## The four levels of shipping

A useful frame I'll keep coming back to throughout the series. Every interface you ship sits at one of four levels:

| Level | Question it answers | Example failure mode |
|---|---|---|
| **1. Functional** | Does it work at all? | The button does nothing |
| **2. Reliable** | Does it always work? | The button works most of the time but errors silently sometimes |
| **3. Usable** | Can a new person figure it out? | The button works, but only the engineer who built it knows what it does |
| **4. Pleasurable** | Do users enjoy using it? | The button works, is understood, but the experience is friction-heavy |

Most engineering teams ship at level 2. Tests pass, errors are caught, the feature works. Level 3 is the gap where developers without UX training consistently lose ground — the feature works, but a user lands on the screen and doesn't know what to do, or what just happened, or how to recover.

**This series is mostly about getting reliably to level 3 and occasionally to level 4.** Level 4 — pleasure, delight, that "Linear feels different" quality — is where designers genuinely earn their keep, and we won't pretend a 2,500-line series can replace them. But level 3 is largely engineering discipline applied at the UI surface, and that's exactly the audience this is written for.

---

## What developers control vs what they don't

Be honest about the surface area. As an engineer shipping a UI:

**You control:**

- The information architecture (what's where, what nests under what)
- The hierarchy on every screen (what's most prominent, what's secondary)
- The typography and spacing system (whether you used Tailwind defaults or rolled your own)
- The colour palette and contrast (whether your gray text passes WCAG)
- The states of every component (what shows when there's no data, what shows while loading, what shows on error)
- The form behaviour (validation timing, error messages, focus management)
- The error recovery paths (does "try again" actually work, or does it loop?)
- The keyboard accessibility (can users navigate without a mouse?)

**You don't control (without a designer):**

- The brand identity, illustration style, mascot, photography
- High-effort animation choreography
- Bespoke iconography
- The kind of polish that comes from someone iterating on a prototype 40 times

Notice the asymmetry. The first list is mostly about *clarity, structure, and predictability* — engineering virtues. The second is mostly about *aesthetic identity* — design virtues. Developers can do excellent work on the first list with the same rigor they apply to backend code. They cannot fake the second list, and shouldn't try.

---

## What this series isn't

Setting expectations early avoids reader frustration in chapter 4.

- **Not graphic design.** We won't teach you to draw, illustrate, or pick a brand colour from scratch.
- **Not user research.** Interviews, surveys, usability testing, analytics — important, separate skill, separate series.
- **Not Figma or design tooling.** You don't need to learn a designer's IDE to ship better UI.
- **Not animation.** Micro-interactions get a section in chapter 7, but motion design as a discipline is out of scope.
- **Not a component library tour.** The principles transfer; the specific Tailwind / Radix / shadcn details are well-documented elsewhere.
- **Not advocacy.** I'm not going to argue you "should care more about users" — if you've got this far, you do. The chapters assume you want to ship better UI; they show you the leverage points.

---

## What this series *is*

Eight chapters, in three parts:

| Part | Chapters | What you walk away with |
|---|---|---|
| **Foundations** | 1, 2 | A definition you can act on, plus Nielsen's 10 heuristics as a code review checklist |
| **Structure and Visual** | 3, 4, 5, 6 | IA, hierarchy, typography, and accessible colour systems — applied to real code |
| **Interaction** | 7, 8 | Forms and the states everyone forgets — with complete React + Tailwind implementations |

Examples throughout reference products you've used: **Linear** for polish, **Stripe** for forms and dashboards, **Notion** for empty states, **GitHub** for hierarchy, **Vercel** for typography. When something is "Linear-quality" or "Stripe-quality" I'll show you the specific decisions that got them there.

The running stack is **React + Tailwind**. Concepts transfer to Vue, Svelte, or vanilla — I'll note where; I won't write the code three times.

---

## Prerequisites

To get the most from the chapters that have code:

- You can write a React component.
- You've used Tailwind, or can read its utility classes (`text-base font-semibold text-gray-700` should not feel cryptic).
- You've shipped at least one piece of UI someone else used. The series makes more sense with battle scars.

If you've never shipped UI before, you can still read this — the principles stand alone — but the "this is how you do it in code" sections will feel abstract.

---

## What you should walk away from chapter 1 with

Three ideas to carry forward:

1. **UX is the totality of the experience, not the visual layer.** Pretty isn't usable; ugly isn't unusable.
2. **Most teams ship at level 2 (reliable) and assume that's level 3 (usable).** This series is the practice of closing that gap.
3. **Developers control more of UX than they think.** Information architecture, hierarchy, typography, colour, states, errors — all engineering surface area.

The next chapter introduces the single most useful UX framework I've encountered for working engineers: Jakob Nielsen's 10 usability heuristics, reframed as questions you ask during code review.

---

*Next up — Chapter 2: Nielsen's 10 Heuristics as a Code Review Lens. The framework that turns "looks fine to me" into a checklist with ten specific questions.*
