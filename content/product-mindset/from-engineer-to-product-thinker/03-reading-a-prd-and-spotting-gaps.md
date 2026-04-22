---
title: "Reading a PRD and Spotting Gaps Before You Code"
order: 3
tags: ["product-mindset", "prd", "spec-review", "engineering-craft"]
date: "2026-04-22"
draft: false
---

Most of the waste in engineering organizations happens before the first commit. A team takes a PRD, scopes it, estimates it, builds it, ships it — and discovers at launch that the success metric was vague, the edge cases were invisible, the migration was impossible, or the feature solved a problem nobody had. All of that could have been caught in a careful read of the PRD. Almost none of it gets caught, because most engineers read PRDs the way they read restaurant menus: passively, and only for what's on offer.

This chapter is about reading PRDs the way senior engineers do it — actively, with a checklist, and with the explicit intent to find gaps before writing a line of code.

## What a PRD Actually Is

Product Requirements Document. The format varies dramatically by company:

- **Amazon** uses a 6-page narrative memo, read silently for the first 20 to 30 minutes of the meeting. Bezos banned slides in 2004 for important decisions; the memo exists because bullets let you get away with fuzzy thinking that prose won't.
- **Google** typically splits responsibility — a 1-pager for the product proposal, a separate design doc for the technical approach.
- **Stripe and similar engineering-heavy shops** use RFC-style documents that blur product and technical concerns into one artifact.
- **Startups with Linear or Jira** often don't have a formal PRD at all — just the issue body with a title, three bullets, and a Figma link.
- **Basecamp's Shape Up methodology** replaces the PRD entirely with a "pitch": Problem / Appetite / Solution / Rabbit holes / No-gos.

None of these shapes is inherently better. The only question that matters is whether the document answers the things an engineer needs to know before scoping.

## The Canonical Sections

When a PRD is well-structured, it contains most or all of the following:

- **Problem statement.** What user problem are we solving?
- **Target user.** Specific segment, not "our customers."
- **Goals and non-goals.** What we're doing and explicitly what we're not.
- **Success metrics.** Quantitative, with a measurement plan.
- **User stories or JTBD.** The behavioral shape of the work.
- **Design mocks or wireframes.** What the user will see.
- **Constraints.** Technical, legal, privacy, budget, timeline.
- **Out-of-scope.** What we are explicitly deferring.
- **Open questions.** Things still unresolved.
- **Dependencies.** Other teams, services, vendors we need.
- **Rollout plan.** Launch mechanics, canary strategy, feature-flag plan.
- **Risks and mitigations.** What could go wrong.
- **Version history.** Who changed what and when.

Most PRDs have about half of these. The other half are the gaps you'll be spotting.

## The Gap-Spotting Checklist

Read every PRD against this list. Any unanswered question is a risk that compounds into wasted engineering.

**Who's the specific user?** Not "our customers." Which segment, in which workflow, in what state? A PRD that says "users want this" without naming the user is almost always hiding confusion about who it's actually for.

**What does success look like quantitatively?** If we ship this, what number moves, by how much, measured how, on what dashboard, by when? "Improve engagement" is not a metric. "30% increase in weekly active users in the new feature area, measured in Amplitude, within six weeks of launch" is a metric. The difference is whether you'll be able to tell if it worked.

**What happens if we don't build this?** The counterfactual cost. If nobody can answer this, the priority of the work is soft — which means it will get bumped when something more urgent shows up, and all your scoping effort was wasted.

**What's explicitly out of scope — and what's missing from that list?** Read the "not doing" list carefully. Is the obvious adjacent feature named? If not, *is it implicitly in scope, or is the PM pretending it doesn't exist?* The worst scope surprises come from features everyone assumed but no one wrote down.

**What are the error and edge cases?** PRDs almost always skip these by default. Empty state, error state, offline behavior, concurrent edits, permissions violations, rate limits, internationalization, accessibility, very large or very small inputs. For each, ask: what happens? If the answer is "we'll figure it out," you haven't scoped anything yet.

**What's the migration and rollback story for existing users?** If there are users on the old behavior, are they migrated, grandfathered, or simply broken? Is there a kill switch? PRDs for new features often completely ignore the existing state.

**Which dependencies are real vs. "we'll figure it out"?** "We need to integrate with Team X" is a dependency. Has Team X *agreed*? Is it on their roadmap? Is there a shared doc? Or is this wishful thinking that won't survive the first sprint?

**What's the launch plan and who decides when to ship?** Go/no-go criteria should be named before scoping, not after. Who owns the call? What are the gates? Without this, the rollout will be chaotic because the "we'll see when we get there" decision gets made under pressure.

## PRD Anti-Patterns to Recognize

A short taxonomy of PRDs that will cause problems, regardless of how long they are:

**Solution-first PRDs.** The document describes a feature at length without clearly naming the user problem. A simple test: if you delete the solution section, does the problem still read as a coherent problem? If not, the PRD is a solution in search of a problem.

**Vague success metrics.** "Improve engagement," "enhance the user experience," "better retention." These are directions, not metrics. Without a specific number, the team can declare victory at launch regardless of outcome.

**Missing non-goals.** If the PRD doesn't say what's explicitly out of scope, the scope will expand every time someone walks by the Jira ticket with a new idea.

**"We need to move fast" as strategy.** Speed is a constraint, not a strategy. A PRD that leads with urgency is usually masking lack of thinking about everything else.

**PRDs with no version history.** The doc has been quietly rewritten and nobody knows what the current version says or who changed it. You estimate one version; you build against another.

**Design-doc-in-PRD-clothing.** 80% of the document is visual mockups, 5% is problem framing. Pretty, and probably wrong about what to build.

## The Engineer's Second Draft

The most valuable single move a senior engineer can make in the PRD review process is what I'll call the **second draft**. Instead of leaving comments on the PM's document, copy the PRD into your own doc and annotate inline with four tags:

- `[FEASIBILITY]` — what's easier or harder than the PM assumed.
- `[EDGE CASE]` — scenarios not addressed.
- `[ALT APPROACH]` — alternative technical paths that serve the same job.
- `[QUESTION]` — things unresolved.

Return the annotated doc within 48 hours, *before* the spec is frozen. Open with something like: *"I read through the PRD — here's what I'd want to lock down before scoping. Three things I'd consider alternatives on, and four questions."*

What this does organizationally: it shifts the relationship from "PM writes spec, engineer receives spec" to "PM and engineer jointly shape the spec." Marty Cagan (SVPG) calls this the difference between a **feature team** and an **empowered product team**. Engineers who make this move consistently become the PM's favorite engineers — not because they're more compliant, but because they reduce the PM's risk of shipping a spec that fails after launch.

## Templates Worth Knowing

If your company doesn't have a PRD template, or the one it has is bad, point to one of these:

- **Lenny Rachitsky's PRD examples.** Lenny publishes a widely-used 1-pager template with problem-first framing and explicit success metrics.
- **Shape Up's pitch format** (Singer, 2019, free at basecamp.com/shapeup). Problem / Appetite / Solution / Rabbit holes / No-gos. Compressed and disciplined.
- **Amazon's 6-pager narrative.** Prose, not bullets, no slides. Available via Bezos's shareholder letters and Brad Porter's writings on narrative memos.

The common thread: problem-first, explicit non-goals, named edge cases, measurable success. Length is not a virtue. Clarity is.

## What a Good PRD Looks Like

A short list of properties that distinguish a PRD you can scope against from one you can't:

- Starts with the problem, not the solution.
- Names a specific user and a specific moment.
- States success as a number with a measurement plan.
- Has an explicit non-goals section.
- Lists at least three edge cases.
- Identifies concrete dependencies with named owners.
- Is dated, versioned, and has an author.
- Is readable in under 20 minutes.

A PRD that hits all of these is rare. A PRD that hits most of them is excellent. A PRD that hits fewer than half is a PRD you're about to scope poorly unless you make the gaps visible first.

## The Weekly Habit

Pick the next PRD that lands in your inbox. Before reading it with intent to estimate, read it with intent to find gaps. Use the checklist. Write the second draft. Return it within 48 hours.

Do this consistently for a quarter. The dynamic around you will change. PMs will start routing early drafts to you for review before the PRD is "finished." Your tech lead will notice. Your estimates will improve because you'll be estimating against clearer specs. Features will ship closer to what users actually wanted, because you caught the gaps when they were cheap to fix.

This is probably the single highest-leverage habit in this entire series. It's also the one most engineers skip, because it feels like overstepping. It's not. It's what the job actually is at this level.

---
*Next in the series: the "why" question — how to ask it in product meetings without being labeled the obstacle, using framings that earn permission to question instead of burning it.*
