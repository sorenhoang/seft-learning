---
title: "Rate Limiting, Brute Force Protection & Account Lockout"
tags: ["Security", "RateLimiting", "BruteForce", "API-Design", "SystemDesign", "Backend"]
description: "A deep dive into rate limiting algorithms, brute force defense strategies, account lockout mechanisms, and distributed system considerations for production auth systems."
date: "2026-05-14"
order: 15
draft: false
---

## I. Rate Limiting Fundamentals & Algorithms

*   **Purpose:** Controls request frequency per client within a specific time window to prevent resource exhaustion, DDoS attacks, credential stuffing, and data scraping.
*   **Common Algorithms:**
    *   **Fixed Window Counter:** Divides time into fixed buckets (e.g., 60 seconds). It is fast and uses minimal memory but suffers from boundary spikes, where a client can double their allowed limit by sending requests at the end of one window and the start of the next.
    *   **Sliding Window Log:** Tracks the exact timestamp of every request. It provides exact accuracy and no boundary bursts, but consumes high memory linearly with request volume.
    *   **Sliding Window Counter:** A hybrid approach blending two fixed windows with a weighted average. It smooths out boundary bursts, offers near-exact accuracy, and requires minimal memory, making it the recommended default for most production APIs.
    *   **Token Bucket:** Allows for controlled bursts of traffic up to a maximum capacity while enforcing a steady average refill rate.
    *   **Leaky Bucket:** Enforces a strict, steady drain rate with no-burst behavior. It is ideal for either policing (dropping overflow immediately) or shaping (delaying/queueing requests) traffic to protect downstream services.

## II. Brute Force Protection Strategies

*   **Target:** Automated attacks guessing passwords or multi-factor authentication (MFA) codes, and credential stuffing.
*   **Implementation Rules:**
    *   **Endpoint-Specific Limits:** Authentication and login routes require significantly stricter rate limits (e.g., 5-10 attempts per 15 minutes) than general data read endpoints.
    *   **Multi-layered Tracking:** Rate limits should track failed attempts by both **IP address** and **Account (User ID/Email)**. This restricts attackers rotating proxy IPs while preventing legitimate users on a shared corporate IP from being unfairly penalized.
    *   **Anti-Scraping & Jitter:** Implement CAPTCHAs before authentication attempts or add "jitter" (randomized delays) to `Retry-After` headers to prevent synchronized retries and "thundering herd" server spikes.

## III. Account Lockout Mechanisms

*   **Function:** Defends against automated guessing by temporarily or permanently restricting access to an account after consecutive failed logins.
*   **Best Practices:**
    *   **Low Thresholds:** Configure the system to take action after a small number of failed attempts, typically between 3 and 5.
    *   **Progressive Lockouts:** Instead of an immediate hard lockout that requires admin intervention, escalate time delays progressively (e.g., 5 minutes for 5 fails, 30 minutes for 10 fails, and a full lockout requiring email verification for 20 fails).
    *   **Clear User Messaging:** Provide transparent feedback to users when an account is locked, explaining why it happened and the steps needed to regain access.

## IV. Architectural & Distributed System Considerations

*   **Centralized Storage:** Use distributed, in-memory data stores like Redis instead of in-memory application variables. This ensures rate limit states are synchronized across horizontally scaled servers.
*   **Atomic Operations:** Utilize server-side Lua scripting in Redis to bundle read-modify-write sequences into a single atomic operation. This prevents concurrent race conditions (Time of Check to Time of Use - TOCTOU) where parallel requests bypass limits.
*   **API Gateway Placement:** Enforce rate limiting at the API Gateway or load balancer edge level so malicious traffic is dropped before it can consume backend application compute resources.
*   **Fail-Open vs. Fail-Closed:** Decide system behavior if the rate limiter storage (e.g., Redis) fails. "Fail-open" keeps the API online (sacrificing protection), while "Fail-closed" drops all requests to ensure strict security but takes the API offline.
*   **Cost-Aware Quotas (Denial of Wallet):** For expensive endpoints like Generative AI APIs, implement hierarchical limits (e.g., minute-level token buckets combined with daily/weekly hard quotas) to prevent sustained financial abuse.
*   **Standard Headers & Codes:** Always return an HTTP `429 Too Many Requests` status code for rejected calls and include standardized headers (`RateLimit-Limit`, `RateLimit-Remaining`, and `Retry-After`) so legitimate clients can self-regulate.
