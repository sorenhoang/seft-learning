---
title: "DDD in Practice — Hexagonal Architecture, Clean Architecture & CQRS"
tags: ["ddd", "system-design", "software-architecture", "clean-architecture", "cqrs", "hexagonal-architecture", "backend"]
date: "2026-04-20"
order: 6
cover: "https://res.cloudinary.com/dmwr6giop/image/upload/q_auto/f_auto/v1776653166/ddd-ch6-architecture_mwjjsj.png"
draft: false
---

## I. DDD Without Architecture is Half the Job

The previous chapters built the domain model: Entities, Value Objects, Aggregates, Domain Services, Repositories, Domain Events. But a model alone doesn't tell you *how to structure your project files*, *which layer depends on which*, or *how to keep infrastructure from leaking into domain logic*.

Architecture patterns answer these questions. Three have become the standard companions to DDD:

- **Hexagonal Architecture** (Ports & Adapters) — isolates the domain from infrastructure
- **Clean Architecture** — adds explicit layer separation and dependency rules
- **CQRS** (Command Query Responsibility Segregation) — separates reads from writes for scalability and clarity

None of these are required by DDD. But each solves a real problem that DDD-based systems frequently encounter.

---

## II. Hexagonal Architecture — The Domain at the Center

Introduced by Alistair Cockburn, **Hexagonal Architecture** (also called Ports & Adapters) places the **application core — the domain — at the center**, surrounded by **ports** (interfaces) and **adapters** (implementations).

```
                ┌─────────────────────────────────────────┐
  HTTP Request  │              Adapters                   │
  ─────────────▶│  ┌──────────────────────────────────┐  │
  CLI Command   │  │         Application Core         │  │
  ─────────────▶│  │  ┌──────────────────────────┐   │  │
  Message Queue │  │  │    Domain Model          │   │  │
  ─────────────▶│  │  │  Entities, Aggregates,   │   │  │
                │  │  │  Value Objects, Services │   │  │
                │  │  └──────────────────────────┘  │  │
                │  │  Application Services           │  │
                │  │  (Ports defined here)           │  │
                │  └──────────────────────────────────┘  │
                │  Adapters: DB, Email, HTTP clients      │
                └─────────────────────────────────────────┘
```

### Ports — The Contracts

Ports are **interfaces** defined by the application core. There are two types:

**Driving Ports** (inbound): How the outside world interacts with the application.
```typescript
// Primary / driving port — defined in the application layer
interface OrderApplicationService {
  placeOrder(command: PlaceOrderCommand): Promise<OrderId>;
  confirmOrder(command: ConfirmOrderCommand): Promise<void>;
  cancelOrder(command: CancelOrderCommand): Promise<void>;
}
```

**Driven Ports** (outbound): What the application needs from the outside world.
```typescript
// Secondary / driven ports — defined in domain/application layer
interface OrderRepository {
  findById(id: OrderId): Promise<Order | null>;
  save(order: Order): Promise<void>;
}

interface PaymentGateway {
  charge(request: PaymentRequest): Promise<PaymentResult>;
}

interface EmailNotifier {
  sendOrderConfirmation(to: Email, orderId: OrderId): Promise<void>;
}
```

### Adapters — The Implementations

Adapters implement ports using concrete technology. They live in the **outermost layer** and depend inward.

```typescript
// HTTP Adapter (driving)
@Controller('/orders')
class OrderController {
  constructor(private readonly service: OrderApplicationService) {}

  @Post('/')
  async placeOrder(@Body() body: PlaceOrderRequest): Promise<{ orderId: string }> {
    const orderId = await this.service.placeOrder(
      new PlaceOrderCommand(body.customerId, body.items, body.shippingAddress)
    );
    return { orderId: orderId.value };
  }
}

// PostgreSQL Adapter (driven)
class PostgresOrderRepository implements OrderRepository {
  async findById(id: OrderId): Promise<Order | null> {
    const row = await this.db.query('SELECT * FROM orders WHERE id = $1', [id.value]);
    return row ? this.toDomain(row) : null;
  }
  async save(order: Order): Promise<void> { /* ... */ }
}

// Stripe Adapter (driven)  
class StripePaymentGateway implements PaymentGateway {
  async charge(request: PaymentRequest): Promise<PaymentResult> {
    const charge = await stripe.charges.create({ /* ... */ });
    return this.toDomain(charge);
  }
}
```

### Why This Matters for Testing

With Hexagonal Architecture, you can test the entire domain and application layer **without starting a database or HTTP server**:

```typescript
// Test with in-memory adapters — fast, no infrastructure
describe('PlaceOrderService', () => {
  let service: OrderApplicationServiceImpl;
  let orderRepo: InMemoryOrderRepository;
  let paymentGateway: MockPaymentGateway;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    paymentGateway = new MockPaymentGateway();
    service = new OrderApplicationServiceImpl(orderRepo, paymentGateway);
  });

  it('should create an order with correct total', async () => {
    const orderId = await service.placeOrder(/* command */);
    const order = await orderRepo.findById(orderId);
    expect(order?.total()).toEqual(Money.of(99.99, 'USD'));
  });
});
```

---

## III. Clean Architecture — Adding Explicit Layers

Robert C. Martin's **Clean Architecture** formalizes Hexagonal's concepts into four explicit concentric layers with a single rule: **dependencies only point inward**.

```
         ┌─────────────────────────────────────────┐
         │         Frameworks & Drivers            │  ← Outermost: Express, NestJS,
         │  ┌───────────────────────────────────┐  │              PostgreSQL driver
         │  │      Interface Adapters           │  │  ← Controllers, Presenters,
         │  │  ┌─────────────────────────────┐  │  │    Repository Implementations
         │  │  │    Application Layer        │  │  │  ← Use Cases, Application Services
         │  │  │  ┌───────────────────────┐  │  │  │
         │  │  │  │   Domain Layer        │  │  │  │  ← Innermost: Entities, VOs,
         │  │  │  │  (Entities, VOs,      │  │  │  │    Aggregates, Domain Services
         │  │  │  │   Aggregates)         │  │  │  │
         │  │  │  └───────────────────────┘  │  │  │
         │  │  └─────────────────────────────┘  │  │
         │  └───────────────────────────────────┘  │
         └─────────────────────────────────────────┘

         Dependencies: Outer → Inner (never Inner → Outer)
```

### The Dependency Rule

The domain layer knows nothing about the application layer. The application layer knows nothing about HTTP or databases. This means:

```typescript
// ✅ Domain layer — zero imports from outer layers
class Order {
  // No framework imports. No database drivers. No HTTP libraries.
  // Just pure TypeScript/business logic.
  confirm(): void { /* ... */ }
}

// ✅ Application layer — knows domain, defines ports, no concrete infrastructure
class ConfirmOrderHandler {
  constructor(
    private readonly orders: OrderRepository, // interface, not postgres implementation
    private readonly publisher: DomainEventPublisher // interface, not kafka
  ) {}
  async handle(command: ConfirmOrderCommand): Promise<void> { /* ... */ }
}

// ✅ Infrastructure layer — implements ports, depends on domain + framework
class KafkaDomainEventPublisher implements DomainEventPublisher {
  async publishAll(events: DomainEvent[]): Promise<void> {
    // Uses Kafka — outer layer knows about Kafka, inner layers do not
  }
}
```

---

## IV. Project Structure

The architecture maps to a clear folder structure:

```
src/
├── domain/                         # Inner layer — pure domain
│   ├── order/
│   │   ├── Order.ts                # Aggregate root
│   │   ├── OrderLine.ts            # Child entity
│   │   ├── OrderStatus.ts          # Value object
│   │   ├── OrderRepository.ts      # Port (interface)
│   │   └── events/
│   │       ├── OrderConfirmed.ts   # Domain event
│   │       └── OrderCancelled.ts
│   └── shared/
│       ├── Money.ts                # Shared value object
│       └── DomainEvent.ts
│
├── application/                    # Application layer — use cases
│   ├── order/
│   │   ├── PlaceOrderHandler.ts    # Application service / command handler
│   │   ├── ConfirmOrderHandler.ts
│   │   └── GetOrderQueryHandler.ts # Query handler
│   └── shared/
│       └── DomainEventPublisher.ts # Port (interface)
│
├── infrastructure/                 # Outer layer — concrete implementations
│   ├── persistence/
│   │   └── PostgresOrderRepository.ts
│   ├── messaging/
│   │   └── KafkaEventPublisher.ts
│   ├── payment/
│   │   └── StripePaymentGateway.ts
│   └── http/
│       └── OrderController.ts
│
└── main.ts                         # Composition root — wires everything together
```

---

## V. CQRS — Separating Reads from Writes

**Command Query Responsibility Segregation** separates your system into two sides:

- **Command side**: Handles state-changing operations (Place Order, Confirm Order, Cancel Order). Uses the full DDD model.
- **Query side**: Handles read operations (Get Order, List Orders). Uses optimized read models.

### Why CQRS with DDD?

DDD Aggregates are optimized for **consistency and business rules** — not for query performance. An `Order` Aggregate enforces invariants across its lines, discount, and status. But a "list all orders with customer name and total" query doesn't need any of that — it just needs flat, denormalized data, fast.

CQRS lets you have both:

```
Commands → Domain Model (Aggregates, Events) → Write Database
Queries  → Read Model (Projections, Views)   → Read Database (optimized)
```

### Command Side (Write)

```typescript
// Commands are value objects describing intent
class PlaceOrderCommand {
  constructor(
    public readonly customerId: string,
    public readonly items: OrderItemInput[],
    public readonly shippingAddress: AddressInput
  ) {}
}

// Command Handler executes against domain model
class PlaceOrderHandler {
  async handle(command: PlaceOrderCommand): Promise<OrderId> {
    const customer = await this.customers.findById(CustomerId.from(command.customerId));
    const order = Order.create(OrderId.generate(), customer.id, /* ... */);
    // ... add lines, validate, etc.
    order.place();
    await this.orders.save(order);
    await this.publisher.publishAll(order.pullDomainEvents());
    return order.id;
  }
}
```

### Query Side (Read)

```typescript
// Read model — flat, optimized for the UI
interface OrderSummary {
  orderId: string;
  customerName: string;
  customerEmail: string;
  status: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
  placedAt: string;
}

// Query handler — bypasses the domain model entirely
class GetOrderSummaryHandler {
  async handle(query: GetOrderQuery): Promise<OrderSummary | null> {
    // Direct SQL query against a read-optimized view or table
    return this.db.queryOne<OrderSummary>(
      `SELECT 
         o.id as "orderId",
         c.name as "customerName",
         c.email as "customerEmail",
         o.status,
         o.total_amount as "totalAmount",
         o.currency,
         COUNT(ol.id) as "itemCount",
         o.placed_at as "placedAt"
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       LEFT JOIN order_lines ol ON ol.order_id = o.id
       WHERE o.id = $1
       GROUP BY o.id, c.name, c.email`,
      [query.orderId]
    );
  }
}
```

### Projections — Keeping Read Models Current

When the write side publishes a `OrderConfirmed` event, a **projection** updates the read model:

```typescript
class OrderReadModelProjector {
  async onOrderConfirmed(event: OrderConfirmed): Promise<void> {
    await this.db.execute(
      `UPDATE order_summaries 
       SET status = 'CONFIRMED', confirmed_at = $2
       WHERE order_id = $1`,
      [event.orderId.value, event.occurredOn]
    );
  }
}
```

---

## VI. Putting It All Together — The Full Picture

Here is the complete data flow for a "Place Order" command in a full DDD + Hexagonal + CQRS system:

```
HTTP POST /orders
    │
    ▼
OrderController (Adapter / Driving)
    │  maps HTTP request → PlaceOrderCommand
    ▼
PlaceOrderHandler (Application Layer)
    │  1. Load Customer from CustomerRepository
    │  2. Create Order aggregate
    │  3. Add OrderLines via domain logic
    │  4. Call PricingService (domain service)
    │  5. Call order.place() — raises OrderPlaced event
    │  6. Save Order to OrderRepository
    │  7. Pull and publish domain events
    ▼
PostgresOrderRepository (Adapter / Driven)
    │  persists Order aggregate to DB
    ▼
KafkaEventPublisher (Adapter / Driven)
    │  publishes OrderPlaced to Kafka topic
    ▼
OrderReadModelProjector (Consumer)
    │  updates order_summaries read table
    ▼
InventoryReservationConsumer (Different Bounded Context)
    │  subscribes to orders.placed topic
    │  reserves inventory asynchronously
```

---

## VII. When to Use Each Pattern

| Pattern | Use When |
| :-- | :--- |
| **Hexagonal Architecture** | Always — it's the foundation for testable DDD |
| **Clean Architecture** | When you want explicit layer contracts enforced at the folder level |
| **CQRS (simple)** | When read and write models have clearly different shapes |
| **CQRS + Event Sourcing** | When you need full audit trail or temporal queries |

**Start simple**: You can apply Hexagonal Architecture and DDD tactical patterns without CQRS. Add CQRS when your read and write needs diverge significantly.

---

## VIII. The Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│  Domain Layer (innermost)                                   │
│  Entities · Value Objects · Aggregates · Domain Services    │
│  Domain Events · Repository Interfaces                      │
├─────────────────────────────────────────────────────────────┤
│  Application Layer                                          │
│  Command Handlers · Query Handlers · Application Services   │
│  Port Interfaces (secondary)                                │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer (outermost)                           │
│  Controllers (HTTP/gRPC/CLI) · Repository Implementations   │
│  Event Publishers · External Service Adapters               │
└─────────────────────────────────────────────────────────────┘

Dependency rule: outer layers depend on inner layers. Never reverse.
```

---

## IX. Summary

| Architecture | Problem it Solves |
| :-- | :--- |
| **Hexagonal** | Keeps infrastructure out of the domain; enables swappable adapters |
| **Clean Architecture** | Explicit layer boundaries with enforced dependency direction |
| **CQRS** | Read and write models optimized independently; better scalability |
| **Together** | Testable, evolvable, infrastructure-agnostic domain model |

The pattern is consistent across all three: **put the domain at the center, push infrastructure to the edges, and let interfaces define the contracts between layers**.

---

## Further Reading

- [DDD, Hexagonal, Onion, Clean, CQRS — How I Put It All Together](https://herbertograca.com/2017/11/16/explicit-architecture-01-ddd-hexagonal-onion-clean-cqrs-how-i-put-it-all-together/) — Herberto Graça
- [Domain-Driven Design and Hexagonal Architecture in Java — Vaadin](https://vaadin.com/blog/ddd-part-3-domain-driven-design-and-the-hexagonal-architecture)
- [Domain-Driven Hexagon — GitHub (Sairyss)](https://github.com/Sairyss/domain-driven-hexagon) — Full reference implementation with examples
- [Hexagonal Architecture, DDD, and Spring — Baeldung](https://www.baeldung.com/hexagonal-architecture-ddd-spring)

---

*You have completed the Domain-Driven Design series. The next step: pick a real bounded context in a system you know, model it with these patterns, and let the domain drive the design.*
