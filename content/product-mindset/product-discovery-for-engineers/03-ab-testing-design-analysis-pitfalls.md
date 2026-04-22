---
title: "A/B Testing: Design, Analysis, and Pitfalls"
order: 3
tags: ["product-discovery", "ab-testing", "experimentation", "statistics", "controlled-experiments"]
date: "2026-04-22"
draft: false
---

A/B testing looks deceptively simple. Split users into two groups, show them different versions, measure a metric, declare a winner. If the green button gets more clicks, ship the green button.

Run enough tests this way and you will quietly ruin your product. Most organizations doing A/B testing at any scale are routinely drawing wrong conclusions — sometimes because of statistical mistakes, more often because of procedural ones, and sometimes because the experiment was broken in a way that was never detected. The canonical book on this is **Ron Kohavi, Diane Tang, and Ya Xu's *Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing*** (Cambridge University Press, 2020). The title phrase that matters is *trustworthy*. The rest of this chapter is about what that means and how to achieve it.

## When to A/B Test (and When Not To)

Before the mechanics: when should you even reach for this tool?

A/B testing is the right tool when:

- **The decision is reversible.** If you're wrong, you turn the flag off.
- **You have statistical power.** Enough traffic, over a long enough window, to detect a meaningful effect.
- **The outcome metric is well-defined and measurable within the test window.**
- **No ethical concern blocks testing.** You aren't running people through an experience you'd be embarrassed about.

It is the wrong tool for strategic bets, brand decisions, one-way-door choices (see chapter 2), and features too low-traffic to reach significance before the business context changes.

## Core Experiment Design

A sound experiment has four parts: hypothesis, assignment, metrics, and duration. Skip any one of them and you're running a mistake in a lab coat.

**Hypothesis.** Write it in a single sentence, before you touch code:

> We believe that **[change]** will cause **[primary metric]** to move by at least **[minimum detectable effect]**, because **[mechanism]**.

The *mechanism* clause is the one engineers skip. It's also the one that catches most bad experiments — when you have to explain why the change will move the metric, you often realize the connection is implausible.

**Assignment.** Control and treatment groups must be identical in every way except the change being tested. Randomize at a consistent unit (user, session, account — but *commit to one*). Use a stable hash so the same user always sees the same variant across sessions. Deviations from 50/50 (or whatever split you planned) are a red flag; we'll cover this under SRM.

**Metrics.**

- **One primary metric.** Pre-committed. This is what the experiment decides on.
- **Two to three guardrail metrics.** Things you're *not* willing to trade for a primary-metric win — latency, error rate, downstream retention.
- **Secondary metrics** for context, explicitly labeled as exploratory.

**Duration and power analysis.** The minimum detectable effect (MDE) determines how many users per arm you need. A standard rule of thumb for a 1% relative MDE on a 10% base rate, at α=0.05 and power=0.80, is roughly 150,000 users per arm. For smaller base rates or smaller MDE, sample size grows quickly — often into the millions. **Evan Miller's sample-size calculator** (evanmiller.org) is the tool most teams use in practice. For teams with enough data-engineering investment, **CUPED** variance reduction (Deng, Xu, Kohavi, Walker, 2013) can cut the required sample size by 30 to 50 percent.

Plan a minimum of **one week**, even if you hit statistical significance earlier, to absorb weekday-vs-weekend cyclicality. **Two weeks** is the consumer-product default, because many user behaviors only show up after the novelty of the change wears off.

## Stopping Rules and Peeking

This is the single most common place A/B testing practice goes wrong in the wild.

The intuitive pattern — start the experiment, check it daily, stop when you see significance — **inflates the Type I error rate from 5% to something like 20 to 30 percent.** The Optimizely / Stanford paper *Peeking at A/B Tests* (Johari, Koomen, Pekelis, Walsh, 2017) is the canonical proof.

Three legitimate approaches:

1. **Commit to duration.** Decide the runtime up-front based on power analysis. Don't check for significance before it ends.
2. **Sequential testing.** Statistical methods that give you "always-valid" p-values: mSPRT (Optimizely's Stats Engine), group-sequential designs (O'Brien-Fleming, Pocock alpha-spending). These let you peek without inflating error, at the cost of slightly less power.
3. **Bayesian bandits.** Multi-armed bandits that adapt allocation over time to the better-performing variant. Appropriate for low-stakes optimization (headlines, recommendations) but not for genuine hypothesis testing.

Whichever you pick, **pick it before the experiment starts**, and don't switch methods mid-flight.

## The Pitfalls — The Twelve Ways Experiments Lie

Kohavi's book opens with them. The ones every engineer should internalize:

**Sample Ratio Mismatch (SRM).** If you planned a 50/50 split and your actual assignment is 52/48, something is broken — a bot filter, a logging race, a client-side bug that suppresses one variant. Fabijan et al.'s 2019 paper at Microsoft formalized the chi-square test: if p<0.001 on assignment counts, **the experiment is invalid**. Throw it out. Do not try to salvage the results.

**Twyman's Law** — *"any piece of data or statistic that looks interesting or different is usually wrong."* A treatment showing a 15% lift on a well-measured business metric is, nine times out of ten, an instrumentation bug. Check the code first. Kohavi's KDD 2012 paper "Trustworthy online controlled experiments: Five puzzling outcomes explained" is a tour of these.

**Simpson's Paradox.** The aggregate effect points one way; the effect in each segment points the other. Common when the assignment isn't balanced across segments (e.g., iOS users overrepresented in one arm). You'll see this in A/B tests that combine pre-existing cohorts.

**Multiple comparisons.** Test twenty metrics; at α=0.05 you'll "find" one statistically significant difference by chance. If you're going to look at many metrics, use **Benjamini-Hochberg FDR control** or at minimum be explicit about secondary metrics as exploratory. Bonferroni is too conservative for large numbers.

**Novelty and primacy effects.** *Novelty:* the treatment looks great for three days because users interact with anything new; effect washes out by day ten. *Primacy:* a change disrupts muscle memory; users hate it for a week, then adapt and love it. Either one can completely invert the short-window result. Defense: look at day-seven treatment effect vs day-one, and commit to a two-week minimum.

**Primary vs guardrail confusion.** Treatment wins on clicks, loses on retention. If you didn't pre-commit both as relevant, you'll ship the win and leak customers for six months before anyone connects the two.

**Selection bias and leakage.** Cookie-clearing users, logged-out flows that intersect with logged-in flows, shared devices, signed-out users who later sign up — each is a way for the supposedly-isolated variant to bleed across the boundary.

**Under-powered tests.** A test with 2,000 users per arm cannot detect a 2% effect. The team will "see no difference" and conclude the change didn't work, when in fact they couldn't have seen the difference even if it existed. Power analysis before launch is non-negotiable.

## Analysis Best Practices

A few habits that compound:

- **Pre-register.** Before you launch, write down the hypothesis, primary metric, guardrails, MDE, and duration. Refuse to change these mid-flight. Tools: a simple Notion template or a shared Google Doc works fine.
- **Use confidence intervals, not just p-values.** A 95% CI of [+0.1%, +3.2%] tells you both *that* the effect is real and roughly *how large* it is. A bare "p<0.05" tells you the first only.
- **Segment after, not during.** Looking at subsegments mid-experiment is how p-hacking begins. If you're going to slice by device, geo, or tenure, pre-commit those segments at the start, or flag slicing as exploratory.
- **Check for SRM before anything else.** Run the chi-square test first. If it fails, don't even look at the primary metric; debug the assignment.

## The Tooling Landscape

Platforms have converged dramatically. An engineer can now reach for any of:

- **Self-hosted and open-source:** **GrowthBook** is the most common OSS choice.
- **In-house platforms:** Facebook's PlanOut, Netflix's ABlaze, Airbnb's ERF, Uber's XP, LinkedIn's T-REX. All have published papers; they're worth skimming if you're building something similar.
- **Managed SaaS:** Statsig, Eppo, Optimizely, LaunchDarkly Experimentation, Amplitude Experiment, Split.

All of these share a near-identical data model: experiments are built on top of a feature-flag assignment service, joined to an event-telemetry warehouse, with a statistical engine on top. Chapter 4 covers the flag layer; the experiment layer sits on top of it.

## The Senior-Engineer Responsibility

If you're the senior technical person on a team running experiments, three responsibilities land on you more than on anyone else:

1. **Enforce trustworthy practice.** SRM checks. Pre-registration. No peeking. No switching stopping rules mid-flight.
2. **Kill zombie experiments.** Tests that have been running for four months without a conclusion are wasting both traffic and team attention. Set a rule: every experiment gets a planned end date; if it hits that date without significance, it ends and you make a judgment call.
3. **Recognize the Twyman's-Law moments.** When a result seems too big to be true, assume it is, and instrument the path to prove it. Half the time you'll find the bug; the other half you'll earn deep credibility when you've ruled it out.

A well-run experimentation program measures its output not in experiments-per-quarter but in **trustworthy decisions delivered**. The math is simple: ten rigorous tests a quarter that actually decide something beat a hundred sloppy tests that leave everyone arguing about the result.

---
*Next in the series: feature flags — the infrastructure that makes all of this possible, and the hygiene problem that sinks most teams' flag programs within eighteen months.*
