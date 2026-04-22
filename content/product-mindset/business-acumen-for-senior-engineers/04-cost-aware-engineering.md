---
title: "Cost-Aware Engineering"
order: 4
tags: ["business-acumen", "finops", "cloud-cost", "engineering-productivity", "build-vs-buy"]
date: "2026-04-22"
draft: false
---

Cost is the discipline that separates senior engineers from everyone else. Not because juniors can't add up a bill — they can. It's that cost, at this level, is about *which* costs to pay attention to and *which* to ignore. The cloud bill is the obvious one. The less obvious ones — engineer-hours, opportunity cost, tech debt as interest — are usually 10× larger and 100× less discussed.

This chapter covers all of them: cloud FinOps, velocity as cost, opportunity cost, build-vs-buy, and the decision frameworks senior engineers use to defend the roadmap from low-ROI work — including their own.

## FinOps: The Discipline, Not the Tool

The FinOps Foundation defines it as *"an operational framework and cultural practice that maximizes the business value of cloud through collaboration between engineering, finance, and business teams."* That's a mouthful. The simpler framing:

> Cloud shifted spend from *capex* (CFO-gated, annual) to *opex* (engineer-gated, per-commit). Every PR can now raise the bill. FinOps is the system that keeps that from quietly becoming a crisis.

FinOps has three phases, and they're iterative rather than sequential:

1. **Inform** — visibility. You can't optimize what you can't see. Tag every resource, break down spend by team/service/environment, and get reports people actually read.
2. **Optimize** — cut waste, rightsize, commit to savings plans, lifecycle cold data, kill idle dev environments.
3. **Operate** — policy, automation, continuous improvement. Budgets, anomaly detection, cost gates in CI.

Most companies live in Inform forever because Optimize requires engineering attention that's always lower priority than shipping features. That's the trap — you find that you've silently spent $800k a year on orphaned resources for three years running.

## Where the Cloud Bill Actually Goes

For a typical SaaS workload on AWS/GCP/Azure, spend breaks down roughly as follows. Your numbers will differ — this is a rough calibration:

- **Compute (EC2, GKE, Azure VMs)**: 40–60%.
- **Storage (S3, EBS, snapshots)**: 10–20%.
- **Data transfer / egress**: 5–15%. Often the biggest surprise.
- **Managed-services premium (RDS/Aurora, MSK, OpenSearch)**: 10–25%. Usually 2–3× self-hosted compute equivalent.
- **Observability (Datadog, Splunk, New Relic)**: commonly 5–15%, occasionally >20% for log-heavy applications.

The *surprises* — the items that show up on your quarterly review as "where did that come from?" — hide in predictable places:

- **Idle dev/staging environments** running 24/7 when they should be scaled to zero overnight.
- **Orphaned EBS volumes and snapshots** from deleted instances.
- **Cross-AZ traffic** at $0.01–0.02/GB in each direction. Feels free until you move a chatty service.
- **NAT Gateway** processing charges ($0.045/GB on AWS), especially for traffic to S3 that could be going through a VPC endpoint for free.
- **Verbose DEBUG logs** shipped to a log SaaS at $2/GB ingested.
- **Inter-region replication** defaults on S3 or databases that were enabled "just in case" and never turned off.

Learn where your company's surprises live. The first FinOps sprint at any company typically reclaims 15–25% of cloud spend *just by cleaning up waste* — no rightsizing, no architectural changes, no negotiation with vendors.

## Optimization Levers: Real vs Theater

Not all cost work is equally valuable. Some levers move the bill meaningfully; others are theater that consumes engineering time without changing much. A rough calibration:

| Lever | Effort | Typical impact | Verdict |
|---|---|---|---|
| Rightsize over-provisioned compute | Low | 15–30% of compute | Real |
| Savings Plans / Reserved Instances (1–3yr commit) | Low (financial) | 20–50% on covered workloads | Real |
| Spot / preemptible for stateless batch | Medium | 60–90% on that workload | Real |
| Autoscaling and scale-to-zero dev envs | Medium | 20–40% of non-prod | Real |
| S3 lifecycle to Infrequent Access / Glacier | Low | 50–80% on cold data | Real |
| Rewriting hot services in Rust/Go | High | 20–60% per service | Real but slow ROI |
| Multi-region active-active "for resilience" | High | Typically *costs* 1.5–2× | Usually theater unless the business model requires it |
| Chasing workloads under 1% of the bill | High | <5% | Theater |

The discipline is not "do all the optimizations." It's *"do the ones with a real ratio of engineer-hours to dollars returned, and stop."* A good FinOps engineer will tell you that their highest-leverage week is usually the one they spend convincing people *not* to do optimizations that won't pay back.

## Observability Is a Prerequisite for Cost

You can't optimize spend you can't attribute. Tag every resource with `team`, `service`, `env`, and (for multi-tenant SaaS) `customer-tier` from day one. Retrofitting tags across thousands of resources is a brutal project that usually stalls out.

Two organizational models for cost accountability:

- **Showback** — teams see their costs in a dashboard. Creates awareness, no consequences.
- **Chargeback** — teams' budgets are actually debited for their spend. Creates accountability, creates politics.

Most mid-size companies land on showback with occasional "why is your line going up?" conversations in leadership reviews. Chargeback is more common in larger orgs and enterprises.

**Cost-per-tenant dashboards** are the most valuable artifact most multi-tenant SaaS companies could build and often don't. They reveal unprofitable customers, inform pricing discussions, feed directly into gross-margin analysis from the previous chapter, and make the "should we offer an enterprise tier?" question answerable in data rather than gut.

## Dev Velocity as a Cost

The cloud bill is visible. The engineer cost is usually 5–10× larger and mostly invisible.

Back-of-napkin numbers for the US market in 2024: a fully-loaded senior engineer costs the company roughly $250k to $350k/year (salary × ~1.4 for benefits, equity, overhead, management). A Bay Area staff engineer can be $400k or more. Offshore and APAC talent comes in at roughly $60k to $120k fully loaded. These numbers aren't secret — they're roughly "salary on Levels.fyi × 1.4."

Which means:

> One week of a US senior engineer's time ≈ $5k to $7k.
> A six-engineer, six-month project that ships nothing ≈ **$750k to $1M**.

Engineers, collectively, are the most expensive resource at most software companies. More expensive than the cloud bill at most companies under $200M ARR. A two-week detour on a cleanup task that should have been three days is a $10k decision made without anyone noticing.

This reframes a lot of conversations:

- "Spending two weeks vs one week on this refactor" is a $10k decision about whether the extra polish pays for itself in future velocity.
- "Keeping this flaky legacy system running instead of replacing it" is a question about whether the migration cost (weeks of senior time) is lower than the integral of future maintenance pain.
- "Writing a custom library instead of using the open-source one" is a bet that the custom version's long-term maintenance cost is less than the vendor alternative.

## Tech Debt as Interest

Ward Cunningham's original metaphor is precise, and worth reading in the original: *shipping fast is a loan; unrefactored code is the principal; future slowdown is the interest.* Like real interest, it compounds, and most teams pay it month after month without realizing.

Martin Fowler's follow-up, the **Technical Debt Quadrant**, divides debt into four kinds by intent and prudence (deliberate/inadvertent × prudent/reckless). The useful bit for this chapter: *prudent-deliberate debt* — "we know this is wrong but we need to ship by Friday" — is a legitimate business trade-off. Make it explicitly, write it down, and plan the refinancing. *Inadvertent-reckless debt* ("we didn't know what we were doing") is the kind that silently eats your velocity and has no clear pay-down plan.

The senior engineer's job is, in large part, to keep this ledger visible. If your team is carrying $500k of interest-equivalent debt as a slowdown tax — roughly one senior engineer's entire year burned on working around the mess — *someone* should know.

## Opportunity Cost: The Real Constraint

At most companies under a few billion in revenue, the scarcest resource isn't cash or compute. It's engineer-hours. Every "nice to have" refactor is a feature X not shipped, and the cost isn't zero — it's the expected revenue, retention, or competitive advantage of feature X.

This creates a specific senior-IC responsibility: *defending the roadmap from low-ROI work, including your own*. Pet projects, speculative platforms, gold-plating — these all feel productive but consume the most expensive resource in the company.

The cost of a bad "yes" is invisible: the thing you chose not to do instead. The cost of a "no" is visible and loud. That asymmetry is why most orgs systematically over-commit.

One senior engineer who can say "no, this isn't worth what it will cost" — with actual numbers — is worth more to the business than three who can't. That engineer does not get thanked for the projects they killed. The projects that shipped instead are the ones that get the credit.

## Build vs Buy: The Decision Framework

"Should we build this or buy it?" is probably the most common senior-level technical decision, and most teams are bad at it. A compressed decision rule:

**Buy when:**
- It's a commodity capability (auth, payments, email, observability, basic analytics).
- Time-to-market matters more than per-unit margin.
- The compliance/security burden is heavy (SOC2, HIPAA, PCI) and a vendor absorbs the audit cost.
- Your team lacks deep expertise in the problem domain.

**Build when:**
- It's your core differentiator — the thing customers pay you for.
- Vendor economics break at your scale (classic examples: Segment at 100M MAU, Datadog past $5M/year).
- Vendor lock-in would be existential.
- Data sovereignty, latency, or regulatory constraints genuinely require it.

**Common mistakes:**

- *"We can build it in a weekend."* You can't. Build cost is a small fraction of total cost of ownership; maintenance is 5–10× build.
- *Buying without an exit plan.* Every vendor is a future migration project.
- *Building commodity* (yet another internal auth system, yet another admin dashboard framework) *out of NIH.* You're paying the most expensive engineers in the company to reinvent a solved problem.
- *Not re-evaluating as the business scales.* What was correct to buy at 10 customers may be correct to build at 10,000. And vice versa.

Gregor Hohpe's expansion — **build vs buy vs rent** — adds a third option: SaaS is rent, not buy, and should be evaluated on ongoing terms rather than one-time "did we own it?" Martin Fowler's *Utility vs Strategic Dichotomy* is the same idea from a different angle: *buy utility, build strategic.* You'll notice senior engineers making these decisions quickly because they've internalized the rule; what looks like intuition is a compressed version of this framework.

## The Cost Instinct

Costs live in four places — cloud, engineer-time, opportunity, and debt. Senior engineers develop an instinct for weighing all four at once. A technically correct migration that costs $200k in engineer time to save $30k in cloud spend is a bad trade. A "hacky" shortcut that ships a feature three months earlier and captures a contract worth $2M ARR is a great trade that can be refactored later.

The skill is not to optimize any one of these in isolation. It's to notice which one is binding for the decision in front of you, and act accordingly.

---
*Next in the series: why "technical" failures are almost always stakeholder-management failures in disguise — and the frameworks for doing this part deliberately.*
