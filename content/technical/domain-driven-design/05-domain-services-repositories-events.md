---
title: "Domain Services, Repositories, and Domain Events"
tags: ["DDD", "SystemDesign", "SoftwareArchitecture", "Backend", "EventDriven"]
description: "Complete the DDD tactical toolkit: learn how Domain Services handle cross-aggregate logic, Repositories abstract persistence, and Domain Events coordinate changes across boundaries."
date: "2026-04-20"
order: 5
cover: "https://res.cloudinary.com/dmwr6giop/image/upload/q_auto/f_auto/v1776652902/ddd-ch5-services-repositories-events_qm3sde.png"
draft: false
---

## I. The Remaining Pieces

Entities, Value Objects, and Aggregates model **what** the domain knows and enforces. But three questions remain:

1. Where does logic live when it doesn't naturally belong to a single Entity or Aggregate?
2. How do Aggregates get stored and retrieved without coupling to a database?
3. How do changes in one Aggregate propagate to the rest of the system?

**Domain Services**, **Repositories**, and **Domain Events** answer these questions.

---

## II. Domain Services — Logic That Belongs to No One

A **Domain Service** is a stateless object that performs a significant domain operation that doesn't naturally belong to any single Entity or Value Object.

The test: *If I try to put this logic in an Entity, does it require reaching out to other Aggregates or services? Does it feel out of place?* If yes, it belongs in a Domain Service.

### Domain Service vs. Application Service

This distinction is critical and often confused:

| Dimension | Domain Service | Application Service |
| :-- | :--- | :--- |
| **Contains** | Domain logic | Orchestration logic |
| **Knows about** | Domain objects only | Domain services, repositories, external services |
| **Layer** | Domain layer | Application layer |
| **Depends on** | Nothing infrastructure-related | Domain, repositories, event publishers |
| **Testability** | Unit-testable without mocks | Requires mocks for repos/events |

### Example: Transfer Funds (Domain Service)

The logic for transferring money between two accounts belongs to neither the `SourceAccount` nor the `DestinationAccount` alone — it spans both.

```typescript
// Domain Service — pure domain logic, no infrastructure
class MoneyTransferService {
  transfer(
    source: Account,
    destination: Account,
    amount: Money
  ): TransferResult {
    if (source.id.equals(destination.id)) {
      throw new DomainError('Cannot transfer to the same account');
    }

    if (!source.hasSufficientFunds(amount)) {
      throw new InsufficientFundsError(source.id, amount);
    }

    source.debit(amount);
    destination.credit(amount);

    return TransferResult.success(source.balance(), destination.balance());
  }
}
```

```typescript
// Application Service — orchestrates: loads aggregates, calls domain service, saves, publishes
class TransferFundsHandler {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly transferService: MoneyTransferService,
    private readonly events: DomainEventPublisher
  ) {}

  async handle(command: TransferFundsCommand): Promise<void> {
    // 1. Load aggregates
    const source = await this.accounts.findById(command.sourceAccountId);
    const destination = await this.accounts.findById(command.destinationAccountId);

    // 2. Execute domain logic (via domain service)
    const result = this.transferService.transfer(
      source,
      destination,
      Money.of(command.amount, command.currency)
    );

    // 3. Persist changes
    await this.accounts.save(source);
    await this.accounts.save(destination);

    // 4. Publish events
    await this.events.publishAll([...source.pullDomainEvents(), ...destination.pullDomainEvents()]);
  }
}
```

### When to Create a Domain Service

Create one when:
- The operation involves multiple Aggregates
- The logic doesn't "belong" to any single Entity
- Putting the logic in an Entity would require it to reference external Aggregates or repositories

**Avoid** creating Domain Services for everything — this leads back to the Anemic Domain Model. Always ask: *can this logic live in the Entity itself?*

---

## III. Repositories — Persistence Without Pollution

A **Repository** provides a **collection-like interface for accessing Aggregates**, abstracting all persistence details behind a domain-friendly API.

The key insight: the domain model should not know whether it's persisted in PostgreSQL, MongoDB, or an in-memory store. The Repository is where infrastructure concerns stop.

### Repository Interface Lives in the Domain

```typescript
// Domain layer — defines the contract
interface OrderRepository {
  findById(id: OrderId): Promise<Order | null>;
  findByCustomer(customerId: CustomerId): Promise<Order[]>;
  findPending(): Promise<Order[]>;
  save(order: Order): Promise<void>;
  delete(id: OrderId): Promise<void>;
}
```

The implementation lives in the infrastructure layer:

```typescript
// Infrastructure layer — implements the contract
class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly db: DatabaseConnection) {}

  async findById(id: OrderId): Promise<Order | null> {
    const row = await this.db.queryOne(
      'SELECT * FROM orders WHERE id = $1',
      [id.value]
    );
    if (!row) return null;
    return this.toDomain(row);
  }

  async save(order: Order): Promise<void> {
    const data = this.fromDomain(order);
    await this.db.upsert('orders', data);
  }

  private toDomain(row: OrderRow): Order {
    // Map DB row → rich domain object
    return Order.reconstitute({
      id: OrderId.from(row.id),
      customerId: CustomerId.from(row.customer_id),
      status: OrderStatus.from(row.status),
      lines: row.lines.map(this.toOrderLine),
    });
  }

  private fromDomain(order: Order): OrderRow {
    // Map rich domain object → DB row
    const snapshot = order.toSnapshot();
    return {
      id: snapshot.id,
      customer_id: snapshot.customerId,
      status: snapshot.status,
      total: snapshot.total,
    };
  }
}
```

### Repository Rules

**One Repository per Aggregate Root** — never per Entity. You don't have an `OrderLineRepository`; you access `OrderLine` through the `OrderRepository`.

```typescript
// ❌ Wrong — accessing child entity directly
const line = await orderLineRepository.findById(lineId);

// ✅ Correct — access through the aggregate root
const order = await orderRepository.findById(orderId);
const line = order.findLine(lineId);
```

**Keep queries business-meaningful** — repository methods should speak the domain language:

```typescript
// ❌ Too generic — leaks database thinking
findWhere(status: string, createdAfter: Date): Promise<Order[]>

// ✅ Domain language
findOrdersAwaitingFulfillment(): Promise<Order[]>
findAbandonedCartsOlderThan(hours: number): Promise<Order[]>
```

**Don't put business logic in Repositories** — they are dumb collection accessors. No filtering by business rules, no aggregation, no calculations.

---

## IV. Domain Events — Recording What Happened

A **Domain Event** is a record of something significant that happened in the domain, expressed in the past tense.

Examples: `OrderPlaced`, `PaymentProcessed`, `InventoryReserved`, `ShipmentDispatched`, `CustomerRegistered`.

Domain Events are:
- **Immutable** — they happened; they cannot be changed
- **Named in past tense** — they are facts, not commands
- **Rich with context** — they carry enough data for consumers to react without fetching more data
- **Raised by Aggregates** — after a state change inside the domain

### Domain Events vs. Integration Events

| Type | Scope | Transport | Consistency |
| :-- | :-- | :-- | :-- |
| **Domain Event** | Within one Bounded Context | In-process or same service | Synchronous with the transaction |
| **Integration Event** | Across Bounded Contexts | Message broker (Kafka, RabbitMQ, SQS) | Eventually consistent |

A Domain Event becomes an Integration Event when it needs to cross a context boundary.

### Implementing Domain Events

```typescript
// Base interface — all events share these
interface DomainEvent {
  readonly occurredOn: Date;
  readonly eventId: string;
}

// Concrete domain event
class OrderConfirmed implements DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;

  constructor(
    public readonly orderId: OrderId,
    public readonly customerId: CustomerId,
    public readonly totalAmount: Money,
    public readonly lineItems: ReadonlyArray<OrderLineSnapshot>
  ) {
    this.occurredOn = new Date();
    this.eventId = crypto.randomUUID();
  }
}
```

### The Event Collection Pattern

The cleanest way to integrate domain events with the application layer:

1. **Aggregate records events internally** — no framework dependencies, no infrastructure coupling
2. **Application service pulls events after saving** — it decides when and how to publish
3. **Events published after successful commit** — no events fire if the transaction rolls back

```typescript
// In the Aggregate Root
abstract class AggregateRoot {
  private readonly _events: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._events.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._events];
    this._events.length = 0;
    return events;
  }
}

// Order raises events as a side effect of state changes
class Order extends AggregateRoot {
  confirm(): void {
    if (this.lines.length === 0) throw new DomainError('Empty order');
    this.status = OrderStatus.CONFIRMED;
    this.addDomainEvent(new OrderConfirmed(
      this.id,
      this.customerId,
      this.total(),
      this.lineSnapshots()
    ));
  }
}
```

```typescript
// Application service: load → execute → save → pull events → publish
class ConfirmOrderHandler {
  async handle(command: ConfirmOrderCommand): Promise<void> {
    const order = await this.orderRepo.findById(OrderId.from(command.orderId));
    if (!order) throw new NotFoundError('Order', command.orderId);

    order.confirm();                           // 1. Domain logic — raises event internally

    await this.orderRepo.save(order);          // 2. Persist the state change

    const events = order.pullDomainEvents();   // 3. Collect events
    await this.eventPublisher.publishAll(events); // 4. Publish after commit
  }
}
```

### Reacting to Domain Events

Within the same Bounded Context (synchronous):

```typescript
class OrderConfirmedHandler {
  async handle(event: OrderConfirmed): Promise<void> {
    // Trigger immediate reactions within the same context
    await this.notificationService.notifyCustomer(event.customerId, event.orderId);
  }
}
```

Across Bounded Contexts (asynchronous, via message broker):

```typescript
// Order context publishes to Kafka/SQS
class OrderEventPublisher {
  async publish(event: OrderConfirmed): Promise<void> {
    await this.messageBroker.publish('orders.confirmed', {
      orderId: event.orderId.value,
      customerId: event.customerId.value,
      totalAmount: event.totalAmount.toJSON(),
      lineItems: event.lineItems,
      occurredOn: event.occurredOn.toISOString(),
    });
  }
}

// Inventory context subscribes and reacts
class InventoryReservationConsumer {
  async onOrderConfirmed(message: OrderConfirmedMessage): Promise<void> {
    for (const item of message.lineItems) {
      const inventory = await this.inventoryRepo.findBySku(item.sku);
      inventory.reserve(item.quantity, message.orderId);
      await this.inventoryRepo.save(inventory);
    }
  }
}
```

---

## V. Tying It All Together — The Application Layer Flow

The full lifecycle of a use case in a DDD application follows a consistent five-step pattern:

```
1. Load aggregate(s) from repository
2. Execute domain logic (entity methods or domain service)
3. Save aggregate(s) to repository
4. Pull domain events from aggregate(s)
5. Publish events (in-process handlers or message broker)
```

```typescript
class PlaceOrderHandler {
  constructor(
    private readonly orders: OrderRepository,
    private readonly customers: CustomerRepository,
    private readonly pricingService: PricingService,     // domain service
    private readonly publisher: DomainEventPublisher
  ) {}

  async handle(cmd: PlaceOrderCommand): Promise<OrderId> {
    // 1. Load
    const customer = await this.customers.findById(CustomerId.from(cmd.customerId));
    if (!customer) throw new CustomerNotFoundError(cmd.customerId);

    // 2. Execute domain logic
    const order = Order.create(
      OrderId.generate(),
      customer.id,
      ShippingAddress.from(cmd.shippingAddress)
    );

    for (const item of cmd.items) {
      const price = await this.pricingService.getPriceFor(item.productId, customer);
      order.addLine(ProductId.from(item.productId), Quantity.of(item.quantity), price);
    }

    order.place();

    // 3. Save
    await this.orders.save(order);

    // 4 & 5. Collect and publish events
    await this.publisher.publishAll(order.pullDomainEvents());

    return order.id;
  }
}
```

---

## VI. Summary

| Pattern | Role | Lives In | Key Rule |
| :-- | :--- | :--- | :--- |
| **Domain Service** | Cross-aggregate domain logic | Domain layer | Stateless; no infrastructure calls |
| **Application Service** | Orchestration | Application layer | No business logic; coordinates others |
| **Repository** | Aggregate persistence abstraction | Interface: Domain / Impl: Infrastructure | One per Aggregate Root |
| **Domain Event** | Record of a significant state change | Domain layer | Immutable, past tense, raised by aggregate |
| **Integration Event** | Cross-context communication | Infrastructure | Derived from domain events; published via message broker |

---

## Further Reading

- [Domain Events: Design and Implementation — Microsoft .NET Microservices](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation)
- [Domain Service and Repository Patterns for DDD — LinkedIn](https://www.linkedin.com/advice/1/how-can-you-use-domain-service-repository-design-vwbmc)
- [Microservices Pattern: Domain Event — microservices.io](https://microservices.io/patterns/data/domain-event.html)

---

*Next: Chapter 6 — DDD in Practice: Hexagonal Architecture, Clean Architecture, and CQRS — how all the pieces fit into a production system.*
