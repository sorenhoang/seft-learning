---
title: "Thinking in Systems: A Product Perspective"
description: "How systems thinking helps you make better product decisions and anticipate second-order effects."
tags: ["product", "strategy", "mental-models", "systems-thinking"]
date: "2024-03-18"
draft: false
---

# Thinking in Systems: A Product Perspective

Every product is a system. When you add a feature, you're not just adding a button — you're changing the dynamics of the entire system.

## Stocks and Flows

A **stock** is any quantity that accumulates over time. A **flow** is the rate of change.

- Stock: active users, revenue, technical debt
- Inflow: new sign-ups, new features shipped
- Outflow: churn, bugs resolved

Understanding what drives your flows helps you predict where your stocks will be in 6 months.

## Feedback Loops

**Reinforcing loops** (positive feedback) amplify change:
> More users → more content → better recommendations → more users

**Balancing loops** (negative feedback) resist change:
> More users → more support tickets → slower response time → lower satisfaction → fewer users

Most product problems involve a reinforcing loop that you *want* and a balancing loop that *fights back*.

## The Danger of Local Optimization

Optimizing one metric in isolation often degrades the system overall.

- Reduce time-to-ship → more bugs → more support load
- Increase engagement → dark patterns → long-term trust erosion

Always ask: *what does this change do to the system two steps removed?*
