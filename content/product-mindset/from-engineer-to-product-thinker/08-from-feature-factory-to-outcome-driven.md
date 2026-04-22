---
title: "From Feature Factory to Outcome-Driven Engineering"
order: 8
tags: ["product-mindset", "outcome-driven", "feature-factory", "engineering-culture", "okrs"]
date: "2026-04-22"
draft: false
---

There's a specific shape of engineering organization that the best product companies have collectively decided is broken, and that most engineering organizations still are. It has a name, coined by John Cutler in a 2016 essay: the **feature factory**. Features go in one end, ship out the other, nobody measures whether they worked, and the team's productivity is reported in shipped-feature count. This chapter is the end-state of the series: the shift from that model to one where engineering teams are measured on outcomes rather than output — and, importantly, the specific things individual engineers can do to nudge their organizations in that direction, even when leadership hasn't bought in yet.

## The Canonical Feature Factory

Cutler's 2016 essay, "12 Signs You're Working in a Feature Factory" (originally on Hackernoon, republished on the Amplitude blog), is the load-bearing reference. The twelve signs, compressed:

- **Shipping is the metric.** Velocity is reported in stories or features per sprint. Nobody asks whether the features did anything.
- **Rapid shuffling between projects.** Teams get ricocheted between priorities because the roadmap is a commitment list, not a strategy.
- **No measurement of success after launch.** Features launch; dashboards are maybe built; nobody checks them a month later.
- **Obsession with predictability over learning.** The worst sin is a missed deadline. The second worst is shipping something that doesn't work.
- **Launches are the celebration moment.** Not outcomes. Not learning. The ship day is the party.
- **No one ever talks to users.** Research is something that happens elsewhere, summarized third-hand.
- **Large batch releases.** Quarterly, half-yearly, with many features bundled. Feedback loops are slow.
- **"Success theater."** Teams present "wins" at all-hands that are features shipped, not metrics moved.
- **Obsession with "best practices."** Process over judgment, Scrum over outcomes.
- **Stakeholder-driven, not user-driven.** The roadmap reflects what internal stakeholders asked for.
- **Deadline-driven everything.** Even when there's no real external deadline, one gets manufactured.
- **Nobody questions the roadmap.** Features flow in; features flow out; the team executes.

The Amplitude version of the list is still maintained; it's worth reading in full. The uncomfortable truth for most engineers reading this: you've probably worked in at least two of these, and possibly live in one now.

## What "Outcome-Driven" Means

The alternative model shifts the team's commitment from *shipping* to *moving metrics*. Features become *hypotheses*, not *commitments*. Roadmaps describe *bets* instead of *guarantees*. Retrospectives ask *"what did we learn?"*, not *"did we hit the sprint goal?"*

The book-length treatment is **Melissa Perri's *Escaping the Build Trap*** (2018). Perri's "build trap" is exactly the failure mode above — mistaking shipping for value creation. Her proposed alternative has three components:

- **Problem-first roadmaps.** Instead of "Q2 roadmap: ship feature A, B, C," the roadmap reads "Q2 problem: reduce onboarding drop-off from 40% to 25%." How the team does it is left to the team.
- **Measurement as Definition of Done.** A feature isn't "done" when it ships; it's done when the target metric has moved, the hypothesis has been validated or invalidated, and a decision has been made about next steps.
- **Continuous discovery alongside delivery.** Discovery and delivery aren't sequential phases; they happen in parallel, with constant feedback between them.

Marty Cagan's *Empowered* (2020) covers similar ground from a different angle. His framing: the "empowered product team" is given a problem to solve and success metrics, not a list of features to build. The team's job is to figure out *how* to move the metrics. Cagan's argument is that "most agile organizations are still feature factories under a Scrum wrapper" — the ceremonies changed; the underlying accountability didn't.

## OKRs: The Right Way and the Wrong Way

OKRs — Objectives and Key Results — originated at Intel under Andy Grove (*High Output Management*, 1983) and were evangelized to the startup world by John Doerr (*Measure What Matters*, 2018). Done right, they're the clearest framework for outcome-driven work: the *Objective* is a qualitative direction; the *Key Results* are the metrics that will tell you whether you got there.

Done wrong, they become feature commitments in metric language. Consider:

- **Wrong KR:** *"Ship the new onboarding flow by end of Q2."* This is a task; the metric is whether the task happened.
- **Right KR:** *"Increase activation rate from 30% to 45% by end of Q2."* This is an outcome; the metric is whether the thing worked.

Christina Wodtke's *Radical Focus* (2016) hammers this distinction. The test: if your KR can be met by *shipping something*, regardless of whether it *does anything*, it's not a KR. It's a project commitment.

Most organizations that adopt OKRs do them badly for this reason — the first draft of KRs is always the team's existing roadmap translated into OKR syntax. The second draft, written with discipline, looks completely different.

## Team Topologies and Outcome Ownership

The structural change that makes outcome-driven work feasible comes from **Matthew Skelton and Manuel Pais's *Team Topologies*** (2019). Four team types:

- **Stream-aligned teams** — own a value stream end-to-end, from user need to production.
- **Enabling teams** — help stream-aligned teams acquire new capabilities.
- **Complicated-subsystem teams** — own specialized components with deep expertise.
- **Platform teams** — provide internal services that stream-aligned teams consume.

Only stream-aligned teams can really be outcome-driven in the product sense, because only they own the full path from user problem to shipped solution. Platform teams are outcome-driven in a different way — their users are other engineers, and their outcomes are engineering productivity metrics (see chapter 6 on DORA and SPACE).

The implication: if your team is structured so that shipping a single user-facing outcome requires coordination across four teams, no amount of OKR reform will make any of those teams actually outcome-driven. The team structure has to change first. This is often the largest hidden barrier to escaping the feature factory.

## Why Orgs Revert

Even organizations that know the theory routinely slide back into feature-factory mode. The forces are strong:

**Output is measurable this quarter; outcomes may take two.** A shipped feature is visible today. A metric that moves in response to the feature takes 30 to 90 days. Quarterly planning cycles reward the first and punish the second.

**Executives trained on Gantt-chart predictability.** Many senior leaders came up in an era when predictable delivery *was* the job. They measure their own success by delivery, and they measure their teams the same way. Marty Cagan calls this pattern **"roadmap theater"** — commitments that look like plans but function as performance.

**Sales-led dynamics.** In a company where sales leadership has organizational weight, the roadmap becomes whatever the biggest customer demanded last week. This is a structural, not cultural, cause of feature-factory mode — and it can only be addressed by executive-level intervention.

**Quarterly cadence punishes experimentation.** A six-month bet doesn't fit into a Q2 commit. Teams default to features they can finish in a quarter, even when the more valuable work would take two.

Recognizing these forces is the first step toward working with them rather than against them.

## What Individual Engineers Can Do

Here's the part that matters most for the audience of this series. Even in an organization that hasn't fully embraced outcome-driven work — possibly especially in such an organization — individual senior engineers can push the culture in specific, concrete ways.

**Refuse to estimate without a success metric.** When a PM asks for an estimate on a feature, push back with *"what's the success metric?"* before committing. If there isn't one, the feature isn't ready to scope. Do this consistently and PMs will learn to include the metric from the start.

**Make instrumentation a required part of Definition of Done.** No feature ships without the dashboards that will tell you if it worked. Build the dashboard during the implementation, not after.

**Run post-ship reviews.** Two weeks after launch, run a short meeting: *"did this move the metric we said it would?"* Attend. Invite the PM. Make the conversation a norm. One review per quarter is enough to start; the habit builds from there.

**Celebrate invalidated hypotheses.** The team that killed a feature at two-week review, because it didn't move the metric, has done something genuinely valuable — they freed the next month of engineering for a better bet. Make sure that work gets credit.

**Propose cheaper alternatives.** When the PM's proposed feature seems over-built for the stated outcome, propose a smaller test. *"We could ship this full version in six weeks, or we could ship a version-zero in two that tests the same hypothesis. I'd start with the version-zero."* This single move, done consistently, saves months per year.

**Resist the commitment-list framing.** When the roadmap is presented as "feature A, B, C," ask *"what outcomes are each of these trying to produce?"* Over time, this question reshapes how PMs write roadmaps, because the question keeps coming up.

None of these requires executive buy-in. None requires a reorg. They are individual practices that, in aggregate, change the culture around you.

## The Realistic Middle Ground

Full outcome-driven transformation usually requires executive support most organizations don't have. A pragmatic middle ground — what I'll call **outcome-informed** — is reachable from almost any starting point:

- **Features are still committed quarterly, but every one has a named success metric.** The commitment is to ship; the measurement is whether it worked.
- **20 to 30 percent of the team's capacity is reserved for outcome-driven bets with explicit kill criteria.** These features are hypotheses, not commitments.
- **Post-ship reviews happen for every feature that took more than an engineer-week.** Short, scheduled, routine.
- **Roadmap language uses problem statements alongside feature names.** "Reduce checkout abandonment (via: new error messaging, saved-cart feature, auto-save)."

Cutler's **dual-track** model (build track + discovery track) is the practical bridge. The build track continues to ship committed features; the discovery track runs experiments, interviews, prototypes. Each week, insights from the discovery track feed into next-sprint priorities on the build track.

This is achievable. It's not the pure form, but it's a meaningful shift — and it's often the realistic ceiling given the organizational constraints most teams operate under.

## The End of the Series

The full arc of these eight chapters, one last time:

1. Why engineers need a product mindset, and when they don't.
2. Jobs-to-be-Done as the framework for reading user needs.
3. Reading PRDs and spotting gaps before you code.
4. Asking "why" in meetings without being the obstacle.
5. Technical debt vs time-to-market, as an adult conversation.
6. The metrics engineers should actually care about.
7. When and how to push back on your PM.
8. From feature factory to outcome-driven engineering.

Each chapter is a piece of a single larger shift: becoming the engineer who thinks about users, metrics, rollouts, and outcomes — not after the fact, but *as part of how engineering work gets done*. The whole series is about ten concrete habits. You don't need all of them immediately. Pick one this week: read the next PRD that lands in your queue with the chapter 3 checklist; schedule a post-ship review on your last shipped feature; write down a success metric before your next estimate.

A year of that is the shift from engineer to product thinker. It isn't announced; it happens quietly, and one day you notice that the conversations in the room have shifted, and you're in them.

---
*This is the final chapter of From Engineer to Product Thinker. Companion series — Business Acumen for Senior Engineers and Product Discovery for Engineers — cover the financial and experimentation-craft angles of the same underlying career shift. Pick the one that matches the gap you're most aware of, and start there.*
