---
title: "Hexagonal Architecture, Clean, and N-layered Architecture"
description: "Three ways to structure the inside of an application — what they actually mean, how their dependency rules differ, and which one to reach for when."
tags: ["architecture", "clean-architecture", "hexagonal-architecture", "ports-and-adapters", "software-design", "system-design"]
date: "2026-04-22"
lang: "en"
draft: false
---

Every non-trivial application faces the same structural question: how do you keep business rules from drowning in infrastructure details? Over the last three decades, three answers have come to dominate the conversation — **N-layered architecture**, **Hexagonal Architecture** (Ports & Adapters), and **Clean Architecture**.

They are often presented as rivals. They are not. They are three points on the same line of evolution, each one tightening the rule about which way dependencies are allowed to point. Understanding that single thread is worth more than memorizing the diagrams.

---

## The only rule that matters: dependency direction

An application is a collection of modules that know about each other. "Knowing about" is an arrow in a dependency graph. Bad architectures have arrows pointing in whatever direction was convenient the day each file was written; good architectures have arrows pointing in one consistent direction, away from the parts that *must not* change.

Every architecture pattern below is a specific answer to the same question: **where do we let arrows point, and where do we forbid them?**

---

## N-layered Architecture

### Origin

No single inventor. The canonical references are **Martin Fowler's *Patterns of Enterprise Application Architecture*** (2002) and **Eric Evans's *Domain-Driven Design*** (2003). Fowler codified the three-layer split (Presentation / Domain / Data Source); Evans added an Application layer between Presentation and Domain.

### Structure

A vertical stack, each layer using only the one directly below:

```
  ┌──────────────────────┐
  │     Presentation     │   Controllers, views, DTOs
  ├──────────────────────┤
  │     Application      │   Workflows, transactions
  ├──────────────────────┤
  │       Domain         │   Business rules
  ├──────────────────────┤
  │   Data Access /      │   ORM, SQL, external APIs
  │   Infrastructure     │
  └──────────────────────┘
```

### Dependency rule

**Downward only.** Presentation depends on Application, which depends on Domain, which depends on Data Access.

### Trade-offs

The rule "domain depends on data access" is precisely the problem the next two architectures were invented to fix. When the domain imports `UserRepositorySql`, the business rules end up coupled to a particular database, a particular ORM, and — transitively — to every schema change. This is why N-layered codebases drift toward **anemic domain models**: business logic migrates up into "service" classes in the Application layer because the domain itself is too entangled with persistence to hold it.

It is still the right answer for a lot of code. CRUD apps, internal tools, anything whose business rules are "read a row, validate two fields, write a row" — N-layered is the simplest thing that works, and ceremony beyond that is a cost without a benefit.

### Common confusion: N-tier ≠ N-layered

**Layers** are a logical code organization. **Tiers** are physical deployment boundaries — separate processes or machines. A 3-layer app can run in 1 tier (monolith on one server) or 3 tiers (browser / app server / database). The words are used interchangeably in casual speech, but the distinction matters the moment you start reasoning about latency, deployment, or fault isolation.

---

## Hexagonal Architecture (Ports & Adapters)

### Origin

Introduced by **Alistair Cockburn**, first published in **2005** (HaT Technical Report 2005.02). Cockburn says he first drew the idea in 1994 for an OO teaching session and refined it for another decade on Ward Cunningham's wiki before renaming it **"Ports and Adapters"** in the final write-up. A revised treatment, *Hexagonal Architecture Explained* (Cockburn & Garrido de Paz), was published in 2024.

The goal, in Cockburn's own words, is to *"allow an application to be equally driven by users, programs, automated test or batch scripts, and to be developed and tested in isolation from its eventual run-time devices and databases."*

### Structure

```
   Primary adapters             Secondary adapters
   (drive the app)              (driven by the app)

   HTTP controller ──▶┐        ┌──▶ Postgres adapter
   CLI command    ──▶ │ PORTS  │
   Test harness   ──▶ │  APP   │◀── implements ──▶ SMTP adapter
                      │  CORE  │
   Message handler──▶ │        │──▶ Payment-gateway HTTP client
                      └────────┘
```

- **Ports** are interfaces defined by the application core.
- **Adapters** are concrete implementations of those ports that plug a specific technology in.
- **Primary / driving** adapters (left side) invoke the application.
- **Secondary / driven** adapters (right side) are invoked *by* the application through ports the core owns.

### Dependency rule

The application core depends on **nothing** outside itself. Adapters depend on ports that the core defines. All arrows point inward.

### Why a hexagon?

Six sides are not a semantic choice. Cockburn on the record: *"Pentagons and heptagons are impossible to draw, so hexagon was an unused shape. That's all."* The hexagon is a picture, not a prescription — there is no rule that you must have exactly six kinds of adapter.

### Trade-offs

Hexagonal is excellent at one thing: **swapping infrastructure**. Your database becomes a test double in unit tests, then Postgres in production, and the core never notices. But two costs come with it:

- **Port explosion.** Every new integration adds an interface pair. Small apps drown in `FooPort` / `FooAdapter` files that exist only to enforce the rule.
- **False symmetry.** Fowler observed that hexagonal *"hides the inherent asymmetry between a service provider and a service consumer that would better be represented as layers."* A controller calling the core is genuinely different from the core calling a database — the diagram makes them look the same.

---

## Clean Architecture

### Origin

**Robert C. Martin** ("Uncle Bob"), blog post **"The Clean Architecture"** (August 13, 2012) and the book *Clean Architecture: A Craftsman's Guide to Software Structure and Design* (2017). Martin explicitly names his sources: **Hexagonal** (Cockburn), **Onion Architecture** (Jeffrey Palermo, 2008), **DCI** (Coplien & Reenskaug), and **BCE** (Ivar Jacobson, 1992). Clean Architecture is his synthesis.

### Structure

Concentric rings, outer to inner:

```
   ┌─────────────────────────────────────────┐
   │  Frameworks & Drivers                   │
   │  (Web, DB, UI, External APIs)           │
   │  ┌───────────────────────────────────┐  │
   │  │  Interface Adapters               │  │
   │  │  (Controllers, Presenters,        │  │
   │  │   Gateways)                       │  │
   │  │  ┌─────────────────────────────┐  │  │
   │  │  │  Use Cases                  │  │  │
   │  │  │  (Application business      │  │  │
   │  │  │   rules)                    │  │  │
   │  │  │  ┌───────────────────────┐  │  │  │
   │  │  │  │  Entities             │  │  │  │
   │  │  │  │  (Enterprise business │  │  │  │
   │  │  │  │   rules)              │  │  │  │
   │  │  │  └───────────────────────┘  │  │  │
   │  │  └─────────────────────────────┘  │  │
   │  └───────────────────────────────────┘  │
   └─────────────────────────────────────────┘
```

### Dependency rule

Martin states it verbatim: *"Source code dependencies can only point inwards. Nothing in an inner circle can know anything at all about something in an outer circle."* Crossing a boundary outward requires the **Dependency Inversion Principle** — the inner ring declares an interface; the outer ring implements it.

### What is genuinely different from Hexagonal?

Hexagonal and Clean look similar — concentric "inside vs outside," arrows pointing inward — but they carry different emphases:

- **Hexagonal is symmetric.** Its central distinction is *driving vs driven* — two kinds of outside.
- **Clean is asymmetric.** Its central distinction is *enterprise rules (Entities) vs application rules (Use Cases)* — two kinds of inside.

Martin's argument against Hexagonal alone was that it *"fails to describe what he regards as a key aspect: architecture is about **intent** — what the application does."* That's why Clean adds a Use Cases ring (directly inherited from Jacobson's BCE model). An Entity models a user regardless of whether it's a web app or a CLI; a Use Case models a specific user-facing action — `RegisterNewUser`, `ChangeEmail` — in *this* application. Hexagonal says nothing about this split; Clean makes it structural.

### Trade-offs

- **Boilerplate and ceremony.** Every crossing of a ring boundary tends to grow a request DTO, a response DTO, an input port, an output port, and a mapper. For simple features this is pure overhead.
- **Anemic use cases.** The failure mode is a Use Case class that exists only to call `repository.save(user)`. If the use case has no rules of its own, you have paid the cost without the benefit.
- **Reflexive repository interfaces.** Teams sometimes add a `UserRepository` interface *purely because Clean Architecture says so*, with exactly one implementation that will never change. That is cargo-culting the rule, not applying it.

Three Dots Labs summarizes it well: Clean Architecture earns its keep in **long-lived domains with complex, evolving rules**. In short-lived or rule-light codebases, it is over-engineering.

---

## Side-by-side

| | N-layered | Hexagonal | Clean |
|---|---|---|---|
| **Coined by** | Fowler (PoEAA, 2002); Evans (DDD, 2003) | Cockburn (2005) | Martin (2012 blog, 2017 book) |
| **Primary concern** | Separation of responsibility | Isolating the core from infrastructure | Expressing intent (use cases) |
| **Shape** | Vertical stack | Hexagon with ports & adapters | Concentric rings |
| **Dependency direction** | Top → bottom | Outside → inside (through ports) | Outside → inside (through DIP) |
| **Domain knows about DB?** | Yes (transitively) | No | No |
| **Distinguishes entities from use cases?** | No | No | Yes |
| **Sweet spot** | CRUD, internal tools | Apps that must swap infrastructure | Long-lived domains with rich rules |

---

## The family tree

It helps to see these as a lineage rather than a menu:

1. **N-layered** (1990s–2002) — layers, downward dependency.
2. **Hexagonal** (2005) — invert the dependency: core defines ports; adapters implement them.
3. **Onion** (Palermo, 2008) — same inversion, but drawn as concentric rings, with repository *interfaces* owned by the domain.
4. **Clean** (Martin, 2012) — Onion's rings plus an explicit **Use Cases** layer borrowed from Jacobson's BCE.

Each step preserves the previous step's rule and adds a new constraint. If you have internalized *"dependencies point inward, crossed only through interfaces the inside defines"*, you have understood all three of the modern ones.

---

## Common mistakes

- **Treating the hexagon's six sides as meaningful.** They aren't. Cockburn picked it because pentagons and heptagons are hard to draw.
- **Confusing N-tier with N-layered.** Tiers are physical; layers are logical. You can have one without the other.
- **Believing Clean Architecture requires DDD.** It doesn't. Entities can be any business object. They compose well, but neither implies the other.
- **Treating the four Clean rings as mandatory.** Martin says they are illustrative; the *rule* is mandatory, the exact number of rings is not.
- **Applying Clean to a CRUD app.** The ceremony overwhelms the benefit. N-layered is not a failure; it is a deliberate choice for the right shape of problem.

---

## How to pick

A short decision rule that holds up in practice:

- **The business rules are thin and the app is mostly moving data around?** N-layered. Don't buy insurance against complexity that isn't coming.
- **The business rules matter and you expect infrastructure to change (swap DB, add a CLI, support a message queue later)?** Hexagonal. You are paying for the ability to replace adapters.
- **The business rules matter *and* the application will live for years with new use cases added on top of stable entities?** Clean. You are paying to keep intent legible as the codebase grows.

Architecture is not a test you pass. It is a trade you make, knowing what you are trading.

---

## Key takeaways

- The three architectures are variations on a single theme: which direction do dependencies point.
- **N-layered** allows domain-to-infrastructure coupling; **Hexagonal** and **Clean** forbid it via ports and the Dependency Inversion Principle.
- **Hexagonal** emphasizes *driving vs driven* (two kinds of outside). **Clean** emphasizes *entities vs use cases* (two kinds of inside).
- Use the simplest one the problem permits. Clean on a CRUD app is over-engineering; N-layered on a long-lived domain is debt.
- Remember the pictures are maps, not territory. The six-sided hexagon, the four rings — both are conventions, not requirements. The rule about dependency direction is what you are actually buying.
