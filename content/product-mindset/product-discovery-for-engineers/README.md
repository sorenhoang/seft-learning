---
title: "Product Discovery for Engineers"
tags: ["product-discovery", "experimentation", "ab-testing", "feature-flags", "progressive-delivery", "user-research", "engineering-leadership"]
description: "A working engineer's guide to product discovery — user interviews, data-informed decisions, A/B testing, feature flags, shadow and canary launches, and kill criteria. The practices that turn engineers into builders of the right thing."
date: "2026-04-22"
draft: false
---

## Introduction

"Discovery" is the product word for *figuring out what to build*. For a long time this was seen as the PM's job, with engineers downstream — receiving specs, estimating them, and delivering. That model produces a lot of shipped software that nobody uses.

The modern version is different. Discovery is a team sport, and the best engineering decisions get made when engineers participate directly — not as consumers of research summaries, but as first-class discovery participants. Teresa Torres's *"product trio"* (PM + designer + engineer jointly doing discovery) is no longer a fringe idea; it's table stakes at companies like Netflix, Stripe, Airbnb, and Atlassian.

This series is the practitioner's guide for engineers who want to show up to that work credibly. It covers both halves: the **human half** (talking to users, interpreting behavior, making judgment calls) and the **systems half** (flags, experiments, rollout patterns, kill criteria) that an engineer owns more directly than anyone else.

## Why This Matters for Engineers

Three forces have shifted discovery into the engineering seat:

- **Continuous delivery** made every deploy a potential experiment. Engineers control the pipeline; they control discovery velocity.
- **Feature flags and progressive delivery** let engineers ship, roll out, and roll back independently of release cycles. The person who wrote the flag config is often the person who knows when to turn it on.
- **Quantitative experimentation** moved from a specialized analytics team to a self-service platform. Most mid-size companies now expect any PM-engineer pair to be able to run an A/B test without a data scientist in the loop.

Combined, this means the most consequential discovery decisions — *should we ship this at all?*, *should this be a 1% rollout or a 50% rollout?*, *is this feature working?* — are often made by senior engineers with a PM nearby, not the other way around. The engineers who are good at it have an outsized impact on what ships.

## The Shape of the Series

Six chapters, organized from qualitative to quantitative to operational:

1. **User Interviews Through an Engineer's Lens** — why engineers belong in interviews, what to ask and what to avoid, and how to build a discovery cadence without a full-time research org.
2. **Data-Informed vs. Data-Driven Decisions** — the distinction that matters, when data should decide and when it shouldn't, and how to write a decision memo that earns respect.
3. **A/B Testing: Design, Analysis, and Pitfalls** — hypothesis format, power analysis, stopping rules, and the twelve ways experiments quietly lie to you.
4. **Feature Flags as a Discovery Tool** — Pete Hodgson's taxonomy, the deploy/release split, progressive rollout, and the flag-hygiene problem nobody talks about.
5. **Shadow Launch and Canary Release** — what each actually means, when to use which, and the observability prerequisites that separate a real canary from theater.
6. **Kill Criteria: When to Kill a Feature** — why killing is hard, how to write kill criteria before launch, the zombie-feature trap, and a sunset playbook.

## How to Read It

Chapters build on each other loosely. If you're new to discovery, read in order — the qualitative chapters (1, 2) set up vocabulary the quantitative ones (3) will later interrogate. If you're a practiced experimenter but have never sat on a customer call, jump to chapter 1; you're missing the half that generates the hypotheses worth testing.

The goal is not to turn you into a product manager. It's to make you the kind of engineer who can walk into any discovery conversation and be the most useful person in the room — because you understand the code, the users, the experiment, and the rollout all at once, and most people in that room only understand one of those four.

---
*Next in the series: why engineers who participate directly in user interviews build better software — and how to start, even if your company has no "research team."*
