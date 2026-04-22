---
title: "I Was Wrong: Product Mindset Is Not Just the PM's Job"
description: "For years I assumed product thinking was someone else's job. Here's what changed my mind — and what engineers lose when they keep delegating that responsibility to their PM."
tags: ["product-mindset", "engineering-culture", "senior-engineers", "career-growth", "product-thinking"]
date: "2026-04-22"
draft: false
---

## The Comfortable Misconception

For most of my early career as an engineer, I had a clear mental model: the PM figures out *what* to build, and I figure out *how* to build it. Clean separation of concerns. Let everyone operate in their domain of expertise.

It felt rational. It felt professional. It was wrong.

The misconception didn't shatter all at once. It eroded through a series of specific moments — a feature that shipped perfectly and went unused, a refactor that was technically excellent but made the product slower to evolve, a quarter where my team had 90% velocity and 10% impact. None of those outcomes required bad code. They required better thinking about *why* the code existed.

## What "Product Mindset" Actually Means for Engineers

Product mindset is not a personality trait reserved for PMs. It is a cognitive habit: asking *why this, why now, for whom* — before committing to *how*.

For an engineer, it shows up in small, daily moments:

- Reading a ticket and asking "what user problem does this solve?" before estimating
- Noticing that an acceptance criterion doesn't match the stated goal
- Flagging that the proposed solution will work for 80% of users but break for the 20% the company cares most about
- Wondering whether the feature needs to exist at all, or whether fixing something else would be higher leverage

None of these require a PM's job title. They require a slight shift in what you pay attention to.

## The Cost of Outsourcing Product Thinking

When engineers treat product thinking as "not their job," several failure modes follow:

**Spec execution without signal.** Engineers implement exactly what's specified, ship it, and wait for someone else to notice it's not working. The feedback loop is: PM receives user data → PM revises spec → engineers re-implement. Every cycle is weeks lost.

**Missing the obvious flaw.** Engineers who stay close to implementation often see risks PMs can't — edge cases, performance cliffs, second-order effects. If the mental contract is "I implement, you think," those observations stay unvoiced. The flaw ships.

**Low ownership, low initiative.** Engineers who don't think about user outcomes don't step up when the product direction is wrong. They wait for permission. Waiting for permission is the fast path to being irrelevant.

**Career ceiling.** Almost every engineering ladder above senior explicitly rewards product impact — scope definition, outcome ownership, cross-functional influence. Engineers who opt out of product thinking are opting out of the criteria that drive promotions.

## The Specific Places Where Engineers' Input Is Irreplaceable

The argument isn't "engineers should also be PMs." The argument is more specific: there are product decisions where engineering insight is *structurally necessary*, and a PM cannot supply it no matter how good they are.

**Feasibility that changes the frame.** A PM scopes a feature for a quarter. An engineer with codebase context says, "We already built 70% of this for an internal tool six months ago. This is two weeks, not twelve." That insight changes the roadmap. The PM didn't have it. The estimate didn't surface it. Only an engaged engineer who was thinking about the *product problem* would connect those dots.

**Performance and reliability as user experience.** A PM tracks feature adoption. An engineer tracks latency. These are the same thing from different angles — slow response times reduce adoption, but a metric dashboard showing p99 latency won't tell a PM that this is the reason users are churning. Engineers who think about user outcomes make that connection.

**Technical debt as product risk.** "We can't ship the onboarding flow improvement this quarter because the user session model needs to be refactored first" is a product statement, not just a technical one. Engineers who understand this frame it as business risk. Engineers who don't frame it as engineering preference — and lose the argument every time.

## The PM's Perspective You're Missing

Here's something most engineers don't consider: your PM wants you to engage with the product. They are not trying to protect their territory. They are overwhelmed.

A PM owns discovery, stakeholder alignment, roadmap prioritization, success metrics, release coordination, and a calendar full of meetings. They do not have unlimited cycles to pressure-test every assumption in the spec. When an engineer asks "what's the expected behavior when a user does X?" — that is product thinking. When an engineer says "this metric we're tracking won't detect whether users actually succeed at the task" — that is product thinking. Both are things the PM wanted but didn't have time to find themselves.

The engineers who PMs most want in the room are the ones who bring that second layer of scrutiny. Not to question authority or slow things down — to make the work land.

## Practical Starting Points

If this mindset shift is new, start small:

1. **Before picking up a ticket, read the linked problem statement** (if there is none, ask for one). One sentence on the user problem before touching the implementation.
2. **During sprint planning, ask one "why" per sprint.** Not aggressively — curiously. "What are we expecting to happen to [metric] after this ships?" is the question.
3. **After a feature ships, follow up.** Ask the PM what the data shows two weeks later. This closes the loop that makes product thinking feel real.
4. **When you spot a gap in a spec, name it, don't just work around it.** "I noticed the spec doesn't cover what happens when the user has no payment method on file — is the expected behavior X or Y?" costs two minutes. Re-implementing after it ships costs two weeks.

## What Changed My Mind

The specific moment: I was on-call when a feature I'd shipped three months earlier started generating support tickets. Users were confused by an error state I'd implemented exactly as specced. The spec said "show an error message." I showed an error message. Nobody had thought through what the user was supposed to *do* with that information.

That was my error as much as the PM's. I had read the spec, seen the gap, filed it mentally as "not my problem," and shipped. Product thinking would have been: pausing, naming the gap, proposing an alternative. Three minutes of product thinking would have saved three weeks of support load and a re-build.

Product mindset isn't the PM's job. It's not the PM's job alone. The sooner you stop waiting for permission to care, the better engineer you become.
