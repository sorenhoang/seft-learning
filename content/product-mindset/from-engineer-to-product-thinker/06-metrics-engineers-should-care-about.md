---
title: "The Metrics Engineers Should Actually Care About"
order: 6
tags: ["product-mindset", "metrics", "observability", "developer-experience", "dora"]
date: "2026-04-22"
draft: false
---

Ask a senior engineer what metrics they watch, and you'll usually hear a very consistent answer: latency, error rate, uptime, saturation, maybe throughput. These are the Google SRE "Four Golden Signals," and they're good. They're also roughly a quarter of the metrics a product-minded engineer should actually be thinking about.

This chapter is the rest of the stack. Not because engineers should stop caring about operational metrics — they shouldn't — but because operational metrics are *hygiene* metrics, not *value* metrics. A product with perfect uptime and zero users is still a dead product. The engineer who only watches the ops dashboard is measuring whether the lights are on, not whether anyone is home.

## Why Operational Metrics Are the Default

SRE culture, formalized in the Google SRE book (Beyer, Jones, Petoff, Murphy, 2016), trained a generation of engineers to watch four signals:

- **Latency** — how long requests take.
- **Traffic** — how much demand the system is under.
- **Errors** — how often requests fail.
- **Saturation** — how full the system is.

These are load-bearing. You need them. But they tell you about the *system*, not about the *product*. A feature that has perfect latency and zero errors can still be completely unused — and in most cases, that's a worse outcome than the one where a popular feature has elevated error rates you can go fix.

The engineer who stops at operational metrics is implicitly saying *"my job ends at the API boundary."* The product-minded engineer extends the view through the user.

## The Full Metric Stack

A more complete picture of what a senior engineer should be able to speak about:

**Operational.** Golden Signals plus throughput. Known territory.

**Product engagement.** These are the metrics that tell you whether anyone is *using* what you built:

- **Activation** — first meaningful action after signup. The moment the user does the thing that makes the product valuable to them. Activation rates typically range from 20% to 60%; anything below that is a strong signal of broken onboarding.
- **Retention cohorts** — what percentage of users who signed up this week are still active at day 1, day 7, day 30. The retention curve shape matters more than the single number; flat curves after week 4 are healthy, continuously-declining curves are broken.
- **DAU/MAU ratio** — daily active users divided by monthly. A heuristic from Facebook's growth era; 20% is average, 50%+ is elite. Measures "stickiness."
- **Feature-specific adoption curves** — what percentage of target users discovered and used the feature you shipped, over time. This is the number that tells you whether your specific work mattered.

**Business.** Revenue, conversion, LTV, NRR. These are covered in depth in the Business Acumen sibling series; here I'll just note that every engineer should know which of these their work moves, and how. If you can't answer "how does my project affect revenue or retention?", you can't have a serious product conversation.

**Developer experience (DevEx).** The metrics that measure engineering effectiveness:

- **DORA Four Keys** (from *Accelerate*, Forsgren, Humble, Kim, 2018). The gold standard for engineering throughput and stability:
  - **Deployment frequency** — how often you ship.
  - **Lead time for changes** — how long from commit to production.
  - **Mean time to restore (MTTR)** — how fast you recover from incidents.
  - **Change failure rate** — percentage of deploys that cause issues.
- **SPACE framework** (Forsgren, Storey, Maddila, Zimmermann, Houck, *ACM Queue* 2021). Five dimensions: Satisfaction, Performance, Activity, Communication, Efficiency. Useful because it captures things DORA doesn't — *satisfaction* especially. An engineering org with elite DORA metrics and miserable engineers is on a short clock.

**Quality.** Metrics about the health of the work itself:

- **Bug escape rate** — production bugs divided by total bugs found. Lower is better; rising ratios mean testing is slipping.
- **Mean time to detect (MTTD)** — how fast incidents are noticed. Often more important than MTTR; you can't restore what you haven't detected.
- **Customer-reported vs internally-detected bug ratio** — the canonical observability health check. If customers are finding your bugs before your monitoring does, the observability is the bug.

Each layer tells a different story. An engineer who can speak fluently across all of them is rare and valuable.

## Leading vs Lagging Indicators

The single most useful distinction in metrics thinking: **leading indicators** move quickly and predict lagging ones; **lagging indicators** move slowly and confirm what leading ones already told you.

Examples:

- **Revenue** is lagging. It confirms whether your product worked, but by the time it moves, the cause happened months ago.
- **Activation rate** is leading. Move it this week, and you'll see the effect on retention in a month and on revenue in a quarter.
- **Net Revenue Retention (NRR)** is deeply lagging — quarterly or annual. You can't iterate against it.
- **Weekly feature adoption** is leading — daily or weekly movement. You can iterate against it fast.

The practical implication: if you want to move a lagging metric, find the leading metric that drives it and optimize that instead. Amplitude's *North Star Playbook* makes this explicit — the North Star metric is usually lagging, but it's decomposed into input metrics that are leading and actionable.

The **Sean Ellis product-market-fit test** sits somewhere in between: a survey asking users *"how would you feel if you could no longer use this product?"*, with 40% or more answering *"very disappointed"* as the threshold for product-market fit. A useful framing precisely because it's somewhat lagging (requires users who've had real experience) but faster-moving than raw revenue.

## Metrics Anti-Patterns for Engineers

Specific failure modes worth recognizing:

**Measuring what's easy instead of what matters.** Pageviews are easy to count; engaged sessions are hard. Teams default to pageviews, then optimize for pageviews, then produce products that game pageviews without generating value. This is **Goodhart's Law** in action: *"when a measure becomes a target, it ceases to be a good measure."* Charles Goodhart's 1975 observation about monetary policy applies directly to engineering metrics.

**Vanity metrics.** Signups, stars on GitHub, total pageviews — numbers that reliably go up without telling you anything actionable. The classic Eric Ries critique in *The Lean Startup* (2011): a signup number that's grown for two years tells you nothing if retention has been dropping.

**Dashboard proliferation without owners.** Every team has a dashboard. Nobody has gone looking at it in six months. Nobody would notice if a metric moved. A metric without a named owner who watches it is effectively not a metric.

**Single-metric optimization.** Picking one metric and optimizing it hard, without guardrails. Optimize hard for DAU and you'll get notification spam. Optimize hard for conversion and you'll get manipulative UI. Every primary metric needs two or three guardrails to prevent the obvious perverse optimization.

**Measuring output instead of outcomes.** Deploys per week, features per sprint, story points completed. All interesting; none tells you whether the work was worth doing.

## The AARRR Funnel

Dave McClure's 2007 slide deck *Startup Metrics for Pirates* (the framework is called "AARRR" because of the letters, not because of pirates) still works as a funnel mental model:

- **Acquisition** — users arriving at the product.
- **Activation** — users experiencing the product's core value.
- **Retention** — users coming back.
- **Referral** — users bringing others.
- **Revenue** — users paying.

The framework's usefulness is diagnostic. When a team says *"we need to grow,"* the AARRR funnel asks *"grow where?"* — and the answer is usually whichever stage is currently the biggest leak. A product with 50% activation and 10% retention doesn't need more acquisition; it needs retention fixes. A product with 90% retention and 1% acquisition needs marketing, not product work.

Engineers benefit from AARRR because it reframes the question *"what should we build?"* into *"which funnel stage needs the most help, and what's the specific technical change that would improve it?"*

## The Engineer's Practical Playbook

A concrete operational rule for senior engineers:

**Per shipped project, pick 2 to 3 metrics across the stack.** Typically one product metric (feature adoption or retention impact), one operational metric (latency or error rate specific to the new surface), and one quality metric (bug rate, error frequency, customer escalations).

**Instrument before launch with the same rigor as error tracking.** No launch without instrumentation. The metric should exist in a named dashboard, with a named owner, *before* the feature ships. Retrofitting instrumentation after launch is both harder and less credible.

**Schedule post-ship reviews.** T+2 weeks and T+8 weeks. The T+2 review answers *"did the launch do what we expected?"* The T+8 review answers *"is the impact sticking?"* Features that don't move their intended metric at T+2 are candidates for iteration; features that moved at T+2 but not at T+8 are often novelty-effect wins that wash out.

**Kill the dashboards no one reads.** A dashboard with no owner and no scheduled review is worse than no dashboard — it creates the illusion of monitoring. Cull aggressively.

## What This Looks Like in Practice

An engineer who operates this way has dramatically more credibility in product conversations than one who doesn't. They can say:

- *"This feature, at launch, saw 23% of our target segment activate it in the first two weeks, but D7 retention among that cohort is only 40%. The functional job is getting done; the return trigger isn't working. I think we need to add [specific thing] to the flow."*

versus

- *"It shipped, and the system is green."*

Both engineers shipped the feature. One is in the conversation about what to build next; the other is waiting to receive the ticket. That difference compounds across a career.

---
*Next in the series: the craft of disagreeing with your PM — the escalation ladder, legitimate vs illegitimate reasons, phrasings that earn respect rather than resentment, and the moment when persistent pushback is a signal you're in the wrong place.*
