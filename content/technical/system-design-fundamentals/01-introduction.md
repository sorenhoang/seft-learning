---
title: "Introduction to System Design"
order: 1
tags: ["system-design", "beginner"]
date: "2024-03-01"
draft: false
---

# Introduction to System Design

System design is the process of defining the architecture, components, modules, interfaces, and data for a system to satisfy specified requirements.

## Why System Design Matters

When you build software at scale, small decisions compound into major bottlenecks. Understanding system design helps you:

- **Anticipate failure modes** before they happen in production
- **Choose the right trade-offs** between consistency, availability, and partition tolerance
- **Communicate architecture** clearly with your team

## The Core Vocabulary

Before diving in, let's align on key terms:

| Term | Definition |
|------|-----------|
| **Latency** | Time to complete a single request |
| **Throughput** | Requests processed per unit time |
| **Availability** | % of time a system is operational |
| **Durability** | Guarantee that stored data is not lost |

## A Simple Request Lifecycle

```
Client → Load Balancer → App Server → Cache → Database
                                   ↘ Cache miss → Database
```

When a user makes a request:
1. The **load balancer** routes it to a healthy app server
2. The app server checks the **cache** for the response
3. On a cache miss, it queries the **database**
4. The result is stored in cache and returned

## CAP Theorem

In a distributed system, you can only guarantee **two** of the following three properties:

$$
\text{CAP} = \{Consistency,\ Availability,\ Partition\ Tolerance\}
$$

- **CP systems** (e.g., HBase, Zookeeper): Consistent and partition-tolerant, may reject requests when partitioned
- **AP systems** (e.g., Cassandra, DynamoDB): Available and partition-tolerant, may return stale data
- **CA systems**: Only possible without network partitions (not realistic in distributed environments)

> In practice, network partitions are unavoidable, so the real trade-off is between **Consistency** and **Availability**.

## What's Next

In the following chapters, we'll explore:
- Horizontal vs. vertical scaling strategies
- Database selection criteria
- Caching patterns and eviction policies
- Message queues and async processing
