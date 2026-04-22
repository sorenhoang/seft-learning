---
title: "Kill Criteria: When to Kill a Feature"
order: 6
tags: ["product-discovery", "kill-criteria", "deprecation", "technical-debt", "decision-making"]
date: "2026-04-22"
draft: false
---

Every product org is better at launching features than killing them. This is not a skill gap — it's a structural asymmetry. Launching a feature has a demo, a Slack announcement, and a plot on the roadmap; killing one has an awkward email, an angry customer, and a retrospective nobody asked for. The net result is that most products accumulate features the way rivers accumulate silt: slowly, quietly, and without anyone deciding it should happen.

This chapter is the counterweight. It covers why killing features is hard, how to write kill criteria *before launch* so you don't have to make the hard call under pressure, and how to run a sunset cleanly when the criteria are met.

## Why Killing Features Is Hard

The forces working against killing any given feature are predictable:

- **Sunk-cost fallacy** (Arkes & Blumer, 1985). "We spent six engineer-months building this; we can't just turn it off." The logic is backwards — the six months are gone regardless — but the instinct is strong.
- **Loss aversion** (Kahneman & Tversky, 1979). Losses feel roughly 2× the magnitude of equivalent gains. Retiring a feature *feels* like a 100-unit loss even when keeping it is a 101-unit loss.
- **Political cost.** The VP who sponsored the feature, the PM who pitched it, the engineer whose career moved on it. Killing the feature can feel like disrespecting those people.
- **Team identity.** If "we're the team that built X" has become part of how the team describes itself, killing X creates an identity problem on top of a product problem.
- **Endowment effect.** Once something exists, people value it more than they would have valued its absence, independent of its actual use.

Recognize these. They will show up in every kill conversation you're ever in, including your own internal ones. Naming them doesn't make them go away, but it makes them debatable rather than dispositive.

## Kill Criteria, Defined Upfront

The single most impactful practice in this area is writing kill criteria **before launch**, not after. Annie Duke's *Quit* (2022) makes the case in detail: humans are systematically bad at quitting in the moment, because the moment is when all the emotional and political forces above are strongest. The defense is **pre-commitment** — write down, while you're cold and rational, the condition under which you will quit. Duke's phrase is *"states and dates"*: define both the state (metric threshold) and the date (by which that state must be reached). If the date arrives and the state isn't there, you quit.

For a product feature, the kill-criteria spec reads something like:

> This feature will be retired if **fewer than 5% of target users** have used it at least once **by 90 days post-launch**.

Writing it before launch converts a future emotional decision into a present rational one. It doesn't eliminate the emotional part — you'll still feel bad — but the decision is already made. You are executing a pre-committed plan, not negotiating with yourself in the moment.

Duke's more uncomfortable point: *quitting on time always feels like quitting early*. If it felt like quitting late, you'd have quit sooner. The discomfort is the signal that the pre-committed criteria are doing their job.

## Categories of Kill Criteria

A useful mental taxonomy — most real kill criteria are a combination of these:

**Adoption thresholds.** *"Fewer than 5% of the targeted segment touches this feature at least once in 90 days."* Simple, legible, defensible. Good for new features where reach is the main bet.

**Retention degradation.** *"Treatment cohort day-7 retention drops by more than 2 percentage points vs control."* Good for features you initially rolled out behind an experiment — the data is already there.

**Operational burden.** *"Support tickets per 1,000 users exceed 2.5, or on-call pages per week from this feature exceed 2."* Good for features where the maintenance cost is the concern.

**Opportunity cost.** *"Engineer-weeks spent maintaining this feature exceed the engineer-weeks required to ship the next prioritized alternative."* Good for features that work but have become expensive relative to what else the team could be doing.

**Strategic misalignment.** *"The feature no longer maps to the current company strategy, as reflected in the annual plan."* Broader; harder to operationalize, but the clearest criterion when real strategic change happens.

**Quality floor.** *"The feature's p99 latency regresses below SLA and isn't fixable within one team-week of effort."* Good for technical features where the cost of fixing exceeds the benefit of keeping.

The best kill criteria combine two or three of these with "any of" logic. A single threshold is brittle — there's always an excuse for why today's value doesn't count. Three thresholds, any of which triggers a review, is harder to wriggle out of.

## The Zombie Feature Problem

Most features don't get killed. They become **zombies**: low adoption, non-trivial maintenance burden, no strategic role, no champion willing to fight for them — and yet, somehow, never retired. The math inside an individual team usually looks like "the cost of killing it today exceeds the cost of keeping it another quarter," so nothing happens. But the cost of keeping compounds:

- **Complexity tax.** Every refactor has to consider the zombie's edges.
- **Cognitive load.** New engineers have to learn that it exists and roughly how it works.
- **Onboarding friction.** The zombie is in the UI, so new users notice it, try it, and form opinions about the product based on a feature nobody intends to improve.
- **Test surface.** CI takes slightly longer to run because the zombie has tests that nobody's touched in two years.

Each of these is small in the moment. Over five years they accumulate into the main reason senior engineers describe their codebases as *"slow."* Killing zombies is one of the highest-leverage activities a senior engineer can run, precisely because no one else wants to do it.

How to identify a zombie:

- Low usage (by whatever relevant metric).
- Non-zero maintenance cost (code touches, bug reports, on-call pages).
- No strategic role in the current plan.
- No named internal champion.

Four-for-four is a zombie. Three-for-four is worth a review.

## When *Not* to Kill

Not every low-usage feature should die. There are legitimate categories to preserve:

**Strategic anchors to key customers.** A feature used by one whale on a seven-figure contract. Usage statistics will look awful; keeping the whale matters more.

**Brand and identity features.** GitHub's gists are low-traffic relative to GitHub overall. They are also part of what makes GitHub feel like GitHub. Stripe's documentation is not a feature you'd kill for low engagement; it's a feature the brand is built on.

**Partner and platform requirements.** A first-party SDK with fifty users but critical to partner integration. Low raw usage; disproportionate strategic signal.

**Compliance checkboxes.** SOC 2 export, HIPAA audit log, GDPR deletion endpoint. Low usage; non-negotiable existence.

**"Platform tax" features.** Things you have to have to be taken seriously in your market category. In CRM, you have to have reports, even if most customers run five canonical ones; a CRM without reports isn't a CRM.

The test is whether the feature's value is **contingent on raw usage**. If raw usage is the value, low usage is a reason to kill. If the value is strategic, partner-facing, compliance, or brand-critical, usage is not the whole picture.

## The Sunset Process

Once the kill criteria trigger, the sunset itself deserves a playbook. A clean version:

1. **Internal decision and owner.** One named accountable. Not a committee.
2. **Deprecation notice.** Typical windows: 60 days for low-stakes internal features, 180+ days for heavily integrated external APIs.
3. **Migration path.** If users are relying on the feature, give them somewhere to go. Export, replacement feature, partner tool. *"Just turn it off"* is acceptable for zero-integration features; for anything load-bearing, migration support is part of the cost of killing.
4. **Communication cadence.** In-app banner, email at T-60/T-30/T-7 days, changelog entry, direct outreach to top users. Repeat more than feels comfortable — people don't read the first three emails.
5. **Final removal.** Remove the code, the tests, the flags, the dashboards, the on-call runbooks. *Don't leave the cleanup half-done*; the zombie state is worse than the original.
6. **Post-sunset writeup.** Short document: what was killed, why, what happened. Goes in an internal archive. This is how you learn to do the next sunset better.

**Google Cloud's published deprecation policy** is a well-documented template that's worth adapting — it's intentionally conservative (12-month notice for GA APIs) but the structure translates to most contexts.

## Case Studies Worth Knowing

A few public cases that illustrate the spectrum:

**Google Reader (2013).** Declining use, strategic consolidation under Google+. A textbook sunset — six-month notice, export tooling, clear communication. The backlash was still considerable; the sunset itself was well-run. Moral: even clean sunsets hurt.

**Google+ (2019).** Shut down after a security incident and sustained low engagement. Documented via Google's sunset policy. Moral: strategic features eventually hit kill criteria too.

**Internet Explorer (2022).** Multi-year deprecation, well-telegraphed. Microsoft invested heavily in migration paths (Edge with IE mode). Moral: if the feature is load-bearing in its user base, the sunset itself is a multi-year program.

**Amazon Fire Phone (2014).** Killed 13 months post-launch after poor sales. Moral: strategic products can and should be killed quickly when the bet isn't paying off; waiting a decade doesn't improve the outcome.

**killedbygoogle.com** tracks 290+ products Google has shut down. Browsing it is instructive — you'll notice that the ones that felt shocking at the time (Reader, Inbox) were usually killed for coherent reasons, and the ones that felt obvious (Google+, Stadia) had been on life support for years.

## The Discipline, Compounded

A team that can kill features cleanly has dramatically more capacity than one that can't, because the capacity isn't tied up in maintenance of things that aren't working. The senior-engineer responsibility: hold the line on kill criteria, raise the zombie question periodically, and run sunsets like projects rather than avoidance.

The full arc of this series, one last time:

1. Why engineers belong in user interviews.
2. The distinction between data-informed and data-driven decisions.
3. How to run trustworthy A/B tests.
4. How to use feature flags as discovery infrastructure.
5. How to roll out safely via shadow launch and canary release.
6. How to retire features deliberately.

These six practices compound. A team that does all of them well has a substantially better hit rate on the features it keeps — because it talks to users, tests rigorously, rolls out carefully, and cuts the ones that don't work. Most teams do two or three of the six and are baffled when their roadmap fills with features that nobody quite remembers agreeing to.

You don't have to do all six at once. Pick one this quarter and actually do it — write the kill criteria for your current top-priority feature before it ships, or schedule three user interviews this week, or fix your peeking-during-A/B-tests habit. The compound effect across a year is larger than any individual chapter suggests.

---
*This is the final chapter of Product Discovery for Engineers. The practices here are not one-time reads — they are habits the best engineers build over years. Start with one; the rest will follow.*
