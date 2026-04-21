---
title: "Tactical Building Blocks — Entities, Value Objects, and Aggregates"
tags: ["DDD", "SystemDesign", "SoftwareArchitecture", "Backend", "OOP"]
description: "The three core tactical DDD patterns explained with code: how to choose between Entity and Value Object, how to design Aggregates correctly, and the rules that keep your domain consistent."
date: "2026-04-20"
order: 4
cover: "https://res.cloudinary.com/dmwr6giop/image/upload/q_auto/f_auto/v1776652900/ddd-ch4-building-blocks_j17gv3.png"
draft: false
---

## I. Moving from Strategy to Code

Strategic DDD told you *where* to draw lines. Tactical DDD tells you *how to model what's inside those lines*. The three foundational tactical building blocks are:

- **Entities**: Objects defined by their identity
- **Value Objects**: Objects defined by their attributes
- **Aggregates**: Clusters of objects that enforce consistency as a unit

Understanding these three — and the distinctions between them — is the difference between a domain model that encodes business rules and a database schema with methods bolted on.

---

## II. Entities — Identity Over Time

An **Entity** is a domain object with a **unique identity that persists and remains meaningful over time**, even as its attributes change.

The canonical test: if two objects have the same attributes but different identities, are they the same thing?

- Two `Customer` objects with the same name and email but different IDs → **different customers**
- Two `Product` objects with the same description but different SKUs → **different products**

Identity makes them distinct regardless of attribute equality.

### What Makes a Good Entity

```typescript
class Customer {
  private readonly id: CustomerId;      // Identity — never changes
  private name: PersonName;             // Attribute — can change
  private email: Email;                 // Attribute — can change
  private address: Address;             // Value Object attribute
  private loyaltyPoints: LoyaltyPoints; // Value Object attribute

  constructor(id: CustomerId, name: PersonName, email: Email) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.loyaltyPoints = LoyaltyPoints.zero();
  }

  // Business behavior lives here
  updateEmail(newEmail: Email): void {
    if (newEmail.equals(this.email)) return;
    this.email = newEmail;
    // Could raise a domain event here
  }

  earnLoyaltyPoints(amount: number): void {
    this.loyaltyPoints = this.loyaltyPoints.add(amount);
  }

  equals(other: Customer): boolean {
    return this.id.equals(other.id); // Identity comparison
  }
}
```

### Identity Strategy

| Strategy | When to use |
| :-- | :--- |
| **UUID / GUID** | Default for most entities. No coupling to external systems. |
| **Natural key** | Order number, social security number. Carries business meaning. Use when stable and unique. |
| **Surrogate DB key** | Avoid for domain entities. DB auto-increment leaks infrastructure into domain. |

### The Anemic Entity Anti-Pattern

```typescript
// ❌ Anemic — just a data bag
class Order {
  id: string;
  status: string;
  total: number;
}

// Logic lives outside the entity — in services
class OrderService {
  cancel(order: Order): void {
    if (order.status !== 'PENDING') throw new Error('...');
    order.status = 'CANCELLED';
  }
}
```

```typescript
// ✅ Rich entity — behavior is part of the model
class Order {
  private readonly id: OrderId;
  private status: OrderStatus;
  private total: Money;

  cancel(): void {
    if (!this.status.canBeCancelled()) {
      throw new OrderCancellationError('Order cannot be cancelled in current state');
    }
    this.status = OrderStatus.CANCELLED;
    this.addDomainEvent(new OrderCancelled(this.id));
  }
}
```

---

## III. Value Objects — Defined by What They Are

A **Value Object** has **no identity**. Two Value Objects with the same attributes are interchangeable — they are the same thing.

Classic examples: `Money`, `Address`, `Email`, `DateRange`, `Coordinate`, `Percentage`, `Color`.

The critical characteristic: **Value Objects are immutable**. To "change" a Value Object, you replace it with a new one.

### Why Immutability Matters

```typescript
// ❌ Mutable — dangerous, leads to aliasing bugs
class Money {
  amount: number;
  currency: string;
  
  add(other: Money): void {
    this.amount += other.amount; // mutates in place — callers get surprised
  }
}

// ✅ Immutable — safe to share, cache, and reason about
class Money {
  private constructor(
    private readonly amount: number,
    private readonly currency: Currency
  ) {}

  static of(amount: number, currency: Currency): Money {
    if (amount < 0) throw new DomainError('Money cannot be negative');
    return new Money(amount, currency);
  }

  add(other: Money): Money {
    if (!this.currency.equals(other.currency)) {
      throw new DomainError('Cannot add amounts in different currencies');
    }
    return new Money(this.amount + other.amount, this.currency); // returns new instance
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency.equals(other.currency);
  }

  toString(): string {
    return `${this.currency.symbol}${this.amount.toFixed(2)}`;
  }
}
```

### Value Objects Encode Domain Rules

This is their superpower. A `Money` object knows it can't be negative. An `Email` object knows it must be valid. A `DateRange` knows its end cannot be before its start.

```typescript
class Email {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static from(raw: string): Email {
    const normalized = raw.toLowerCase().trim();
    if (!this.isValid(normalized)) {
      throw new DomainError(`"${raw}" is not a valid email address`);
    }
    return new Email(normalized);
  }

  private static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

### Entity vs. Value Object: The Decision Framework

| Question | Entity | Value Object |
| :-- | :-- | :-- |
| Does it need a unique identity? | ✅ Yes | ❌ No |
| Can two instances with same data be considered equal? | ❌ No | ✅ Yes |
| Does it have a lifecycle (created, updated, deleted)? | ✅ Yes | ❌ No |
| Should it be immutable? | ❌ Usually not | ✅ Always |

> **Default to Value Objects.** Only promote a concept to Entity when you need to track identity over time. `Address` is a Value Object — unless your domain must track when a specific address was used for a delivery.

---

## IV. Aggregates — Consistency Boundaries

An **Aggregate** is a cluster of related Entities and Value Objects that are treated as a **single unit for data changes**, enforcing consistency within a transactional boundary.

Every Aggregate has exactly one **Aggregate Root** — the Entity that controls access to everything inside the cluster.

### Why Aggregates Exist

In distributed systems, you cannot span a single database transaction across multiple services. Aggregates define the boundary within which **all business invariants must be consistent at the end of every transaction**.

```
Without Aggregates:
  Order + OrderLines + Discount + Payment → one giant transaction
  → locks everything, scales poorly, violates bounded contexts

With Aggregates:
  Order Aggregate (Order + OrderLines + Discount) → one transaction
  Payment Aggregate (Payment + PaymentMethod)     → separate transaction
  → consistent within each, integrated via domain events
```

### The Aggregate Root Pattern

```typescript
// Order is the Aggregate Root
class Order {
  private readonly id: OrderId;
  private readonly customerId: CustomerId;         // reference to another aggregate by ID only
  private readonly lines: OrderLine[];              // child entity, owned by Order
  private status: OrderStatus;
  private readonly domainEvents: DomainEvent[] = [];

  // Access to internals only through the root
  addLine(productId: ProductId, quantity: Quantity, unitPrice: Money): void {
    if (!this.status.acceptsNewLines()) {
      throw new DomainError('Cannot add items to a confirmed order');
    }
    
    const existingLine = this.lines.find(l => l.productId.equals(productId));
    if (existingLine) {
      existingLine.increaseQuantity(quantity); // mutation through root
    } else {
      this.lines.push(new OrderLine(OrderLineId.generate(), productId, quantity, unitPrice));
    }
  }

  confirm(): void {
    if (this.lines.length === 0) {
      throw new DomainError('Cannot confirm an empty order');
    }
    this.status = OrderStatus.CONFIRMED;
    this.domainEvents.push(new OrderConfirmed(this.id, this.customerId, this.total()));
  }

  total(): Money {
    return this.lines.reduce(
      (sum, line) => sum.add(line.lineTotal()),
      Money.zero('USD')
    );
  }

  // Expose events for application service to publish
  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents.length = 0;
    return events;
  }
}
```

### The Four Aggregate Design Rules

Eric Evans and Vaughn Vernon distilled these from experience:

**Rule 1: Reference other Aggregates by Identity Only**

Never hold a direct object reference to another Aggregate. Only store its ID.

```typescript
// ❌ Wrong — direct reference creates tight coupling
class Order {
  private customer: Customer; // holds full Customer aggregate
}

// ✅ Correct — reference by ID only
class Order {
  private customerId: CustomerId; // just the identity
}
```

**Rule 2: Modify Only One Aggregate Per Transaction**

One use case = one transaction = one Aggregate change. If you need to modify two Aggregates, use Domain Events to coordinate asynchronously.

```typescript
// ❌ Wrong — two aggregates in one transaction
async function placeOrder(command: PlaceOrderCommand): Promise<void> {
  const order = await orderRepo.findById(command.orderId);
  const inventory = await inventoryRepo.findBySku(command.sku);
  
  order.confirm();
  inventory.reserve(command.quantity); // ← second aggregate!
  
  await orderRepo.save(order);
  await inventoryRepo.save(inventory); // ← two saves in one transaction
}

// ✅ Correct — order confirms, raises event, inventory reacts asynchronously
async function placeOrder(command: PlaceOrderCommand): Promise<void> {
  const order = await orderRepo.findById(command.orderId);
  order.confirm(); // raises OrderConfirmed event
  await orderRepo.save(order);
  // Publish events → InventoryContext subscribes and reserves asynchronously
}
```

**Rule 3: Design Small Aggregates**

Include only the data that must be consistent within a single transaction. If two things can be updated independently, they belong in separate Aggregates.

```
Large Aggregate (avoid):
  Order → OrderLines → Customer → CustomerAddress → CustomerPaymentMethods

Small Aggregates (prefer):
  Order → OrderLines  (Order aggregate)
  Customer            (Customer aggregate, referenced by CustomerId)
```

**Rule 4: Use Eventual Consistency Between Aggregates**

Accept that when an `Order` is confirmed, the `Inventory` will be updated *shortly after* — not in the same transaction. Design your business rules to tolerate this.

```typescript
// Domain event bridges aggregate boundaries
class OrderConfirmed implements DomainEvent {
  constructor(
    public readonly orderId: OrderId,
    public readonly customerId: CustomerId,
    public readonly lineItems: OrderLineSnapshot[],
    public readonly occurredOn: Date = new Date()
  ) {}
}

// In Inventory context: subscribe to this event
class InventoryReservationHandler {
  async handle(event: OrderConfirmed): Promise<void> {
    for (const item of event.lineItems) {
      const inventory = await this.repo.findBySku(item.sku);
      inventory.reserve(item.quantity);
      await this.repo.save(inventory);
    }
  }
}
```

---

## V. Putting It Together — A Complete Example

Here is how Entities, Value Objects, and Aggregates compose in an Order domain:

```
Order Aggregate
├── Order (Aggregate Root — Entity)
│   ├── id: OrderId (Value Object)
│   ├── customerId: CustomerId (Value Object — ID reference)
│   ├── status: OrderStatus (Value Object — enum with behavior)
│   ├── shippingAddress: Address (Value Object)
│   └── lines: OrderLine[] (child Entities)
│       ├── id: OrderLineId (Value Object)
│       ├── productId: ProductId (Value Object — ID reference)
│       ├── quantity: Quantity (Value Object)
│       └── unitPrice: Money (Value Object)
```

Every primitive (`string`, `number`) has been replaced with a Value Object that enforces its own invariants. The Aggregate Root controls all mutations. External Aggregates are referenced only by ID.

---

## VI. Summary

| Concept | Identity | Mutable | Invariants |
| :-- | :-- | :-- | :-- |
| **Entity** | Yes — unique ID | Yes | Self-validated |
| **Value Object** | No — defined by attributes | No — immutable | Built into constructor |
| **Aggregate** | Defined by root Entity | Root controls mutations | Enforced across all members |

**Decision flow**:
```
Does this concept need to be tracked over time by identity?
  → YES: Entity
  → NO:  Value Object (prefer this — keep models simple)

Does this group of entities/VOs need to stay consistent as a unit?
  → YES: Aggregate (root = the entity that controls the invariant)
```

---

## Further Reading

- [Use Tactical DDD to Design Microservices — Microsoft Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/tactical-ddd)
- [DDD Beyond the Basics: Mastering Aggregate Design — Medium (SSENSE)](https://medium.com/ssense-tech/ddd-beyond-the-basics-mastering-aggregate-design-26591e218c8c)
- [An In-Depth Understanding of Aggregation in DDD — Alibaba Cloud](https://www.alibabacloud.com/blog/an-in-depth-understanding-of-aggregation-in-domain-driven-design_598034)

---

*Next: Chapter 5 — Domain Services, Repositories, and Domain Events: the patterns that complete the tactical toolkit.*
