---
title: "Working with Difficult People: 3 Case Studies"
description: "Three realistic scenarios engineers face — the brilliant jerk, the credit taker, and the code review gatekeeper — with specific strategies for each."
tags: ["soft-skills", "teamwork", "communication", "career-growth"]
date: "2026-04-19"
draft: false
---

Difficult people are rarely acting from malice. They are usually acting from insecurity, fear, or misaligned incentives. Understanding the motivation changes your strategy from confrontation to redirection.

The framework for all three cases: **adapt** (set boundaries, adjust your approach), **escalate** (bring documented evidence to leadership), or **leave** (when the environment tolerates the behavior and staying costs you growth or wellbeing). Most engineers stay in "adapt" too long.

---

## Case 1: The Brilliant Jerk

**The scenario.** Marcus drops "Did you even read the RFC?" in code review comments. He responds to design proposals with "This is fundamentally wrong" without offering alternatives. In architecture meetings, he sighs audibly when junior engineers ask questions. His code is genuinely excellent. Two people have quietly transferred off the team in six months.

**Why he behaves this way.** His identity is built entirely on being the smartest person in the room. Challenging his approach feels existential. Netflix's Reed Hastings put it simply: "Do not tolerate brilliant jerks. The cost to teamwork is too high." A 10x developer who makes two juniors afraid to contribute is a net negative.

**What most people do wrong.** They either avoid him entirely (letting him dominate decisions unchecked) or confront him emotionally in the moment — which he dismantles with logic, making them look irrational.

**What works.**

- **Separate the technical feedback from the delivery.** In private: "Your point about the schema was correct. The way you delivered it caused two junior engineers to tell me they're afraid to contribute. That's a team velocity problem."
- **Never challenge in public.** His ego will double down. Use specific behavior, not labels: "When you said X in the meeting" — not "You're intimidating people."
- **Reduce single-point-of-failure status.** Pair on critical systems, rotate code ownership, normalize knowledge-sharing. This reduces his leverage without making it obvious.

---

## Case 2: The Credit Taker

**The scenario.** Priya volunteers to "present the team's work" at sprint reviews. Her language gradually shifts from "we" to "I." She schedules 1:1s with leadership that other team members do not know about. When a project succeeds, her name is attached. When it fails, "the team" missed the deadline. She got promoted ahead of more skilled engineers.

**Why she behaves this way.** She is often deeply insecure about her actual technical contribution and compensates through narrative control. But there is a structural angle too: in many companies, promotion committees see demo presentations and Slack announcements, not git blame. She has correctly identified that the reward system values visibility over substance.

**What most people do wrong.** Engineers believe "the work speaks for itself" and refuse to self-promote. When someone takes credit, the instinctive reaction is to accuse — which makes *you* look petty and political.

**What works.**

- **Pre-attribute through documentation.** Before sharing an idea verbally, send a Slack message or email outlining the problem and your proposed approach. This creates a timestamp.
- **The redirect technique.** When it happens live: "I'm glad you're building on the approach I outlined in my RFC last Tuesday. Let me add context on the implementation details." This reclaims credit without confrontation.
- **Build a pattern log.** Date, your original documentation, who took credit, the forum. After 3+ instances, this becomes a skip-level conversation with evidence, not emotion.

---

## Case 3: The Gatekeeper

**The scenario.** David has 14 comments on a 30-line PR, half of which are style preferences — "I would have used reduce here instead of forEach." He marks PRs as "Request Changes" for things with no functional impact. Average review turnaround: 4 days. He once blocked a hotfix during a production incident because "the error message could be more descriptive." When asked, he says "I just care about code quality."

**Why he behaves this way.** Leaving a blocking review feels like single-handedly protecting the codebase. It is also a way to demonstrate technical knowledge over a less-experienced engineer. His identity is tied to being the quality guardian. Perfectionism research shows it is often about earning approval — perfectionists internalized that "I am what I accomplish."

Google's code review standard provides the antidote: "Reviewers should favor approving a change once it definitely improves overall code health, even if it isn't perfect. There is no such thing as perfect code — there is only better code."

**What most people do wrong.** They either submit to every nitpick (wasting days on style preferences) or go around him (requesting other reviewers, which creates political drama).

**What works.**

- **Classify feedback.** Separate genuine quality concerns from style preferences. Push back on style: "This is consistent with how we handle this pattern in [other file]. I'd like to keep it unless there's a correctness concern."
- **Invoke the standard.** "Our review SLA is 24 hours. This PR has been open for 3 days. Can we sync to unblock it?" A written standard removes the personal element.
- **Have the direct conversation.** "I've noticed my PRs go through more rounds than others on the team. Can we pair on one so I understand your bar better?" This reframes conflict as collaboration.
- **Propose structural fixes.** Review rotations, PR size limits, comment prefixes (nit / suggestion / blocker), and review time SLAs. These constrain gatekeeping without personal confrontation.

---

## The Pattern Across All Three

1. **Insecurity, not malice.** The jerk's identity depends on being smartest. The credit taker fears being seen as inadequate. The gatekeeper needs to feel indispensable.
2. **Structural solutions beat personal confrontation.** Rotate ownership, add contributor slides, set review SLAs — constrain bad behavior without requiring personality changes.
3. **Document behavior, not intent.** "You said X and the effect was Y" works. "You're trying to intimidate people" does not.
4. **Know when to stop adapting.** If escalation has failed and leadership tolerates the behavior, the answer may be to leave. Sometimes the strongest move is walking away.
