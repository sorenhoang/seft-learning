---
title: "North Star Metric: What Engineers Should Actually Know"
description: "Engineers who understand their company's North Star Metric make better daily trade-offs, write better instrumentation, and have more productive conversations with their PMs. Here is what it is and why it matters."
tags: ["product-mindset", "metrics", "north-star-metric", "product-thinking", "senior-engineers", "outcome-driven"]
date: "2026-04-22"
draft: false
---

## The Metric Most Engineers Ignore

Your PM probably knows your company's North Star Metric. Your CEO definitely does. Most engineers who are not in leadership do not — or they know the name but have not thought about how it connects to their day-to-day technical decisions.

That disconnect is costly. Engineers who do not understand the North Star Metric make small decisions throughout the day — how to design an API, where to add caching, which edge case to handle now versus defer — without a compass. Some of those decisions compound into technical shapes that optimize for the wrong outcome.

Understanding the NSM does not make engineers into business analysts. It makes engineers who write code in the right direction.

## What a North Star Metric Is

A North Star Metric is the single number that best captures whether the product is delivering value to users. Not a vanity metric (pageviews, app downloads), not a business output metric (revenue, contracts signed), but a *leading indicator* that, when it goes up, signals that users are genuinely getting what the product is meant to give them.

Examples:
- Slack: daily active users sending messages (communication happening)
- Airbnb: nights booked (the core transaction completing)
- Spotify: time spent listening (users engaging with the core value)
- GitHub: pull requests merged (developers doing productive work)
- Figma: weekly active teams collaborating (collaborative design happening)

The common pattern: the NSM measures *user action* that correlates with the value the product promises — not the money the company makes, and not traffic to the website.

Sean Ellis and Andy Johns popularized this framing, but the underlying idea is simple: if you could only track one number to know whether your product is working, what would it be?

## Why This Matters to Engineers

Engineers make dozens of small product decisions every sprint. Most of them feel purely technical. Many are not.

**Performance trade-offs.** When deciding between a solution that is 20% faster but harder to maintain and one that is slower but cleaner, "which users does this latency affect and how often do they hit this path" is a product question. If the critical path for your NSM goes through this endpoint, the performance investment has a clear business case. If it does not, the maintenance cost might not be worth it.

**Scope decisions.** "Should I handle this edge case now or file a ticket?" depends partly on how often the edge case occurs and who it affects. If it occurs on the path that drives your NSM, it is higher priority than it looks.

**API and schema design.** The shape of data models affects what metrics are trackable later. Engineers who design schemas without thinking about observability create situations where the PM cannot tell whether the NSM is moving — and why. Understanding the NSM during schema design means building in the instrumentation that makes the metric meaningful.

**Instrumentation decisions.** Event tracking, logging, analytics — these are often treated as afterthoughts. Engineers who understand what the NSM measures know what to instrument and where. The event that captures "user completed the core action" is more valuable than ten events capturing peripheral interactions.

## The Two Common Mistakes Teams Make With NSM

**Mistake 1: Confusing output metrics with outcome metrics.**

A NSM based on "features shipped" or "tickets closed" measures the team's output, not user value. These are input metrics masquerading as North Stars. Teams that measure output metrics optimize for shipping fast. Sometimes that is fine. But the discipline of the NSM is specifically to pull focus toward *what users get*, not *what the team does*.

If your team's NSM is "deployments per week," ask whether that actually predicts user success. Probably it does not — in isolation, deployment frequency is an engineering health metric, not a product health metric.

**Mistake 2: Tracking the NSM but not the input metrics.**

The NSM alone is a lagging indicator. By the time it moves (or does not), weeks of decisions have already happened. Effective teams track the NSM alongside the *input metrics* that cause it to move.

Amplitude calls this the "metrics tree" or "driver tree": the NSM at the top, with two to five leading indicators beneath it that are more directly controllable. For a growth product, the NSM might be "activated users" with inputs like "users who complete onboarding," "users who invite a second user," and "users who perform the core action in the first session."

Engineers who understand this tree can ask the right question before starting a feature: "Which input metric does this feature target, and what is the expected effect on the NSM?"

## How Engineers Can Use the NSM Daily

**Frame technical debt conversations using the NSM.** "This part of the codebase makes it hard for us to run experiments on the checkout flow, which is the primary path for our NSM" is a more persuasive case for a refactor than "this code is messy." Connect the maintenance work to the business outcome.

**Validate feature priority using the NSM.** When asked to implement something and the connection to the NSM is not obvious, ask about it. "How do we expect this to move [NSM]?" is not a skeptical question — it is a product-minded one. If there is no answer, that is information the team needs.

**Use the NSM to size effort.** A feature on the critical path for the NSM deserves a different investment level than a feature that improves a peripheral flow. "How much should I spend on this?" is partly answered by "how directly does this affect what we are trying to move?"

**Let the NSM guide observability.** When adding logging, analytics events, or monitoring, start from the NSM and work backward: what would I need to know to debug why this metric dropped 15%? Instrument that.

## Finding the NSM If Nobody Has Told You

Ask your PM: "What is the one metric that, if it went up by 20%, would make this team definitively successful this quarter?"

If there is a clear answer, you have your NSM. If the answer is vague or produces a list of five things, that is a signal the team has not aligned on a North Star — and the conversation is valuable regardless of what it surfaces.

Some teams use OKRs instead of a single NSM. The logic is similar: find the key result that is closest to "users are getting value" and treat it as your compass. The specific framework matters less than having one answer to "what are we optimizing for" that engineers can use to make daily decisions.

## The Engineer Who Knows the NSM

There is a particular kind of engineer who earns trust with PMs and leadership not by building faster, but by building *in the right direction* — catching the metric misalignment before the sprint starts, raising the observability gap before the launch, asking the question that reframes the feature.

That engineer almost always understands the North Star Metric. Not because they were told to, but because they were curious about whether the work was landing.

That curiosity is the habit. The NSM is just where it points.
