---
title: "Context Mapping — How Bounded Contexts Collaborate"
tags: ["ddd", "system-design", "software-architecture", "microservices", "integration"]
date: "2026-04-20"
order: 3
cover: "https://res.cloudinary.com/dmwr6giop/image/upload/q_auto/f_auto/v1776652900/ddd-ch3-context-mapping_dbu1r3.png"
draft: false
---

## I. The Integration Problem

You have identified your Bounded Contexts. Each has its own model, its own Ubiquitous Language, its own team. Now comes the hard part: **they have to talk to each other**.

An Order Context needs to know if inventory is available. A Billing Context needs order totals from the Order Context. A Notification Context needs to know when an order ships. Every real system involves multiple contexts that must integrate — and how they integrate is one of the most consequential architectural decisions you will make.

**Context Mapping** is DDD's strategic design tool for documenting, designing, and managing these integration relationships. A Context Map is not just a diagram — it captures the team dynamics, technical coupling, and power relationships between contexts.

---

## II. The Context Map

A Context Map is a visual representation of all Bounded Contexts in a system and the relationships between them. It answers:

- Who depends on whom?
- Who has the power to set terms in an integration?
- How does translation happen at the boundary?
- Which contexts share code and which are fully independent?

```
┌──────────────┐   Partnership   ┌──────────────────┐
│   Order BC   │────────────────▶│   Inventory BC   │
└──────┬───────┘                 └──────────────────┘
       │
       │ Customer/Supplier
       ▼
┌──────────────┐   Conformist    ┌──────────────────┐
│  Payment BC  │────────────────▶│  Tax Service BC  │
└──────────────┘                 └──────────────────┘
       │
       │ ACL (Anti-Corruption Layer)
       ▼
┌──────────────────────────────────┐
│    External Payment Gateway      │
│    (third-party, no DDD model)   │
└──────────────────────────────────┘
```

The patterns on the arrows are the eight Context Mapping patterns from Eric Evans and Vaughn Vernon.

---

## III. The Eight Context Mapping Patterns

Patterns fall into three categories based on the power relationship: **Upstream** (the provider), **Downstream** (the consumer), or **Symmetric** (equals).

### 1. Shared Kernel

Two teams share a common model — a subset of the domain that both contexts use. Changes to the shared kernel require coordination and joint approval.

```
┌───────────────┐          ┌───────────────┐
│   Context A   │◀──SK──▶ │   Context B   │
└───────────────┘          └───────────────┘
         ↑
    Shared Kernel:
    - Common User entity
    - Shared Money value object
    - Shared domain events
```

**When to use**: Two tightly aligned teams with significant model overlap.

**Trade-off**: High coupling. A change in the kernel requires both teams to update simultaneously. Works only with strong inter-team coordination. Avoid in large organizations.

---

### 2. Customer/Supplier

A clear upstream/downstream relationship where the **upstream (Supplier)** produces the model and the **downstream (Customer)** consumes it. The Customer can negotiate requirements, but ultimately conforms to the Supplier's timeline.

```
Upstream (Supplier)        Downstream (Customer)
┌──────────────────┐       ┌──────────────────┐
│  Catalog Service │──────▶│   Order Service  │
│  (sets the terms)│       │  (negotiates but │
│                  │       │   follows Catalog)│
└──────────────────┘       └──────────────────┘
```

**When to use**: Two teams with a clear provider/consumer relationship and enough organizational trust for negotiation.

**Trade-off**: The customer team depends on the supplier's roadmap. Can create delivery bottlenecks.

---

### 3. Conformist

Like Customer/Supplier, but **the downstream team has no negotiating power**. They simply conform to whatever the upstream produces — no pushback, no influence.

**Typical scenario**: Consuming a third-party API, a legacy system, or a service owned by a powerful team that won't accommodate your needs.

```typescript
// Conformist: downstream just maps to whatever upstream provides
interface LegacyOrderResponse {
  ord_id: string;
  usr_id: string;
  itm_list: { sku: string; qty: number; prc: number }[];
}

// We have to live with this naming and structure
function mapLegacyOrder(response: LegacyOrderResponse): void {
  // conform to their model
}
```

**When to use**: Consuming third-party systems, legacy systems with no modernization budget.

**Trade-off**: Your model is polluted by the upstream's design decisions. Fine for low-stakes integrations; dangerous for core domain.

---

### 4. Anti-Corruption Layer (ACL)

The most important defensive pattern. The downstream team builds a **translation layer** that converts the upstream's model into its own clean domain model. The upstream model never leaks into the downstream's core.

```
┌─────────────────────┐     ┌───────────┐     ┌──────────────────┐
│  External Payment   │────▶│    ACL    │────▶│  Payment Context │
│  Gateway (Stripe)   │     │(Translator│     │  (clean model)   │
│  (messy third-party)│     │  Layer)   │     │                  │
└─────────────────────┘     └───────────┘     └──────────────────┘
```

```typescript
// ACL: translate Stripe's model into our domain model
class StripePaymentGatewayAdapter implements PaymentGateway {
  async charge(payment: PaymentRequest): Promise<PaymentResult> {
    // Translate our domain model → Stripe's API shape
    const stripeCharge = await stripe.charges.create({
      amount: payment.amount.inCents(),
      currency: payment.currency.code,
      source: payment.card.stripeToken,
    });

    // Translate Stripe's response → our domain model
    return new PaymentResult({
      id: PaymentId.from(stripeCharge.id),
      status: this.mapStripeStatus(stripeCharge.status),
      processedAt: new Date(stripeCharge.created * 1000),
    });
  }

  private mapStripeStatus(stripeStatus: string): PaymentStatus {
    const mapping: Record<string, PaymentStatus> = {
      succeeded: PaymentStatus.SUCCEEDED,
      pending: PaymentStatus.PENDING,
      failed: PaymentStatus.FAILED,
    };
    return mapping[stripeStatus] ?? PaymentStatus.UNKNOWN;
  }
}
```

**When to use**: Any time you integrate with an external system, legacy code, or any upstream you don't control. **This should be your default for external integrations.**

**Trade-off**: Additional layer to build and maintain. Worth it almost always — the alternative is letting a third-party API's design decisions leak into your core domain.

---

### 5. Open Host Service (OHS)

The upstream context provides a **well-defined, stable protocol** (API) for others to integrate with. Instead of each consumer getting a custom integration, the upstream publishes a general-purpose service.

```
        ┌──────────────────────┐
        │   Catalog Service    │
        │                      │
        │  Open Host Service:  │
        │  REST API / GraphQL  │
        │  (stable, versioned) │
        └──────────────────────┘
           ↗        ↑        ↖
    Order BC    Mobile App    Search BC
    (consumer)  (consumer)    (consumer)
```

**When to use**: One context serves many consumers. Rather than bespoke integrations for each, publish a stable API.

**Trade-off**: The API becomes a public contract. Changes require careful versioning and backwards compatibility.

---

### 6. Published Language

A shared, well-documented language (typically a schema — JSON Schema, Avro, Protobuf, XML) that multiple contexts use to communicate. Often used alongside OHS.

**Example**: An event schema for `OrderPlaced`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema",
  "title": "OrderPlaced",
  "type": "object",
  "properties": {
    "orderId": { "type": "string", "format": "uuid" },
    "customerId": { "type": "string", "format": "uuid" },
    "placedAt": { "type": "string", "format": "date-time" },
    "lineItems": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "skuCode": { "type": "string" },
          "quantity": { "type": "integer", "minimum": 1 },
          "unitPrice": { "type": "number" }
        }
      }
    }
  }
}
```

All consuming contexts agree to this schema. Changes are versioned.

**When to use**: Event-driven architectures, message-based integration, public APIs.

---

### 7. Separate Ways

Sometimes the right answer is: **don't integrate**. Two contexts duplicate some functionality rather than paying the integration cost.

**Example**: Both the Order context and the Reporting context need to calculate tax amounts. Instead of building a shared Tax service, each implements its own simple tax calculation. They diverge — and that's fine.

**When to use**: The cost of integration outweighs the cost of duplication. The functionality is genuinely simple or independent.

**Trade-off**: Duplication. Risk of divergence over time. Only valid when integration complexity is high and the duplicated logic is simple.

---

### 8. Partnership

Two teams coordinate as equals, evolving their interfaces together in a tightly coupled way. Changes in one context are coordinated with the other simultaneously.

**When to use**: Two teams with strong alignment and frequent joint releases.

**Trade-off**: High coordination overhead. Rarely sustainable beyond two tightly aligned teams.

---

## IV. Upstream vs. Downstream Summary

| Pattern | Relationship | Who Sets Terms |
| :-- | :-- | :-- |
| Shared Kernel | Symmetric | Joint agreement |
| Partnership | Symmetric | Joint agreement |
| Customer/Supplier | Upstream/Downstream | Supplier (negotiated) |
| Conformist | Upstream/Downstream | Upstream (no negotiation) |
| Open Host Service | Upstream → Many | Upstream (via stable API) |
| Published Language | Upstream → Many | Upstream (via schema) |
| Anti-Corruption Layer | Protection | Downstream protects itself |
| Separate Ways | Independent | Neither |

---

## V. Choosing the Right Pattern

```
Is the upstream third-party or legacy?
  → YES: Anti-Corruption Layer (always)
  → NO: ↓

Does the upstream serve many consumers?
  → YES: Open Host Service + Published Language
  → NO: ↓

Do both teams have equal power and alignment?
  → YES: Partnership or Shared Kernel
  → NO: ↓

Can the downstream negotiate requirements?
  → YES: Customer/Supplier
  → NO: Conformist

Is integration cost higher than duplication cost?
  → YES: Separate Ways
```

---

## VI. Context Maps Are Living Documents

A Context Map reflects the **current reality** — not an ideal future state. It captures team dynamics, organizational power, technical debt, and integration patterns as they exist today.

Revisit it:
- When teams change ownership of services
- When new contexts are introduced
- When integration patterns become bottlenecks
- As part of architectural reviews

The map is not a goal. It is a diagnostic tool that makes integration complexity visible so it can be managed.

---

## VII. Summary

| Pattern | Core Idea |
| :-- | :--- |
| **Shared Kernel** | Two contexts share a common model subset |
| **Customer/Supplier** | Upstream sets terms; downstream negotiates |
| **Conformist** | Downstream conforms with no negotiation |
| **Anti-Corruption Layer** | Downstream translates upstream → own model |
| **Open Host Service** | Upstream publishes a stable API for all consumers |
| **Published Language** | Shared documented schema for integration |
| **Separate Ways** | No integration; duplicate instead |
| **Partnership** | Two equals co-evolve their interfaces |

---

## Further Reading

- [Strategic DDD with Context Mapping — InfoQ](https://www.infoq.com/articles/ddd-contextmapping/)
- [Context Mapping Patterns — Open Group Standard](https://pubs.opengroup.org/architecture/o-aa-standard/DDD-strategic-patterns.html)
- [Context Mapper Tool](https://contextmapper.org/) — DSL for modeling context maps visually

---

*Next: Chapter 4 — Tactical Building Blocks: how to model Entities, Value Objects, and Aggregates inside a Bounded Context.*
