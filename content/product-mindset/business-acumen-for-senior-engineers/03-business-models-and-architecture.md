---
title: "Business Models and Their Architectural Consequences"
order: 3
tags: ["business-acumen", "business-models", "software-architecture", "multi-tenancy", "system-design"]
date: "2026-04-22"
draft: false
---

Architecture follows business model. That sentence sounds obvious until you realize how often it's violated — teams building SaaS architectures for marketplace companies, ad-grade performance requirements on internal B2B tools, or enterprise-deployable systems for companies that will never ship on-prem.

This chapter is a compressed tour of the dominant software business models and the architectural pressure point each one creates. The goal is not to teach you how to build any of them. It's to give you a fast way to recognize *which* shape you're actually building for, so you stop borrowing constraints from the wrong one.

## A Short Taxonomy

Most modern software companies fit into one of these business-model archetypes. Many fit into two or three — but there's usually a dominant one that drives the system.

- **B2B SaaS** — monthly or annual subscriptions, priced per seat or by usage. Salesforce, Slack, Notion, Datadog.
- **B2C subscription** — individual users pay monthly. Netflix, Spotify, Apple TV+.
- **Marketplace / two-sided** — matches buyers and sellers and takes a cut. Uber, Airbnb, eBay, DoorDash.
- **Advertising-supported** — users are free; advertisers pay for attention. Google, Meta, TikTok.
- **Freemium → paid** — free tier for most users; paid tiers unlock capacity or features. Zoom, Dropbox, Slack, Figma.
- **Enterprise / on-prem licensed** — customers install the software on their own infrastructure. Still common in banking, defense, healthcare.
- **Open-source + commercial** — the core is open-source; you sell the enterprise edition, managed cloud version, or support. GitLab, Elastic, Confluent, HashiCorp.
- **Fintech / payments** — moves money; revenue from interchange, spread, or per-transaction fees. Stripe, Adyen, Square.
- **Transactional / per-call API** — priced per API call or per message. Twilio, SendGrid, OpenAI.

## The Architectural Pressure Point

Each of these models creates one or two architectural concerns that dominate everything else. The rest is ordinary engineering. Internalizing these is how you recognize, quickly, whether a proposal makes sense for your model.

**B2B SaaS.** The defining choice is *multi-tenancy model* — how customer data and compute are isolated. For usage-based pricing, you also need a real metering pipeline as a first-class service (event ingestion → aggregation → rating → invoicing), with idempotency on every meter event. Stripe's metering architecture is the reference here.

**B2C subscription.** Content delivery dominates cost and performance. Netflix pushes ~95% of its streaming traffic through Open Connect appliances embedded at ISPs — the architecture is less about servers and more about logistics. Personalization/recommendation is the moat; the stream itself is a commodity.

**Marketplace.** The cold-start problem is bilateral (you need both supply and demand) and never fully solved. Architecturally: a *matching engine*, a *trust and safety system*, a *double-entry ledger*, a *payout scheduler*, and — critically — *dispute workflows* as first-class infrastructure. Disputes are ~1–5% of transactions across most marketplaces; treating them as edge cases is the most common architectural misread of the model.

**Advertising.** Two very different systems coexisting. The **read path** — real-time bidding — is sub-100ms latency or you lose the auction (OpenRTB spec mandates ~100ms bid response). The **write path** — attribution, reporting — is petabyte-scale event ingestion where throughput matters more than latency. Don't try to build one system that does both.

**Freemium → paid.** The conversion funnel *is* the architecture. You need a real **entitlements service** (not feature flags hardcoded in the app), conversion-event telemetry with attribution back to the free signup, and serious defense against free-tier abuse (signup-velocity limits, device fingerprinting, email reputation). The free tier's economics must not dominate — if a heavy free user costs more to serve than the average paid user brings in, the model breaks.

**Enterprise / on-prem.** *Deployability is a product feature.* Helm charts, air-gapped install support, release-branch backports, and 18–24-month LTS policies are all core to the product. Customers control their own cadence, so you must support significant version skew. You also don't get to iterate on production — every release cycle takes months.

**Open-source + commercial.** The **open-core boundary** is enforced in the codebase itself — GitLab's explicit EE/CE directory split is the clearest example. Your monetization model is visible as a line through the repo, and license-compliance tooling has to enforce it. Architectural decisions are also community decisions; a controversial change can bleed into a Hacker News thread and user revolt.

**Fintech / payments.** **Idempotency + double-entry ledger + PCI-DSS scope minimization + reconciliation pipelines** are the architecture. Every state change is an append-only event (never an update). Idempotency keys have defined TTL semantics (Stripe's is 24 hours). Reconciliation runs daily and discrepancies are production incidents.

**Transactional API.** **Per-request metering + rate limiting + quota enforcement at the edge** — because billing *is* the product. A missed bill is literal revenue leakage. You also need a durable async queue for delivery attempts, retries with exponential backoff, and dead-letter handling, because the product's reliability contract extends into your customers' systems.

## The Multi-Tenancy Trilemma

If you're at a B2B SaaS company, this is probably the highest-stakes architectural choice your company will make, and it's worth naming explicitly. AWS SaaS Factory formalized three patterns:

**Pool (shared everything).** All tenants share the same database, application tier, and infrastructure. Tenant isolation is a `tenant_id` column on every table, enforced at the query layer (ideally row-level security at the DB layer). Cheapest per-tenant; best gross margin; noisy-neighbor risk; blast-radius concerns (one bad query hits everyone); hardest to meet regulated customers' isolation requirements.

**Silo (dedicated everything).** Each tenant gets its own database, often its own application-tier deployment, sometimes its own cloud account. Expensive per-tenant; slow to provision (minutes to hours); compliance-clean (easy to meet HIPAA, FedRAMP, specific regional data-residency rules); blast-radius is one tenant. Typical for large enterprise customers.

**Bridge (hybrid).** Shared application tier, isolated data tier. Most SaaS companies end up here — shared for the default experience, with a "Premium" or "Enterprise" SKU that actually moves your data into a siloed deployment. Good middle ground; adds operational complexity (two code paths for provisioning, backup, recovery).

Picking one is a business-model decision, not a purely technical one. If your pricing page offers a $49/month self-serve tier, you're in *pool* territory — silo's per-tenant overhead makes the unit economics impossible. If your deals are six-figure annual contracts with a 40-page security addendum, you're probably in *silo* or *bridge*. The model picks the architecture; the architecture doesn't pick the model.

## The Reliability Tier: Business Model Decides

One place where engineers routinely over-build is the reliability target. The industry default assumption is "99.9% is table stakes." It often isn't.

The right SLO is a function of what an outage actually *costs* the business:

- **Trading platforms, payments rails**: 99.99%+ (≤ 52 minutes/year). Outages cost millions per minute in lost transactions and reputational damage.
- **Consumer SaaS**: 99.9% (≤ 8.76 hours/year) is a reasonable default for products people use daily.
- **Internal B2B tools, niche enterprise SaaS**: 99.5% (≤ 43.8 hours/year) is often correct. Customers schedule around outages; there's no revenue leaking per minute.

Google's SRE practice formalizes this as **error budget = 1 − SLO**. If you're not consuming your error budget, you're over-engineering — spending resources on reliability the business doesn't need. Treat *unused* error budget as a signal to ship faster, not a trophy.

Over-engineering reliability is one of the most expensive mistakes an engineering org can make, precisely because it feels virtuous. "We added multi-region active-active for resilience" sounds responsible. For an internal B2B tool with 99.5% as its honest requirement, it is also a decision to roughly double your infrastructure cost for resilience the business will never use.

## Monetization Events Become First-Class Services

How you charge dictates what has to exist in the system. If you take one idea from this chapter, take this one: **the monetization event is usually the most neglected domain in the architecture**, and it's also the one that finance looks at most closely.

- **Per-seat pricing** requires real-time seat-assignment tracking, SCIM/SSO directory sync, and accurate proration when seats are added or removed mid-cycle.
- **Usage-based pricing** requires a durable metering pipeline that ingests events with idempotency keys, aggregates them with support for late-arriving events, applies pricing rules (a rating engine), and emits invoiceable line items.
- **Freemium** requires an entitlements service distinct from feature flags. Feature flags control rollout; entitlements control *what this customer is paying to access right now*. Collapsing the two is a common cause of billing incidents.
- **Marketplace** requires a double-entry ledger, an escrow state machine, a payout scheduler (typically running on daily or weekly cohorts), and 1099 / tax reporting for the supply side.

These are usually not the components senior engineers want to work on. They're also usually the components the CFO understands best, and the ones whose failure triggers the most serious incidents (billing errors are not "retry in 5 minutes" bugs).

## How to Actually Use This

A compressed diagnostic, when you're evaluating a proposal or a new initiative:

1. *What's the dominant business model?* Often the company is a mix, but one model usually drives the architecture.
2. *What's the pressure point that model creates?* (Multi-tenancy model, metering, latency budget, deployability, ledger, etc.)
3. *What's the right reliability tier?* What does an outage actually cost, in dollars per minute or per hour?
4. *What's the monetization event, and does it have a first-class home in the architecture?*
5. *Is the current proposal solving something the model actually demands, or importing constraints from a different model?*

Question 5 is the one senior engineers catch most often. The ad-style latency target on the internal admin tool. The marketplace-grade dispute system on a subscription product that doesn't take refunds. The enterprise-grade on-prem support story on a company that's never sold on-prem and isn't planning to. Every one of these is a technically defensible idea that's solving a problem the business doesn't have.

Match architecture to model. Everything else is details.

---
*Next in the series: why "technical failures" are almost always stakeholder-management failures in disguise — and the frameworks for identifying who actually matters for a decision.*
