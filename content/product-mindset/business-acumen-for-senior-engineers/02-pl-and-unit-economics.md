---
title: "Reading a P&L and Unit Economics"
order: 2
tags: ["business-acumen", "finance-for-engineers", "p-and-l", "unit-economics", "saas-metrics"]
date: "2026-04-22"
draft: false
---

A P&L is the single most important artifact in your company that you've probably never read. It's where your salary is paid from, where your cloud bill shows up, where the CFO's anxieties live, and where every conversation about "can we afford this project" ultimately terminates. This chapter is the minimum viable literacy to sit in those conversations without bluffing.

It assumes no finance background. By the end you should be able to read your company's P&L, identify where engineering shows up on it, and translate a technical project into the one or two lines of it that the project will actually move.

## The Three Financial Statements

Every company produces three standard financial reports. You only need to care deeply about one of them, but you should know what all three are.

**Profit & Loss (P&L), also called the Income Statement.** Revenue minus expenses over a period (a quarter, a year). Answers "did we make money?" This is the one that every engineer's decisions eventually land on, because R&D salaries and cloud spend show up as line items here.

**Balance Sheet.** A snapshot at a single point in time of *assets*, *liabilities*, and *equity*. Answers "what do we own, what do we owe?" For SaaS, the two quirks to know are *deferred revenue* (customers prepaid annually but you haven't earned it yet — it's a liability until you deliver the service) and *capitalized software* (some engineering work is treated as an asset here, not an expense).

**Cash Flow Statement.** Actual cash in and out across operating, investing, and financing activities. Answers "are we solvent?" A company can be P&L-profitable and cash-insolvent at the same time, which is common in subscription businesses that collect annual contracts in advance.

For the rest of this chapter, we'll focus on the P&L.

## The Shape of a SaaS P&L

Top-to-bottom, a modern SaaS P&L reads roughly like this:

```
Revenue                           100%
  - Cost of Goods Sold (COGS)      25-30%
= Gross Profit                     70-75%
  - Research & Development (R&D)   20-25%
  - Sales & Marketing (S&M)        30-45%
  - General & Administrative (G&A) 10-15%
= Operating Income                 -20% to +20%
  - Taxes, interest, etc.
= Net Income
```

Those percentages are drawn from public-SaaS medians in 2024 (OpenView, Bessemer, KeyBanc surveys). Growth-stage companies run operating income negative on purpose; mature SaaS targets 15–25% operating margin.

A few things worth internalizing:

- **Gross margin** is revenue minus COGS. For a healthy SaaS company it sits at 70–80%. If your company's gross margin is 50%, you're closer to a hosting company than a software company — and that shapes every other conversation you'll have.
- **S&M is the largest single line item** at most SaaS companies, not engineering. If you're wondering "why don't we have more headcount" the answer often is *because the company is spending it to acquire customers*.
- The **Rule of 40** is the most-cited SaaS health metric: growth rate (%) + free-cash-flow margin (%) should add to at least 40. Top-quartile public SaaS exceeds 40; the median in 2024 was around 27. Useful as a sanity check when your exec team is arguing about whether to hire vs. cut.

## Where Engineering Shows Up

Your work lands in two places on this statement, and the split matters.

**R&D (operating expense).** Most engineering salaries, benefits, tooling, CI, dev/staging environments, internal platforms. This is where "engineer cost" lives.

**COGS (cost of goods sold).** The infrastructure and services required to *deliver the product to the customer*. Production hosting, third-party APIs metered per customer (Twilio, Stripe fees), payment processing, customer support, and the fraction of SRE/DevOps headcount that keeps prod running.

The line between them matters because **COGS directly determines gross margin**, which is the number investors fixate on. A decision to move a heavy workload from on-prem to AWS without consolidation can quietly shift your company from 78% gross margin to 68% — and nobody in engineering will notice, but every investor will.

There's also a small but real third category: **capitalized software**. Under US GAAP (ASC 350-40 for internal-use software), some engineering costs during the "application development stage" can be capitalized — treated as an asset on the balance sheet and amortized over time, rather than expensed immediately. Most early-stage SaaS companies expense aggressively because it's simpler; some larger companies (Salesforce, ServiceNow) capitalize more. It's a CFO policy choice with a material effect on reported earnings. You don't need to choose; you just need to know it's a lever.

## Unit Economics: The Four Numbers You Must Know

Company-level financials tell you whether the business works in aggregate. **Unit economics** tell you whether it works *per customer* — which is where engineering decisions usually show up.

**CAC — Customer Acquisition Cost.** Fully-loaded sales and marketing spend divided by new customers acquired in the period. This is what it cost to land the last customer who signed.

**LTV — Lifetime Value.** Average revenue per account × gross margin ÷ churn rate. How much net margin you expect to collect from a customer across their lifetime with you.

**LTV / CAC Ratio.** The canonical unit-economics health check.

- 3:1 is the rule-of-thumb healthy.
- Under 1:1 is broken — you're paying more to acquire customers than you'll ever earn back.
- Over 5:1 can mean you're *underinvesting* in growth; you have headroom to spend more on acquisition.

**CAC Payback Period.** CAC ÷ (ARPA × gross margin), expressed in months. How long before a new customer pays back what it cost to acquire them.

- Under 12 months: elite.
- 12–18 months: healthy.
- 24+ months: concerning, usually means the company needs a lot of external capital.

## The Retention Metrics

Everything above assumes customers stick around. Two metrics measure that.

**Gross Revenue Retention (GRR)** is the percentage of revenue you keep from a cohort of existing customers, *excluding* upsell. It's capped at 100%. Anything below 90% suggests a product-market-fit problem — the product isn't delivering enough value to justify renewing.

**Net Revenue Retention (NRR)** is GRR *plus* expansion revenue from that same cohort (upsells, seat growth, usage increases). It can exceed 100% — in fact, **110%+ NRR is best-in-class SaaS, and 120%+ is elite**. Snowflake famously ran at ~170% at its peak, meaning the average existing customer was spending 70% more year-over-year without any new logos.

For an engineer, NRR is the single most useful metric to keep in mind. It rewards you for shipping things that existing customers use more of — which is often exactly what your architectural work enables. "This feature lets enterprise customers expand from 50 to 500 seats" is an NRR conversation, and NRR conversations get funded.

## What Engineering Actually Moves

You'll hear finance and product talk about all of these metrics. Your job isn't to own them; it's to know which ones your work lands on. The short version:

| Engineering lever | Metric it moves |
|---|---|
| Hosting cost per user | Gross margin |
| Uptime / reliability | Churn → GRR, NRR |
| Time-to-first-value (activation) | CAC payback, conversion |
| Performance on high-value workflows | NRR, expansion |
| Build-vs-buy for infra | COGS/R&D split, gross margin |
| Feature velocity on retention drivers | NRR |

Most refactors land nowhere on this table. That's not an indictment — refactors are a cost you pay for future velocity on things that will land on the table. But when you're making the case for a refactor, your job is to explain *which* future item and *which* metric it unlocks, not to argue that "cleaner code is better." The CFO agrees that cleaner code is better and also does not care.

## The Common Traps

A few mistakes that will get you caught out in your first few meetings:

**Conflating revenue with profit.** A $100M ARR company can be burning $80M/year. Revenue is not cash; cash is not profit.

**Ignoring deferred revenue.** If the company sells annual contracts prepaid, a $12M new-logo deal hits the cash statement immediately but is recognized as revenue at $1M/month over the year. You'll see a big "deferred revenue" liability on the balance sheet and it is entirely healthy.

**Confusing bookings, revenue, and cash.** A three-year prepaid contract is one *booking*, 36 months of *revenue*, and one *cash* event. Finance people are careful about this distinction. When you say "we did $20M last quarter," be sure you know which of the three you mean.

**Treating ARR as GAAP.** ARR (Annual Recurring Revenue) is a *metric*, not a GAAP reporting line. It's useful for intuition and every investor looks at it, but it's not what gets audited.

## The 15-Minute Exercise

If your company is public, its P&L is a web search away — look at its most recent 10-Q or 10-K filing. If it isn't, you likely have access to an internal "metrics review" or "business review" slide deck that contains most of the same numbers.

Spend fifteen minutes finding:

1. Gross margin (revenue minus COGS, as a percent).
2. R&D as a percent of revenue.
3. S&M as a percent of revenue.
4. The most recent NRR number, if it's shared.
5. Whether the company is operating-income-positive.

These five numbers tell you more about what's actually constraining your roadmap than anything you'll hear in a team meeting. The next chapter builds on them — we'll look at how the *shape* of the business model itself determines what "good architecture" even means.

---
*Next in the series: Why a SaaS architecture, a marketplace architecture, and an ad-platform architecture are fundamentally different shapes — and how the business model is the thing dictating that shape.*
