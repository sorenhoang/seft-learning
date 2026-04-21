---
title: "The Philosophy of DDD — Why Complexity Kills and How Domain Modeling Fights Back"
tags: ["ddd", "system-design", "software-architecture", "backend"]
date: "2026-04-20"
order: 1
cover: "https://res.cloudinary.com/dmwr6giop/image/upload/q_auto/f_auto/v1776652902/ddd-ch1-philosophy_rmj79g.png"
draft: false
---

## I. The Silent Killer of Software Projects

Picture this: a team spends 18 months building an e-commerce platform. Launch goes well. But six months later, adding a new discount rule takes two weeks. A year later, engineers are afraid to touch the pricing module. Two years in, a rewrite is proposed.

This is not a story about bad engineers. It's a story about **accidental complexity** — the gap that grows between what software does and what the business it serves actually means.

Eric Evans, in his 2003 book *Domain-Driven Design*, named this problem clearly:

> "The heart of software is its ability to solve domain-related problems for its users. All other features, vital as they may be, support this basic purpose."

When software loses connection with its domain, it stops being an asset and becomes a liability.

### What Causes This Drift?

The usual suspects:

- **Translation loss**: Developers translate business language into technical jargon, and something gets lost every time.
- **Data-first thinking**: Building database tables first and business logic second produces a data model, not a domain model.
- **Dispersed logic**: Business rules live in stored procedures, UI validation, background jobs, and API controllers — everywhere except one coherent place.
- **No shared vocabulary**: The term "Order" means different things to the sales team, the warehouse team, and the billing system.

DDD exists to fight all of these, systematically.

---

## II. What DDD Actually Is

Domain-Driven Design is **a software development approach that centers the entire design process around the core domain and domain logic**, using continuous collaboration between technical and domain experts to build an evolving model that drives the implementation.

Three words do a lot of heavy lifting here:

| Word | What it means in practice |
| :-- | :--- |
| **Domain** | The problem space your software operates in (e.g., logistics, insurance, e-commerce) |
| **Model** | A distilled, purposeful abstraction of that domain — not a diagram, but living code |
| **Design** | Every structural decision flows from the model, not from the database or framework |

DDD is **not**:
- A framework or library
- A silver bullet for all software problems
- Only applicable to microservices (though it pairs well with them)
- Just using fancy naming conventions

---

## III. Strategic vs. Tactical DDD

DDD has two complementary sides that many developers conflate:

### Strategic DDD
The big-picture thinking. Answers: *Where do the boundaries go? How do different parts of the system relate? Which parts of the domain matter most?*

Key tools: **Bounded Contexts**, **Context Maps**, **Ubiquitous Language**, **Core Domain / Generic Domain / Supporting Domain**.

### Tactical DDD
The implementation patterns. Answers: *How do I model this specific business concept in code?*

Key tools: **Entities**, **Value Objects**, **Aggregates**, **Domain Services**, **Repositories**, **Domain Events**.

A common mistake is skipping strategic DDD and jumping straight to tactical patterns — resulting in technically "correct" aggregates in the wrong boundaries, which is arguably worse than no DDD at all.

```
Strategic DDD → Where to draw lines
Tactical DDD  → How to model what's inside those lines
```

---

## IV. The Core Domain, Generic Domains, and Supporting Domains

One of DDD's most important strategic ideas: **not all parts of your domain are equal**.

### Core Domain
The part of your business that is genuinely differentiating — the reason customers choose you over competitors. This is where your best engineering talent and most careful design should live.

> For Uber, the matching algorithm between riders and drivers is core domain. The invoice generation is not.

### Generic Domains
Solved problems. Email delivery, PDF generation, authentication. These are important but not your competitive advantage. Buy them as services or use open-source solutions.

### Supporting Domains
Necessary but not differentiating. HR management, internal reporting. Build them, but don't over-engineer them.

**Why does this matter?** Because applying full DDD rigor to every subdomain is expensive. Reserve the deep investment for your Core Domain.

```
Core Domain       → Full DDD, best team, most investment
Supporting Domain → Simpler design, standard patterns acceptable  
Generic Domain    → Don't build it — buy it
```

---

## V. The Anemic Domain Model — The Most Common Anti-Pattern

If you have ever seen code like this:

```typescript
// AnOrderService.ts — all logic here
class OrderService {
  async applyDiscount(orderId: string, discount: number) {
    const order = await this.orderRepo.findById(orderId);
    if (order.status !== 'PENDING') throw new Error('Cannot discount');
    order.total = order.total * (1 - discount);
    order.discountApplied = true;
    await this.orderRepo.save(order);
  }
}

// Order.ts — just a data bag
class Order {
  id: string;
  total: number;
  status: string;
  discountApplied: boolean;
}
```

You have seen the **Anemic Domain Model** — a model where domain objects are mere data containers and all business logic lives in service classes.

Martin Fowler called this a fundamental anti-pattern because it defeats the purpose of object-oriented design: **the object should know how to behave, not just what it contains**.

### The Rich Domain Model Alternative

```typescript
// Order.ts — behavior lives here
class Order {
  private id: string;
  private total: Money;
  private status: OrderStatus;
  private discountApplied: boolean;

  applyDiscount(discount: Percentage): void {
    if (!this.status.isPending()) {
      throw new DomainError('Cannot apply discount to a non-pending order');
    }
    if (this.discountApplied) {
      throw new DomainError('Discount already applied');
    }
    this.total = this.total.reduceBy(discount);
    this.discountApplied = true;
  }
}
```

Notice:
- Business rules live inside the `Order` class itself
- `Money` and `Percentage` are Value Objects (not raw primitives)
- `OrderStatus` encapsulates valid transitions
- The service becomes a thin orchestrator, not a rules engine

---

## VI. The Collaboration Model: Developers + Domain Experts

DDD is fundamentally a **collaborative practice**. The model emerges from continuous conversation between:

- **Domain Experts**: People who deeply understand the business — product managers, subject matter experts, experienced users
- **Developers**: Who translate that understanding into code

The goal is to eliminate the "translation tax" — the distortion that happens when business requirements pass through multiple people before reaching code.

```
Without DDD:  Business → Analyst → Requirements Doc → Developer → Code
With DDD:     Business + Developer → Shared Model → Code
```

This is why DDD sessions often look like whiteboard workshops rather than traditional requirements-gathering meetings. Tools like **Event Storming** — where domain experts and developers collaboratively map business events on sticky notes — have become the primary discovery technique.

---

## VII. When to Use DDD (and When Not To)

DDD comes with real costs: the upfront investment in domain discovery, the discipline of maintaining the model, the complexity of tactical patterns. It's not always worth it.

### Use DDD When:
- The domain is genuinely complex with intricate business rules
- The team will work on the system for years
- Multiple bounded contexts need to coexist in one platform
- Domain experts are available and engaged
- Microservices are the target architecture

### Skip DDD (or use a lighter version) When:
- The application is primarily CRUD with minimal business logic
- It's a short-lived prototype
- The team is small and the domain is simple
- Time-to-market pressure is extreme

> DDD is not a binary choice. You can apply strategic DDD (bounded contexts, ubiquitous language) without the full tactical toolkit, and still gain enormous benefits.

---

## VIII. Summary

| Concept | Key Takeaway |
| :-- | :--- |
| **The Problem** | Software drifts from the domain it serves as complexity grows |
| **DDD's Answer** | Center design on a shared, living model of the domain |
| **Strategic DDD** | Where to draw boundaries; which domains matter most |
| **Tactical DDD** | How to model business concepts in code |
| **Anemic Model** | Business logic in services = code that fights itself |
| **Rich Model** | Business logic inside domain objects = code that mirrors reality |
| **When to use** | Complex domains, long-lived systems, microservices |

---

## Further Reading

- [Domain-Driven Design: Core Concepts and Benefits](https://domain-driven-software.com/an-introduction-to-domain-driven-design-ddd-1025bce518c2) — Philip Jander
- [An Introduction to Domain-Driven Design](https://learn.microsoft.com/en-us/archive/msdn-magazine/2009/february/best-practice-an-introduction-to-domain-driven-design) — Microsoft Learn
- [DDD Europe 2024 Conference](https://2024.dddeurope.com/) — Talks and workshops from leading DDD practitioners

---

*Next: Chapter 2 — Ubiquitous Language & Bounded Contexts: how to build the shared vocabulary that becomes your code.*
