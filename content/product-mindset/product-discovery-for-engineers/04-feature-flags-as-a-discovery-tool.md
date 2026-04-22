---
title: "Feature Flags as a Discovery Tool"
order: 4
tags: ["product-discovery", "feature-flags", "feature-toggles", "continuous-delivery", "progressive-delivery"]
date: "2026-04-22"
draft: false
---

Feature flags are the most consequential infrastructure most engineering teams never design deliberately. They start as one-off if-statements to hide unfinished code, they proliferate into the thousands, and a few years in they are the primary tool the team uses to ship, release, experiment, and — supposedly — clean up. The teams that use flags well treat them as a first-class discovery tool. The teams that don't wake up one day to a codebase where no one is sure which of two thousand flags actually matter.

This chapter is how to be in the first group. It starts from the canonical taxonomy, moves through the deploy-release split that makes discovery possible, and spends meaningful time on the hygiene problem that nobody wants to talk about.

## The Foundational Text

The single best reference is **Pete Hodgson's "Feature Toggles (aka Feature Flags)"** on Martin Fowler's site (2017, updated since). It remains the clearest taxonomy and the basis of every serious platform's product model. The shorter canonical framing comes from *Continuous Delivery* by Humble and Farley (2010), which introduced the idea of "branch by abstraction" and laid the groundwork for release toggles as an alternative to long-lived feature branches.

## The Four Kinds of Toggle

Hodgson organizes flags along two axes: **longevity** (short-lived vs long-lived) and **dynamism** (static vs per-request). That produces four archetypes, each with different design requirements. If you can't name which kind a given flag is, you don't understand it yet.

**Release toggles.** Short-lived, mostly static. You ship incomplete code dark, then flip the flag on when you're ready to release. Typical lifetime: days to weeks. Anti-pattern: release toggles that live for months because nobody cleans them up.

**Experiment toggles.** Short-lived, per-request. Route a consistent fraction of traffic to a variant based on a deterministic hash of user ID. The statistical engine in chapter 3 sits on top of this. Lifetime: the duration of the experiment, then they should be retired.

**Ops toggles.** Long-lived, per-request. Kill switches and circuit breakers for rarely-exercised behavior. Netflix's Hystrix is the classic reference — you want to be able to disable an expensive downstream call at 3am when it starts misbehaving. Lifetime: as long as the feature itself.

**Permission toggles.** Long-lived, per-request. Entitlements by user, plan, tier, or cohort. "Only enterprise customers see the SSO flow." "Only beta-opt-in users see the new dashboard." Lifetime: as long as the tiering system exists.

Conflating these is the beginning of trouble. A permission toggle that someone thinks is a release toggle gets scheduled for deletion. A release toggle that someone thinks is a permission toggle never gets deleted. A single team running experiments on top of release toggles gets inconsistent bucket assignment and ships broken data. Name the kind explicitly when you create the flag — most mature flag platforms enforce this at creation time.

## Why Flags Enable Discovery

The single biggest idea in modern release engineering is the **decoupling of deploy from release.** Chuck Rossi's talks about Facebook's release pipeline (roughly 2013–2014 at SRECon and on the Facebook Engineering blog) popularized it for an industry audience. The essential move:

> Shipping code to production and making it visible to users are two separate decisions, governed by two separate mechanisms.

Deploy is the engineer's decision: the code is good, the tests pass, it runs in production. Release is a discovery decision: *now* is the right time for some users to see it. Before flags, those two decisions were coupled — every deploy was a release. With flags, you can ship incomplete features behind a dark toggle, iterate in production with internal users, and choose when to expose the feature based on evidence.

This is why flag infrastructure *is* discovery infrastructure. Without it, discovery is always an async discussion between product and engineering. With it, a single engineer-PM pair can turn on a feature for 1% of users tomorrow and kill it on Friday if it's bad.

## Progressive Rollout: The Pattern

A typical progressive rollout ladder looks like:

- **Internal dogfood.** Employees only. Catches the obvious bugs.
- **1% of users.** External but small; catches most issues that internal dogfood missed.
- **5%.** Larger signal, still contained blast radius.
- **25%.** Meaningful traffic; statistics on business metrics are now usable.
- **50%.** Effectively the experiment phase.
- **100%.** Full rollout. Flag can be retired.

Each step is gated on observability checks: error rate stays below baseline, p99 latency doesn't regress, primary business metric trends match the prediction. If any gate fails, the rollout stops or rolls back. The next chapter covers the infrastructure that automates these gates.

The key thing to internalize: **the same assignment service powers both flags and experiments.** Chapter 3's A/B tests are just flags with statistics attached to the resulting assignment.

## The Hygiene Problem

The dirty secret of mature flag systems: **they accumulate**. LaunchDarkly's 2023 *State of Feature Management* survey reports mature codebases running 100 to 2,000+ active flags, with a median "temporary" flag lifetime exceeding ten months. A Microsoft/Google-adjacent academic study (Rahman, Querel, Rigby et al. 2016) found similar patterns across large enterprise codebases.

Stale flags are not a cosmetic issue. They create real, compounding cost:

- **Dead code paths** nobody reads. The codebase develops branches that haven't been executed in production for years.
- **Test-matrix explosion.** Each flag adds a dimension to the combinatorial space; 20 flags is 1,048,576 possible configurations, and you've tested approximately three of them.
- **Security risk.** A flag that was supposed to be temporary, with a weaker authorization check "while we're testing," becomes a permanent backdoor.
- **Onboarding friction.** New engineers can't tell which paths are live. Every PR review turns into a flag-archaeology session.

## Flag Hygiene Practices That Work

The techniques that successful teams use to keep flag rot at bay are small and boring, which is why most teams skip them:

- **Naming convention.** Something like `{team}_{type}_{name}_{ticket}`. At a glance, a reviewer can tell which team owns the flag, what kind it is, and where its context lives.
- **Expiration date at creation.** Every flag gets an expiration when it's created. When the date arrives, a bot opens a ticket on the owning team to either retire the flag or explicitly renew it. Mature flag platforms enforce this.
- **Owner and purpose in metadata.** Every flag has a single named owner and a one-sentence purpose. No owner, no flag.
- **Quarterly audit cadence.** A standing recurring meeting — 30 minutes — where the team walks through flags older than six months and either retires or justifies each one.
- **Automated stale detection.** Tools like **LaunchDarkly Code References**, **Unleash's Stale Flags** report, and the open-source **Piranha** (Uber, AST-based dead-flag removal at github.com/uber/piranha) find flags that aren't referenced in code anymore and surface them for cleanup.
- **CI checks.** Fail the build if a flag marked as `release` is older than 90 days and still enabled. Creates organizational pressure to clean up without requiring heroics.

None of this is hard. It is, however, the thing that separates a flag system that accelerates discovery from one that silently strangles engineering velocity.

## The Flag-Plus-Experiment Unification

Every major flag platform — LaunchDarkly, Split, Statsig, Eppo, Optimizely — has converged on the same product architecture: **a flag rule is an assignment; attach statistics, and it becomes an experiment.** Single source of truth, no drift between "who saw what" and "what won."

If your team is running flags in one system and experiments in another, you will eventually discover that a user was in the control group for one experiment and the treatment group for a different flag, and the interactions make the result unreadable. Unifying the two is non-negotiable past a certain scale.

## Anti-Patterns

A catalog of patterns that look reasonable and aren't:

**Flag-driven development.** Teams start using flags as a substitute for small, focused pull requests — one long-lived branch accumulating feature work, all hidden behind one flag, merged in occasional "big" releases. This recreates every problem of long-lived branches and adds runtime complexity. Flags are not a branch-management tool.

**Nested flags.** Flag A gates whether flag B is read, which gates flag C. Exponential path explosion; no test covers all combinations; no one understands the whole graph. Keep flag dependencies flat.

**Business logic in flag configs.** A flag whose value is a JSON blob containing pricing rules, region mappings, or timeout values. Configuration has become code — untested, unversioned, and editable from a web console by anyone with the permissions. Keep flags as boolean or short-enum variants; put configurable data somewhere that gets the same review discipline as code.

**Untested combinations.** Treating flag states as inputs to your contract tests means pinning a "release configuration" per environment and running your full suite against it. Most teams only test with all flags off (their dev default) or all flags on (their next-release default), and the middle is a minefield.

**Using ops toggles as release toggles.** Circuit breakers that end up gating feature rollouts, or release toggles that nobody updates because they're being used as kill switches. When the kinds blur, incidents get resolved by disabling the wrong thing.

## What Good Looks Like

A team that uses flags well has these properties:

- Every engineer can ship at any time, behind a flag, without asking permission.
- Every experiment and every rollout uses the same assignment service.
- No flag exists without a named owner, a clear type, and an expiration.
- The quarterly flag audit regularly retires 10 to 20 flags per team.
- The CI pipeline blocks merges that add stale flag references.
- Features in production have an operator-triggered kill switch by default, not as a last resort.

It looks boring. That's the point. The cost of *not* looking boring in this area is a flag archaeology project every time you want to change the product.

---
*Next in the series: once flags are in place, the two most powerful rollout patterns built on top of them — shadow launch for heavy backend changes, canary release for everything else.*
