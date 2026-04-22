---
title: "Shadow Launch and Canary Release"
order: 5
tags: ["product-discovery", "canary-release", "shadow-launch", "progressive-delivery", "sre"]
date: "2026-04-22"
draft: false
---

Feature flags get you the ability to *hide* new code. What you do with that ability determines whether discovery is safe or merely reckless-in-theory.

This chapter covers the two most common rollout patterns that sit on top of flag infrastructure — **shadow launch** and **canary release** — along with their less-discussed prerequisites. Engineers routinely confuse the two, which isn't surprising because they sound similar and both involve "gradually rolling out a change." They're different tools for different problems, and picking the wrong one produces either false confidence or actual incidents.

## The Three Patterns, Clearly Separated

**Shadow launch** (also called **dark launch**). New code runs in production *alongside* the old code. Real traffic exercises both paths. Results from the new path are captured for analysis but are **not returned to the user**. Used for validating heavy backend changes — a new search ranker, a migrated payments service, a refactored auth stack — where correctness matters more than user experience and the user-facing response needs to remain stable.

**Canary release.** A small percentage of real user traffic is routed to the new code. The user *does* see the new response. Metrics are watched; if they degrade, the rollout halts or rolls back. Used for progressively exposing user-facing changes to a growing fraction of the population.

**Blue-green deployment.** Two identical production environments (blue and green). One serves all traffic; the other is the next version, warm and ready. Traffic cuts over atomically. Martin Fowler's short piece (2010) remains the canonical reference. Adjacent to the others — a binary cutover rather than a gradual rollout.

These aren't mutually exclusive. A mature release often uses all three: shadow launch during the build phase to validate behavior, blue-green for the deployment mechanics, canary for the user-facing rollout.

## Shadow Launch: The Mechanics

The core pattern is *dual-path execution*. At a service-mesh or proxy layer, each request is fanned out to both the old service and the new one. The old service's response goes back to the user; the new service's response is captured, compared, and discarded. Envoy has this built in via `request_mirror_policies`; Istio's `VirtualService` has a `mirror` field. Service-level implementations use libraries like **GitHub's Scientist** (github.com/github/scientist), originally a Ruby library and now ported to most languages — it runs both the old and new code paths in-process and reports discrepancies.

The canonical example is the 2008 Facebook Chat dark launch: the server-side infrastructure was exercised under real load for weeks before any user saw a chat client. Google's search-ranker updates are shadow-launched as a routine. YouTube's recommendation algorithm. Stripe's 2017 "Online migrations at scale" post walks through their shadow-migration pattern in detail, which is worth reading as a concrete case study.

**Costs of shadow launching:**

- **Double the compute.** You're serving 2× traffic on every shadowed request. For expensive paths, this is a real expense.
- **Write-path complications.** If the new path does writes (creates a record, charges a card, sends an email), the shadow will duplicate side effects. You cannot safely shadow-launch a write path without one of: routing shadow writes to a sandbox database, using idempotency keys so duplicate writes are harmless, or simply restricting shadow to read paths.
- **State drift.** If the new service caches differently, or has a slightly different view of data, the "comparison" of outputs isn't apples-to-apples. You'll see spurious diffs that look like correctness bugs but are just state mismatches.

Shadow launching is a specialist tool. It is the right answer for migrations of critical infrastructure where the cost of a user-visible bug is high and the cost of shadow runtime is affordable. It is the wrong answer for routine feature rollouts, which the canary pattern handles more cheaply.

## Canary Release: The Mechanics

Canary release is the progressive-rollout pattern. A standard ladder:

- **0.1%** of traffic
- **1%**
- **5%**
- **25%**
- **50%**
- **100%**

Between each step, a health gate runs. The gate checks that error rate, latency, and business KPIs on the canary cohort don't deviate meaningfully from the baseline cohort. If they do, the rollout either pauses (for investigation) or rolls back automatically.

The Google SRE practice formalizes this. The SRE book's chapter on release engineering and the *Site Reliability Workbook* chapter on canarying releases are the canonical references — the framing is that a canary is a **hypothesis test**: the hypothesis is *the new version performs no worse than the old one on the metrics I've chosen*, and the canary gates are the statistical acceptance criteria.

**Tools:**

- **Argo Rollouts** (Kubernetes-native) — supports blue-green, canary, and analysis templates.
- **Flagger** (Weaveworks/Flux) — canary automation on top of Istio, Linkerd, App Mesh, NGINX, or Gloo.
- **Netflix Kayenta** (in Spinnaker) — automated canary analysis; judges statistical significance of metric deltas between baseline and canary pods. Netflix's original tech-blog post on Kayenta is worth reading.
- **AWS CodeDeploy** has linear and canary deployment configurations out of the box.
- **GCP Cloud Deploy**, **Azure Deployment Slots** — same pattern at the cloud-provider level.

## The Progressive-Delivery Spectrum

James Governor (RedMonk) coined **"Progressive Delivery"** in 2018 as an umbrella term for the spectrum of techniques between "deploy to everyone at once" and "roll out to a single user." The spectrum:

- **Blue-green** — binary. All or nothing, but atomic and safe.
- **Canary** — percentage-based. Progressive by traffic fraction.
- **Feature-flagged rollout** — per-user or per-segment. Progressive by user identity.

The patterns compose. A sophisticated rollout might deploy via blue-green (for infrastructure atomicity), serve a canary from the green environment (for progressive traffic exposure), and further gate the feature itself behind a user-targeted flag (for explicit segment control). Each layer offers a different kind of protection.

## Observability Prerequisites

Neither pattern works without observability designed for it. Retrofitting observability *after* a canary rollback is a memorable, unpleasant experience. The requirements:

- **Per-variant metrics.** Every metric tagged with `version`, `deployment_id`, and whatever identifies the canary cohort. Without this, you can't tell whether error rate went up "in general" or "on the canary."
- **Per-user stickiness.** A single user hashed to the canary should keep seeing the canary for the duration of their session. Flipping mid-session is how users end up in weird half-states where half the UI is old and half is new.
- **SLO-based gates, not raw thresholds.** The Google SRE Workbook's chapter on SLO implementation argues for burn-rate alerts (fast and slow windows) rather than static metric thresholds. Raw thresholds either fire constantly during normal variance or miss real regressions. SLO-based gates are calibrated to what the business has actually committed to.
- **Correctness gates, not just error rates.** A service returning 200 OK with a wrong response body will pass every standard gate. The Scientist-style diff pattern, or downstream business-KPI monitoring (signups per minute, payment success rate), catches correctness issues that error-rate gates miss.

## Pitfalls to Recognize

The specific ways these patterns fail in practice:

**Undersized canary.** A 0.1% canary on 10 requests per second is one request per second on the canary. A bug that fires once per ten thousand requests takes about three hours to appear on that canary at all. Sizing by user percentage looks right and is dimensionally wrong — you want to size by **expected requests per unit time on the rare path you care about**.

**Non-representative traffic.** A canary limited to a single region misses bugs specific to another region — locale differences, timezone-sensitive logic, latency-sensitive timeouts. Either rotate the canary across regions or run multiple regional canaries.

**Metric-only gates that miss silent failures.** Error rate is green; latency is green; the response body is wrong. Your gates pass, users suffer. Defense: diff-based gates (Scientist), downstream business-metric monitoring, or both.

**Shadow on write paths without idempotency.** Duplicate charges, duplicate emails, duplicate notifications. Before shadowing a write path, either route shadow writes to a sandbox or make writes idempotent.

**Rollback is slower than you think.** Rolling back a binary is fast. Rolling back a database migration is often *not a thing you can do*. The expand/contract migration pattern — add columns, dual-write, stop reading old columns, remove old columns — preserves rollback safety at the cost of operational complexity. Tools like **gh-ost** (github.com/github/gh-ost) and **Vitess vreplication** handle the mechanics; the discipline is what keeps you from shipping a destructive migration that traps you into forward-only.

**Config drift between canary and prod.** Canary runs the new binary with the old config, or vice versa, and you end up testing a configuration that no real deploy will actually run. Ship config through the same promotion pipeline as code.

## Choosing Between Them

A compressed decision rule:

- **User-facing change, reversible, want real metrics?** Canary.
- **Heavy infrastructure migration, correctness-critical, high cost of a user-visible bug?** Shadow launch first, then canary on the cutover.
- **Atomic-cutover requirement (schema, auth, security-critical)?** Blue-green, possibly with canary on top.
- **Need per-user or per-segment control?** Feature flags — chapter 4. Canary handles traffic percentages; flags handle identity-based rollout.

Most senior engineers develop a mental checklist: *what's the blast radius if this breaks? what's the signal needed to detect it? what's the fastest path to rollback?* The answers to those three determine which rollout pattern the situation wants.

## The Senior-Engineer Responsibility

Rollout decisions are where engineering judgment most directly serves discovery. A 1% canary that catches a P0 regression on hour three is the difference between an uneventful afternoon and a public incident. A shadow launch that runs for two weeks before the user-visible cutover is the difference between a clean migration and a postmortem.

The mechanics are learnable in a week. The judgment — which pattern fits which change, how long to hold at each step, what gates are real and which are theater — is a senior-level skill. It's learned by reading the two Google SRE books, practicing with small rollouts, and paying close attention to the times the canary saved you.

---
*Next in the series: the other side of progressive rollout — how to decide when a feature has had its chance and should be killed, and how to do that without three months of organizational detritus.*
