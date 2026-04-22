---
title: "Data-Informed vs. Data-Driven Decisions"
order: 2
tags: ["product-discovery", "data-driven", "decision-making", "metrics", "product-strategy"]
date: "2026-04-22"
draft: false
---

There is a specific kind of engineering org that insists everything be "data-driven," and a year later nobody can explain what the product is actually trying to do. There is another kind that insists data is overrated, and a year later they've shipped a confident vision of a product nobody wants. The difference between both of these failure modes and a healthy discovery practice is a small vocabulary distinction that most teams blur into meaninglessness: **data-driven** versus **data-informed**.

This chapter is the distinction, sharpened.

## The Distinction That Matters

*Data-driven* means the data makes the decision. You plug the numbers in; the numbers point to an answer; you take the answer. It works in narrow domains — ad-ranking systems, pricing optimization, fraud scoring — where the space is well-defined and the feedback loop is tight.

*Data-informed* means the data is one input to a human decision. You weigh it alongside qualitative evidence, strategy, ethical constraints, and judgment. The decision is made by people, explicitly, with the data as a seat at the table rather than the chair of the meeting.

The canonical article is Adam Nash's "Be Data Informed, Not Data Driven" (2011). His thesis, summarized: treating data as the decider is a delegation of judgment, and judgment is the thing you are actually paid for. **Andrew Chen** (a16z) makes a similar point from a different angle — pure data-driven optimization gets you to local maxima and kills 0-to-1 bets, because there's no historical data for things that don't exist yet.

The deeper issue is **Goodhart's Law**: *"When a measure becomes a target, it ceases to be a good measure."* Optimize hard for daily active users and you'll get dark patterns, notification spam, and a product that people hate but open daily. The data is correct; the decision it drove is wrong.

## The Quant + Qual Pairing

The simplest and most useful framing of healthy decision-making:

- **Quantitative data tells you what.**
- **Qualitative data tells you why.**

A funnel conversion drops from 60% to 40%. That is a *what*. The data cannot tell you whether it's a regression, a seasonal effect, a broken integration, a successful experiment that turned away low-intent users, or a legitimate sign the product is breaking for people. To answer the *why*, you need five user interviews, a Zendesk dive, or a session replay.

Reverse the arrow and it holds: five interviews suggest a pattern. You don't know yet if it's *the* pattern. A dashboard query tells you whether the pattern is true at scale, or just true for your five users.

A useful rule of thumb: **for every significant quantitative anomaly, run five qualitative conversations before acting.** For every significant qualitative finding, pull one quantitative query before investing.

## When to Trust the Data, and When to Trust the Gut

Data-driven decisions work when:

- There's meaningful historical data for the change you're considering.
- The change is reversible.
- The outcome is well-defined (clicks, conversions, revenue per user).
- The feedback loop is fast enough to learn from.

Data-driven decisions *fail* when one or more of those conditions is absent. Specifically:

**Novel domains.** There is no past data for a product category that doesn't exist yet. Netflix's *House of Cards* decision in 2011 was a 100-million-dollar bet. The data showed that David Fincher, Kevin Spacey, and political drama each correlated with viewing — the decision to invest required executive conviction to aggregate these signals into a strategic bet. The data supported the decision; it didn't make it.

**Brand and identity decisions.** Google's former Visual Design Lead, Doug Bowman, left in 2009 over the "41 shades of blue" story — the team couldn't decide between two shades, so they tested 41. Bowman's farewell post is canonical reading: some decisions are about *taste* and *identity*, and reducing them to a clickthrough-rate test produces mediocre averages.

**Long-tail effects.** A/B tests that run for two weeks miss the retention effect that shows up in month three. You optimize for the short-term signal and hollow out the long-term one.

**Strategic bets.** Pricing-model changes, platform pivots, architectural rewrites. These are too expensive to A/B-test and too high-stakes to delegate to a statistical significance calculation.

Steve Jobs famously refused to A/B-test design choices. The overclaim here is *"don't test anything"*; the real lesson is *"know which decisions you're making."* A/B testing a CTA button's copy is fine. A/B testing your brand voice is probably not.

## Metrics Hierarchies: Beyond Random KPIs

Most teams have too many metrics and no hierarchy among them. The resulting dashboard is a wall of numbers with no priority, and a team that tries to move all of them ends up moving none.

The canonical structure:

- **North Star Metric.** A single leading indicator of the value the product is delivering. Sean Ellis and Amplitude formalized this: the metric you'd ship *around*, at the expense of other metrics if needed. Airbnb's used to be *nights booked*; Spotify's is *time spent listening*; Facebook's was famously *seven friends in ten days*.
- **Input metrics.** Leading indicators that drive the North Star. For a SaaS app: signups, activations, first successful action, second week return. You can act on these today; the North Star will move next quarter.
- **Output metrics.** Lagging indicators. Revenue, renewals, NPS. Slower to move, closer to business outcomes.
- **Guardrail metrics.** Metrics you commit to *not moving in the wrong direction* while you optimize the primary one. Classic guardrails: p99 latency, churn rate, complaint volume. A feature that wins on CTR but loses on retention is not a win.

**John Cutler's "metric trees"** push this further. Each top-level metric decomposes into drivers, each of which is separately testable. If you can't draw the tree, you probably don't understand the causality; and if you can't draw the tree, you're not ready to run the experiment.

**Sean Ellis's product-market-fit test** — "how would you feel if you could no longer use [product]?" — with 40% answering *very disappointed* as the threshold. Useful not as a literal gate but as a framing: the metric you should care most about is the shape of the disappointment, not the average satisfaction.

## The HIPPO and Its Inverse

Two organizational pathologies to recognize.

**HIPPO** — the *Highest Paid Person's Opinion* decides, facts notwithstanding. Coined by Avinash Kaushik in 2006. A meeting where the VP says "I think users want X" and the team spends the quarter building X because no one wanted to push back. This is the classic "we're not data-informed" failure.

**The inverse** is subtler and rarer-named: **learned experimental helplessness**. Every decision becomes "we need to A/B test it." Strategic bets stall because no one will commit. Low-traffic features can't be tested meaningfully but teams won't ship them without a test. The cost of testing (setup, traffic, weeks of runway) dwarfs the value of the decision.

A good senior engineer diagnoses which mode the room is in, and intervenes accordingly. In a HIPPO room, you bring the dashboard. In an experimentally-helpless room, you bring the decision memo and say: *"this is a Type 1 decision; we don't need a test; we need a call."*

## Decisions That Shouldn't Be A/B Tested

Not every decision is a candidate for experimentation. A compressed list of things to keep out of the experimentation queue:

- **Strategic bets.** Platform pivots, pricing-model redesigns, new market entry.
- **Brand and identity.** Logo, voice, tone, product naming.
- **Low-traffic features.** Without enough users, there's no statistical power. You'll run for months and still be uncertain.
- **Ethics- and safety-laden choices.** "Should we A/B test the child-safety warning?" No.
- **One-way doors.** Jeff Bezos's 1997 framing: some decisions are reversible (two-way doors) — move fast, experiment. Others are not (one-way doors) — slow down, gather input, decide deliberately. Shreyas Doshi's **Type 1 / Type 2** decision vocabulary is the same idea and has become standard at product-led companies.

## Writing a Decision Memo

The Amazon six-pager format is worth adopting even if your company uses slide decks. The structure forces discipline:

1. **Observations** — what's true, with sources. "Conversion on the checkout page dropped 8% WoW in the last three weeks (source: Mixpanel funnel X)."
2. **Inferences** — what the observations imply. "The drop correlates with the iOS 17 rollout, suggesting a platform-specific issue."
3. **Options** — the distinct paths forward, each with cost and risk.
4. **Recommendation** — the one you're proposing, with rationale.
5. **Pre-mortem** — "if this recommendation fails twelve months from now, why?" Gary Klein's *HBR* 2007 piece on pre-mortems is the canonical reference; it's one of the highest-leverage exercises you can run before committing.

A discipline the memo enforces: **separate observations from inferences**. Most team disagreements are not about the data — everyone's looking at the same Mixpanel chart — but about the inference you're drawing from it. Forcing them onto different lines makes the disagreement legible and, often, solvable.

## The Senior Engineer's Actual Job

The one-liner version of this chapter:

> Senior engineers don't pick between data-driven and data-informed. They pick the mode that fits the decision, argue for it explicitly, and run that mode well.

Some weeks you're running an A/B test on a button color. Some weeks you're in a room with two VPs arguing about a platform bet that has no data to inform it. Both of those are legitimate decision modes. The failure mode in each direction — testing things that shouldn't be tested, gut-calling things that should be tested — is what gives each mode its bad reputation.

The vocabulary and rigor in this chapter is the bridge to the next one. Chapter 3 is about A/B testing specifically — *how* to run one well when the decision is one that should be tested.

---
*Next in the series: the mechanics of trustworthy experimentation — power analysis, stopping rules, sample-ratio mismatch, and the twelve ways experiments quietly lie to you.*
