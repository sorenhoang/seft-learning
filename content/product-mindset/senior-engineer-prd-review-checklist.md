---
title: "The Senior Engineer's PRD Review Checklist"
description: "Eight questions that expose gaps before you write a line of code — a practical checklist for engineers who want to review PRDs like a senior, not rubber-stamp them."
tags: ["product-mindset", "prd", "senior-engineers", "requirements", "product-thinking", "collaboration"]
date: "2026-04-22"
draft: false
---

## The Two Ways to Read a PRD

There is the way most engineers read PRDs: looking for enough information to start the implementation. Once they find it, they start.

There is the second way: reading for what is missing — the assumptions that have not been tested, the edge cases that will surface in week three, the success criteria that will not actually measure success. This is the senior engineer's read.

The second way takes about 20 minutes longer per PRD. It saves weeks per feature. The checklist below is how to do it systematically.

---

## The Checklist

### 1. Is the user problem clearly stated — and is it the right problem?

A PRD should begin with the problem, not the solution. Look for a statement like: "Users who do X cannot accomplish Y because of Z, leading to [observable behavior or measurable cost]."

If the PRD opens with a feature description instead, the problem has not been agreed on. The feature is already locked in before the problem is understood.

**What to ask:** "What user behavior or metric are we trying to change, and how do we know this is the right lever?"

### 2. Who is the exact target user?

"Users" is not a segment. "Enterprise customers with more than 50 seats" is a segment. "First-time users who have not completed onboarding" is a segment.

A PRD that does not specify the user segment will produce a feature optimized for nobody in particular. The technical implementation often follows suit — generic edge case handling instead of purposeful choices.

**What to ask:** "Which specific user persona or segment is this designed for, and what does their current workflow look like without this feature?"

### 3. What are the success metrics — and can they be measured?

Every PRD should define what "working" looks like, in numbers. Not "improve user satisfaction" — that is not measurable. "Increase activation rate for new users from 43% to 55% within 60 days of signup" is measurable.

Watch out for:
- Vanity metrics ("increase feature usage" without defining baseline or target)
- Metrics that cannot be attributed (if three teams ship simultaneously, you cannot isolate the cause)
- Metrics that measure output, not outcome ("we shipped it" vs. "users succeeded")

**What to ask:** "If this ships and nothing changes in our metrics, how would we know? What is the specific number we are trying to move?"

### 4. What are the edge cases — and which ones is the PRD explicitly ignoring?

A good PRD scopes the feature by explicitly calling out what is *out of scope*. A PRD with no out-of-scope section has usually just not thought about edge cases yet.

Engineers discover edge cases during implementation. The question is whether those discoveries become blockers, quiet technical decisions, or known deferments.

**What to ask:** "What happens when a user does [the three most obvious unusual things]? Are these handled, deferred, or ignored — and do we agree on which?"

### 5. How does this interact with existing features?

New features rarely exist in isolation. They touch permissions, search, notifications, analytics, the API surface, the mobile app, billing, and half a dozen other systems.

A PRD that does not call out these integration points is either assuming they are trivial (sometimes right, often wrong) or has not thought through them yet.

**What to ask:** "Which existing features, APIs, or data models does this touch? Are the expected behaviors across those systems defined?"

### 6. What is the rollout plan — and what is the rollback plan?

"We will ship it to everyone" is not a rollout plan. "We will ship to 5% of users for two weeks, watch [specific metrics], then ramp or revert" is a rollout plan.

The rollback plan is just as important. If this ships and the metric moves the wrong way, what is the path back? If the answer is "we would have to undo a database migration," that is a risk that should be in the PRD.

**What to ask:** "What is the release strategy? If we need to revert within two weeks, what does that cost?"

### 7. What are we *not* building — and does the PM know that?

Engineers often have the clearest picture of what scope creep looks like from the inside. A small "while we are in there" addition can double the implementation complexity.

Reading a PRD for implicit assumptions is valuable: "The PRD says users can filter by date — does that mean a date range picker UI, server-side filtering, indexed queries, timezone handling, and export support? Or literally just a filter?"

**What to ask:** "To implement this exactly as written, what is the minimal scope? Is that what we intend to ship?"

### 8. Are there unstated assumptions that, if wrong, break the entire feature?

Every PRD rests on assumptions. The ones that do not get written down are the dangerous ones.

Classic examples:
- "Users will understand the interface without onboarding" — often wrong
- "This will be used primarily on desktop" — often wrong for mobile-first markets
- "Latency under 300ms is sufficient" — often wrong for specific user actions
- "The underlying data will always be consistent" — often wrong in distributed systems

**What to ask:** "What has to be true about users, their data, and the system for this feature to work as designed?"

---

## How to Raise Gaps Without Blocking the Team

Found gaps? Good. Now raise them without being the engineer who slows everything down.

The frame matters:

- **Bad:** "This PRD is incomplete, I cannot start."
- **Good:** "I have three questions before I can give a confident estimate — got 15 minutes?"

- **Bad:** "You have not defined success metrics."
- **Good:** "I want to make sure I build the right thing. What number should we be watching after this ships?"

- **Bad:** "This will never work because of edge case X."
- **Good:** "Edge case X is not in scope — I want to confirm we are treating it as out-of-scope rather than handled, so we can communicate that to users."

The goal is to be the engineer who makes the PRD better, not the one who interrogates it.

---

## When to Use This Checklist

Not every PRD warrants a full review. Use judgment:

- **Use it** for anything with significant user-facing impact, a meaningful engineering investment, or high reversibility cost.
- **Skim it** for well-understood work, bug fixes with clear scope, or features the team has shipped before.
- **Skip it** for internal tooling, infrastructure work, or anything that is genuinely just "implement the spec as written."

The checklist is a tool for thinking, not a process tax. Use it when the investment is worth the scrutiny.

---

## The Outcome of Good PRD Review

A team that reviews PRDs this way before starting implementation tends to:
- Ship fewer features that require immediate re-builds
- Have shorter sprint reviews (less "we forgot this case")
- Build faster on average, because fewer late-stage discoveries block progress
- Earn more trust from PMs, who learn that engineers catch things they missed

That trust compounds. PMs bring engineers into discovery earlier. Engineers learn more about user problems. The gap between "what we built" and "what users needed" narrows.

It starts with 20 minutes and eight questions.
