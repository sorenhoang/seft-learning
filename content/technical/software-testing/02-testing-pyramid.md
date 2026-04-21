---
title: "The Testing Pyramid & Types of Tests"
order: 2
tags: ["testing", "pyramid", "unit-tests", "integration-tests", "e2e"]
date: "2026-04-21"
draft: false
---

If you only learn one mental model about testing, learn the testing pyramid. It is the single most useful heuristic for deciding what kinds of tests to write, how many of each, and where to invest your time when the suite gets slow or flaky.

## The Pyramid in One Picture

Mike Cohn introduced the testing pyramid in *Succeeding with Agile* (2009). It looks like this:

```
          /\
         /  \        End-to-End (E2E)     — slow, brittle, few
        /----\
       /      \      Integration          — moderate speed, moderate count
      /--------\
     /          \    Unit                 — fast, stable, many
    /____________\
```

The shape encodes three claims:

1. You should have **many unit tests**, **fewer integration tests**, and **very few E2E tests**.
2. The further up you go, the slower, more brittle, and more expensive tests become.
3. The further down you go, the more precisely tests localize bugs.

The shape is not dogma — it is a default that works for most business software. Later in this chapter we'll look at when to deviate.

## The Three Layers

### Unit Tests — The Base

A **unit test** exercises a single "unit" of code — usually a function, class, or small module — in isolation from its dependencies. It does not touch the database, the network, the filesystem, or another service. It runs in milliseconds. You can have thousands of them and still finish in under a minute.

```python
def test_calculate_discount_for_premium_user():
    user = User(tier="premium")
    assert calculate_discount(user, price=100) == 20
```

**What unit tests are good at:**
- Pinpointing exactly which function broke
- Fast feedback (run on every save, in your editor)
- Forcing you to design code that is testable — which usually means decoupled
- Covering edge cases exhaustively (empty inputs, negatives, nulls)

**What they are bad at:**
- Catching bugs caused by interactions between components
- Verifying that the system as a whole actually works
- Telling you whether the user's login flow succeeds

Unit tests answer: *"Does this piece, considered alone, behave correctly?"*

### Integration Tests — The Middle

An **integration test** exercises multiple units working together, often including real external dependencies like a database or a message queue. It runs in tens to hundreds of milliseconds, sometimes seconds. You have dozens to low hundreds of them.

```python
def test_user_registration_persists_to_db(db):
    result = register_user(email="a@b.com", password="secret", db=db)
    stored = db.users.find_one(email="a@b.com")
    assert stored is not None
    assert stored.id == result.user_id
```

**What integration tests are good at:**
- Verifying contracts between components (does service A actually call service B correctly?)
- Catching configuration errors, schema mismatches, and serialization bugs
- Exercising real SQL queries, real HTTP clients, real authentication flows

**What they are bad at:**
- Speed — every test spins up a real database or mocks a real one
- Isolation — a bug in module A can cause every integration test touching it to fail
- Stability — real databases mean real network, real flakiness

Integration tests answer: *"Do these pieces, wired together, behave correctly?"*

### End-to-End Tests — The Tip

An **end-to-end (E2E) test** drives the full system from the outside: a real browser clicking real buttons, or a real HTTP client hitting a real API. Everything — frontend, backend, database, third-party services — is running. It takes seconds to minutes per test. You have a handful of them, covering only critical user journeys.

```javascript
test('user can sign up, log in, and see the dashboard', async ({ page }) => {
  await page.goto('/signup');
  await page.fill('[name=email]', 'a@b.com');
  await page.fill('[name=password]', 'secret');
  await page.click('button[type=submit]');
  await expect(page.locator('h1')).toHaveText('Welcome');
});
```

**What E2E tests are good at:**
- The ultimate confidence check: the happy paths actually work
- Catching integration bugs that no layered test could catch (e.g., a CDN misconfiguration)
- Giving product stakeholders something concrete to watch

**What they are bad at:**
- Everything else. They are slow, flaky, hard to debug when they fail, and expensive to maintain.

E2E tests answer: *"Does the full system, running end-to-end, behave correctly for this one critical journey?"*

## Why the Pyramid Shape?

The shape is driven by a brutal tradeoff: **feedback speed vs. realism.**

| Dimension          | Unit      | Integration | E2E         |
| :----------------- | :-------- | :---------- | :---------- |
| Speed              | ms        | 10–1000 ms  | seconds–min |
| Stability          | very high | moderate    | flaky       |
| Bug localization   | precise   | section     | vague       |
| Setup complexity   | trivial   | moderate    | complex     |
| Realism            | low       | medium      | high        |

You want **many** fast, stable tests — so the base is wide. You want **some** realistic checks — so you have a tip. You do not want to invert this, because inverted pyramids give you slow feedback, flaky CI, and a suite everyone dreads.

## Anti-Patterns: When the Pyramid Tips Over

### The Ice-Cream Cone (Inverted Pyramid)

```
    ____________
    \          /     Many E2E tests
     \--------/
      \      /       Some integration tests
       \----/
        \  /         Very few unit tests
         \/
```

This is what happens when a team delegates testing to a QA group that only has tools for UI automation. The symptoms are recognizable: a three-hour CI pipeline, a Slack channel full of "anyone else seeing this flake?", and developers who have stopped trusting the build.

The fix is not to delete the E2E tests but to rebuild the base — adding unit and integration tests for the logic the E2E tests are currently covering, then deleting the E2E tests whose coverage is now redundant.

### The Cupcake

```
         /\
        /  \       E2E tests
       /----\
      /      \
     /--------\    Very few integration tests
    /          \
   /____________\   Many unit tests
```

Healthy base, healthy tip — but nothing in the middle. This often comes from teams that embrace unit testing religiously and then "smoke test" with E2E, skipping integration entirely. The gap shows up as bugs in the plumbing: a unit test says the code is correct, an E2E test says the flow works, but a SQL query has the wrong column name and nobody noticed until production.

### The Hourglass

```
     \    /
      \  /       Many E2E tests
       \/
       /\
      /  \       Few integration tests
     /    \
    /______\      Many unit tests
```

A specific and painful variant: a healthy base, a healthy tip, and no middle. Usually caused by teams that skipped integration testing because "it's covered by E2E" and then added more E2E tests to compensate for the bugs the integration tests would have caught cheaply.

## Modern Variations

The pyramid is a *heuristic*, not a law. Several alternative shapes have emerged for contexts where the classic pyramid doesn't quite fit.

### The Testing Trophy (Kent C. Dodds)

```
        E2E
     ==========
    Integration     ← biggest layer
    ==========
     Unit
    ==
   Static
```

Popular in the frontend world. The argument: with modern tooling (Testing Library, MSW), integration tests are cheap and give the best confidence per minute of test time. Static analysis (TypeScript, ESLint) catches whole classes of bugs for free, forming a wide base.

### The Testing Honeycomb (Spotify)

For microservices, Spotify proposed the honeycomb: heavy on integration tests, light on both unit and E2E. The reasoning: in a service whose job is to orchestrate other services, "unit logic" is thin and most risk lives in the boundaries.

### Contract Tests

When E2E tests get impractical (dozens of microservices, flaky staging environments), **consumer-driven contract tests** — via tools like Pact — let each service verify its contract with its collaborators without ever starting them all up together. Each service runs fast tests in isolation, and the contracts ensure they agree on the wire format.

## Choosing a Shape

A rough decision tree:

- **Monolithic web app, small team** → Classic pyramid.
- **Frontend-heavy SPA** → Testing trophy, with integration tests using real components + mocked network.
- **Microservices architecture** → Honeycomb plus contract tests; keep E2E scoped to top 3–5 user journeys.
- **Data pipeline / batch job** → Heavy on unit tests of transform logic, plus a few integration tests with fixture data.
- **Legacy system with no tests** → Start from the top: a handful of E2E tests give you a safety net to refactor under, then push down into integration and unit as you go (the "strangler fig" approach to testing).

## A Practical Rule of Thumb

If you are arguing about what shape you should use, stop arguing and look at your pain.

- Is CI slow? Move tests down the pyramid.
- Is CI flaky? Move tests down the pyramid.
- Are production bugs frequent in integration points? Add integration tests.
- Are production bugs frequent in single-function logic? Add unit tests.
- Are production bugs frequent in user journeys? Add E2E tests — reluctantly, and few.

The shape of your test suite should match the shape of your bugs.

## What's Next

Now that we know *what kinds of tests* to write, the next chapter looks at *when to write them*. We'll cover test-driven development — writing tests before code — and its cousin, behavior-driven development.

---
*Next: Test-Driven Development (TDD) & BDD — writing tests first as a design tool, not just a verification step.*
