---
title: "Test-Driven Development: Writing Tests Before Code"
description: "A comprehensive guide to TDD — from the Red-Green-Refactor cycle and the Three Laws to practical patterns, anti-patterns, and real-world workflows across backend, frontend, and legacy systems."
tags: ["TDD", "Testing", "Software Engineering", "Clean Code", "Refactoring"]
date: "2026-04-19"
draft: false
---

# Test-Driven Development: Writing Tests Before Code

Test-Driven Development (TDD) is a software development methodology where you write a failing automated test *before* writing the production code that makes it pass. The practice inverts the conventional sequence of "write code, then test" into "write test, then code, then clean up."

TDD is not primarily about testing. It is a **design technique** that uses tests as a forcing function to produce small, decoupled, well-defined units of behavior. The tests are a byproduct — the real output is better-designed code.

## Origin

TDD was developed (or as Kent Beck prefers to say, "rediscovered") by Kent Beck in the late 1990s as a core practice within Extreme Programming (XP).

- **1994** — Beck created SUnit, a Smalltalk testing framework, laying the groundwork for test-first development.
- **1999** — Beck published *Extreme Programming Explained*, which codified TDD as a first-class XP practice.
- **2003** — Beck published *Test Driven Development: By Example*, the definitive reference that brought TDD to mainstream adoption.

As Beck puts it, TDD is about **confidence management** — you make small, provable steps that keep you in a state of known-good at all times.

---

## The Red-Green-Refactor Cycle

The Red-Green-Refactor cycle is the heartbeat of TDD. Each cycle should take roughly **1–10 minutes**.

### Red: Write a Failing Test

Write a test that describes a single new behavior. Run it. It **must fail** (or fail to compile). This phase forces you to think about the *interface* before the *implementation*.

```typescript
describe('isValidEmail', () => {
  it('should return false for a string without @', () => {
    expect(isValidEmail('invalid-email')).toBe(false);
  });
});
```

At this point, `isValidEmail` does not exist. The test fails with a reference error. That is correct.

### Green: Make It Pass with Minimal Code

Write the **simplest, smallest** amount of production code that makes the test pass. Do not over-engineer. Hard-coding a return value is legitimate if only one test exists.

```typescript
function isValidEmail(email: string): boolean {
  return false;
}
```

The test passes. You are green.

### Refactor: Clean Up While Green

With a passing test suite as your safety net, improve the code's structure — remove duplication, rename for clarity, extract functions — **without changing external behavior**. Run all tests after every change.

Then you add the next test, which goes red, and the cycle repeats:

```typescript
// Next red test
it('should return true for user@example.com', () => {
  expect(isValidEmail('user@example.com')).toBe(true);
});

// Green: expand the implementation
function isValidEmail(email: string): boolean {
  return email.includes('@');
}

// Next red test drives more specificity
it('should return false for user@', () => {
  expect(isValidEmail('user@')).toBe(false);
});

// Green: refine
function isValidEmail(email: string): boolean {
  const parts = email.split('@');
  return parts.length === 2 && parts[0].length > 0 && parts[1].includes('.');
}
```

Each cycle produces a small, verified increment. You never write production code without a failing test demanding it.

---

## The Three Laws of TDD

Robert C. Martin (Uncle Bob) codified TDD's finest-grained rhythm into three laws:

1. **You must write a failing test before you write any production code.**
2. **You must not write more of a test than is sufficient to fail, or fail to compile.**
3. **You must not write more production code than is sufficient to make the currently failing test pass.**

These three laws enforce a nano-cycle — the smallest possible iteration. The practical consequences:

- You never write a function "because you will need it later." You write it because a test demands it **now**.
- You never gold-plate. The test specifies exactly what is needed, and you stop there.
- Your codebase is never more than a few seconds away from a fully passing state.
- Debugging becomes nearly unnecessary because any failure is located within the last few lines you typed.

Uncle Bob describes TDD's cycles at multiple scales:

| Scale | Timeframe | What happens |
|:--|:--|:--|
| **Nano-cycle** | Seconds | The three laws above |
| **Micro-cycle** | Minutes | Red-Green-Refactor |
| **Milli-cycle** | Hours | Specific-to-Generic progression |
| **Primary cycle** | Days | Acceptance test drives multiple micro-cycles |

---

## Inside-Out vs Outside-In TDD

There are two major schools of TDD, each with a different starting point and testing philosophy.

### Chicago/Detroit School (Inside-Out)

Start from the **innermost domain logic** and work outward. Build small, self-contained units first, compose them into larger units, and let the architecture **emerge** from the tests.

**Testing style:** State-based verification. Assert on returned values or resulting state. Real collaborators are used whenever possible — mocks are a last resort.

```typescript
// Chicago style: test the domain object directly
it('should calculate order total', () => {
  const order = new Order();
  order.addItem({ name: 'Widget', price: 9.99, quantity: 2 });
  order.addItem({ name: 'Gadget', price: 14.99, quantity: 1 });

  expect(order.total()).toBe(34.97);
});
```

**Strengths:** Tests are decoupled from implementation details, enabling aggressive refactoring.

**Weaknesses:** Components built in isolation may not integrate well. Architecture can take time to emerge.

### London School (Outside-In)

Start from the **outermost layer** (e.g., an API controller) and work inward. Each layer's collaborators are mocked, so you design the interaction protocols between objects before implementing them.

**Testing style:** Interaction-based verification. Assert that the system under test sent the correct messages to its collaborators.

```typescript
// London style: mock dependencies, verify interactions
it('should delegate to payment service on checkout', () => {
  const paymentService = mock<PaymentService>();
  const controller = new CheckoutController(paymentService);

  controller.checkout(orderData);

  expect(paymentService.charge).toHaveBeenCalledWith(
    orderData.total,
    orderData.paymentMethod
  );
});
```

**Strengths:** Forces clear interface definitions up front. Works well when interaction design matters.

**Weaknesses:** Heavy mocking couples tests to implementation details. Internal refactoring breaks tests.

### When to Use Each

| Situation | Recommendation |
|:--|:--|
| Core domain logic, algorithms | Chicago (state-based, minimal mocks) |
| Designing interactions between services | London (mock collaborators, verify protocols) |
| Legacy code with unclear boundaries | Chicago (characterization tests with real objects) |
| Greenfield with clear layered architecture | London (outside-in drives clean interfaces) |
| Pragmatic modern teams | Blend both |

---

## TDD vs Traditional Testing

| Dimension | TDD (Test-First) | Traditional (Test-After) |
|:--|:--|:--|
| **When tests are written** | Before production code | After production code is "done" |
| **Design influence** | Tests shape the API and architecture | Tests are constrained by existing code |
| **Coverage** | High by construction | Often incomplete |
| **Test quality** | Tests describe intended behavior | Tests often describe current implementation |
| **False positives** | Every test was confirmed to fail before passing | Tests may pass accidentally |
| **Refactoring confidence** | High — comprehensive suite exists from the start | Low — test suite has gaps |
| **Debugging workflow** | Bug is in the last few lines written | Bug could be anywhere |
| **Perceived speed** | Slower per-feature initially | Faster initially, slower in maintenance |

A critical advantage of TDD: because every test was first seen in a **red/failing** state, you have proof that the test can actually detect a failure. In test-after development, tests that have never been seen to fail may contain bugs of their own that silently reduce the suite's value.

---

## Benefits of TDD

### Design Feedback Loop

If a unit is hard to test, that difficulty is *information* about the design: the unit has too many dependencies, unclear responsibilities, or hidden side effects. TDD forces you to confront these problems at the moment of creation rather than months later.

### Regression Safety Net

Every test becomes a permanent sentinel. As the suite grows, it provides an increasingly comprehensive safety net. Projects with comprehensive test suites detect defects **2–5x earlier** in the development process, dramatically reducing remediation costs.

### Living Documentation

A well-written test suite is the most accurate documentation of what the system does, because unlike comments or wiki pages, **tests fail when they become out of date**. The test names describe behavior in plain language: `should reject expired tokens`, `should retry on transient failure`.

### Confidence and Velocity

Research from IBM and Microsoft shows TDD teams reduce defect density by **40–90%**. The confidence to refactor aggressively without fear of regression is the compound interest of TDD.

### Reduced Debugging Time

When a test fails, you know the bug is in the code you wrote since the last green state — typically a few lines. Debugging sessions shrink from hours to seconds.

---

## Common Misconceptions

### "TDD is slow"

TDD adds time to the *writing* phase but removes much more from the *debugging, integration, and maintenance* phases. The slowdown is real but temporary — especially for developers new to TDD. Once the practice becomes habitual, the net velocity increases.

### "100% coverage = quality"

Coverage is a *trailing indicator*, not a goal. Kent Beck himself has said: "I would be suspicious of anything like 100% — it would smell of someone writing tests to make the coverage numbers happy, but not thinking about what they are testing." The TDD community generally considers **70–90%** meaningful coverage a healthier target.

### "TDD means no bugs"

TDD dramatically reduces regressions, interface mismatches, and logical errors in individual units. But it does not eliminate concurrency issues, distributed system failures, performance problems, UX problems, or requirements misunderstandings. TDD must be complemented with integration tests, end-to-end tests, monitoring, and human judgment.

### "TDD doesn't work for UI"

TDD works for UI when you test *behavior* rather than *pixels*. React Testing Library's philosophy — "test what the user sees, not how the component is implemented" — is fundamentally TDD-compatible. Visual regression testing (Storybook, Chromatic) complements TDD for the visual layer.

### "TDD is just about writing unit tests"

TDD is a design methodology that *produces* unit tests as a byproduct. The primary purpose is to drive better design decisions through rapid feedback. The discipline of thinking about behavior before implementation is the real payoff.

---

## Practical Patterns

### Arrange-Act-Assert (AAA)

The most common structure for individual test cases:

```typescript
it('should apply 10% discount for orders over $100', () => {
  // Arrange
  const order = new Order();
  order.addItem({ name: 'Expensive Widget', price: 150.00, quantity: 1 });
  const discountService = new DiscountService();

  // Act
  const result = discountService.applyDiscount(order);

  // Assert
  expect(result.total).toBe(135.00);
  expect(result.discountApplied).toBe(true);
});
```

### Given-When-Then (GWT)

Originating from BDD (Dan North), this pattern uses natural-language phrasing and is semantically identical to AAA:

```
Given an order with items totaling $150
When the discount service processes the order
Then the total should be $135 with discount applied
```

Given = Arrange, When = Act, Then = Assert. The value of GWT is communication — it is readable by product managers and QA engineers, not just developers.

### Test Doubles

Test doubles are stand-ins for real dependencies. Gerard Meszaros defined the canonical taxonomy:

**Dummy** — Passed around but never used. Satisfies a parameter list.

```typescript
const dummyLogger = {} as Logger;
```

**Stub** — Returns predetermined data. No verification of how it was called.

```typescript
const stubRepo = { findById: () => ({ id: 1, name: 'Alice' }) };
```

**Spy** — Records calls for later inspection.

```typescript
const spy = jest.fn().mockReturnValue(true);
service.process(spy);
expect(spy).toHaveBeenCalledTimes(1);
```

**Mock** — Pre-programmed with expectations. Fails the test if not called correctly. Mocks verify **interactions**.

```typescript
const mockNotifier = mock<Notifier>();
service.checkout(order);
verify(mockNotifier.send(anyString())).once();
```

**Fake** — A working but simplified implementation.

```typescript
class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();
  save(user: User) { this.users.set(user.id, user); }
  findById(id: string) { return this.users.get(id) ?? null; }
}
```

**Rule of thumb:** Prefer fakes and stubs for most tests. Reserve mocks for cases where the *interaction* is the important behavior (e.g., verifying a payment was charged, an event was published).

---

## TDD Anti-Patterns

### Testing Implementation Details

Tests that reach into private state or verify specific private methods were called. These tests break on every refactoring, even when behavior is unchanged.

**Fix:** Test through the public interface. Assert on outputs and observable side effects, not internal wiring.

### Fragile Tests

Tests that fail when unrelated changes are made — caused by shared mutable state, reliance on execution order, or over-reliance on shared setup code.

**Fix:** Each test should be self-contained. Use factories or builders to create test data locally.

### Over-Mocking

When a test has so many mocks that it essentially tests the mock framework, not the production code. The test becomes a tautology: "given that I told the mock to return X, the system returns X."

**Fix:** Mock at architectural boundaries (network, filesystem, external APIs). Use real objects for internal collaborators.

### Excessive Setup

Tests that require 50 lines of setup before a single line of action. This signals the class under test has too many dependencies — it is a **design smell**, not a testing problem.

**Fix:** Simplify the production code's interface. Extract responsibilities.

### Testing Trivial Code

Writing tests for getters, setters, or constructors with no logic. These tests add coverage percentage but zero confidence.

**Fix:** Focus testing effort on code with conditional logic, calculations, or integration points.

### The Slow Suite

Tests that hit real databases, networks, or sleep/wait for timers. A slow suite discourages running tests, which undermines TDD's rapid feedback loop.

**Fix:** Use fakes for I/O, keep unit tests under 1ms each, isolate slow integration tests into a separate suite.

---

## TDD in Different Contexts

### Backend APIs

TDD fits naturally. Start with a test for an endpoint's expected response, build the handler to pass it, add edge cases, and let the tests drive the design of services and repositories underneath.

```typescript
it('POST /users should return 400 if email is missing', async () => {
  const response = await request(app)
    .post('/users')
    .send({ name: 'Alice' });

  expect(response.status).toBe(400);
  expect(response.body.error).toContain('email');
});
```

### Frontend Components

TDD works for UI when you test behavior and accessibility, not visual appearance. React Testing Library enforces this by design.

```typescript
it('should show error message when submitting empty form', async () => {
  render(<LoginForm />);
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));

  expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
});
```

### Microservices

TDD is especially valuable in microservices because integration bugs are expensive — failures cascade across service boundaries. Use the London/Outside-In approach to define service contracts, then drive each service's internals with Chicago-style TDD. Contract testing tools like **Pact** formalize the cross-service tests.

### Legacy Code

Michael Feathers defines legacy code as "code without tests." His book *Working Effectively with Legacy Code* provides the standard playbook:

1. **Identify a change point** — the specific area you need to modify.
2. **Find a seam** — a point where you can intercept behavior without changing existing code (constructor injection, extract-and-override, Sprout Method).
3. **Write characterization tests** — tests that document the *current* behavior, even if that behavior is buggy.
4. **Make your change** under the protection of the characterization tests.
5. **Iterate** — each time you touch the code, add more tests, expanding the safety net.

The **Sprout Method** technique is particularly useful: when you need to add new behavior to an untestable method, extract the new behavior into a new, fully TDD'd method, and call it from the legacy code.

---

## Real-World Example: Password Validation with TDD

Let's walk through building a `PasswordValidator` step by step. Rules: minimum 8 characters, at least one uppercase letter, one digit, and one special character.

### Iteration 1: Minimum length

```typescript
// RED
describe('validatePassword', () => {
  it('should reject passwords shorter than 8 characters', () => {
    const result = validatePassword('Ab1!xyz');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });
});

// GREEN
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  return { valid: errors.length === 0, errors };
}
```

### Iteration 2: Uppercase requirement

```typescript
// RED
it('should reject passwords without an uppercase letter', () => {
  const result = validatePassword('abcdefg1!');
  expect(result.valid).toBe(false);
  expect(result.errors).toContain(
    'Password must contain at least one uppercase letter'
  );
});

// GREEN: add the check
if (!/[A-Z]/.test(password)) {
  errors.push('Password must contain at least one uppercase letter');
}
```

### Iteration 3: Digit requirement

```typescript
// RED
it('should reject passwords without a digit', () => {
  const result = validatePassword('Abcdefgh!');
  expect(result.valid).toBe(false);
  expect(result.errors).toContain('Password must contain at least one digit');
});

// GREEN
if (!/[0-9]/.test(password)) {
  errors.push('Password must contain at least one digit');
}
```

### Iteration 4: Special character requirement

```typescript
// RED
it('should reject passwords without a special character', () => {
  const result = validatePassword('Abcdefg1');
  expect(result.valid).toBe(false);
  expect(result.errors).toContain(
    'Password must contain at least one special character'
  );
});

// GREEN
if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
  errors.push('Password must contain at least one special character');
}
```

### Iteration 5: Happy path

```typescript
it('should accept a valid password', () => {
  const result = validatePassword('Str0ng!Pass');
  expect(result.valid).toBe(true);
  expect(result.errors).toHaveLength(0);
});
```

This test passes immediately — confirming the happy path works.

### Iteration 6: Multiple errors

```typescript
it('should report all violations at once', () => {
  const result = validatePassword('abc');
  expect(result.valid).toBe(false);
  expect(result.errors).toHaveLength(4);
});
```

Also passes — confirming validation collects all errors, not just the first.

### Refactor

Now we clean up. The function has a repeated pattern — extract a rules-based approach:

```typescript
interface PasswordRule {
  test: (password: string) => boolean;
  message: string;
}

const PASSWORD_RULES: PasswordRule[] = [
  {
    test: (p) => p.length >= 8,
    message: 'Password must be at least 8 characters',
  },
  {
    test: (p) => /[A-Z]/.test(p),
    message: 'Password must contain at least one uppercase letter',
  },
  {
    test: (p) => /[0-9]/.test(p),
    message: 'Password must contain at least one digit',
  },
  {
    test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
    message: 'Password must contain at least one special character',
  },
];

function validatePassword(password: string): ValidationResult {
  const errors = PASSWORD_RULES
    .filter((rule) => !rule.test(password))
    .map((rule) => rule.message);

  return { valid: errors.length === 0, errors };
}
```

All 6 tests still pass. The refactoring made the code more extensible — adding a new rule is a one-liner — without changing any behavior.

---

## Advanced TDD Concepts

### Property-Based Testing

Instead of writing specific example-based tests, you define *properties* (invariants) that must hold for **all inputs**, and the framework generates hundreds of random inputs automatically.

```typescript
import fc from 'fast-check';

test('validatePassword always returns a consistent result', () => {
  fc.assert(
    fc.property(fc.string(), (password) => {
      const result = validatePassword(password);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(typeof result.valid).toBe('boolean');
      expect(result.valid).toBe(result.errors.length === 0);
    })
  );
});
```

Property-based testing excels at finding edge cases humans miss — empty strings, unicode, extremely long inputs.

Key libraries: **QuickCheck** (Haskell), **Hypothesis** (Python), **fast-check** (JS/TS), **jqwik** (Java).

### Mutation Testing

Mutation testing answers the question: **"Are my tests actually detecting bugs, or are they just passing by coincidence?"**

How it works:

1. Parse your source code.
2. Make small, systematic changes ("mutations") — e.g., changing `>` to `>=`, `+` to `-`, `true` to `false`.
3. Run your test suite against each mutated version.
4. If tests still pass for a mutation, that mutation **survived** — your tests have a gap.

A mutation score of 90% means 90% of mutants were killed by your tests. Mutation testing is the gold standard for evaluating test suite quality — far more meaningful than code coverage percentage.

Tools: **Stryker** (JS/TS/.NET), **PIT** (Java), **mutmut** (Python), **mutant** (Ruby).

### Acceptance TDD (ATDD)

ATDD extends TDD to the requirements level. Before writing any code, the team collaborates to define acceptance criteria as executable tests:

1. Write a failing **acceptance test** that captures a user requirement.
2. Use inner TDD cycles (Red-Green-Refactor at the unit level) to implement the feature.
3. When all unit tests pass, check whether the acceptance test passes.
4. If not, continue iterating.

ATDD ensures you are **building the right thing** (requirements correctness), while TDD ensures you are **building the thing right** (implementation correctness).

### BDD (Behavior-Driven Development)

BDD, created by Dan North in 2003, shifts the language of tests from technical assertions to business behavior descriptions using Given-When-Then syntax. BDD is not a replacement for TDD — it is a communication layer on top of it.

The relationship:

```
ATDD (acceptance level) → BDD (shared language) → TDD (implementation level)
```

Tools: **Cucumber** (multi-language), **SpecFlow** (.NET), **Behave** (Python), **Jest-Cucumber** (JS).

---

## Tools and Frameworks

| Language | Test Runner | Mocking | Property-Based | Mutation |
|:--|:--|:--|:--|:--|
| **JavaScript/TypeScript** | Jest, Vitest | Built-in (jest.fn) | fast-check | Stryker |
| **Python** | pytest | unittest.mock | Hypothesis | mutmut |
| **Java/Kotlin** | JUnit 5 | Mockito | jqwik | PIT |
| **Ruby** | RSpec, Minitest | Built-in | — | mutant |
| **Go** | testing (built-in) | testify | gopter | — |
| **C#/.NET** | xUnit.net, NUnit | Moq, NSubstitute | FsCheck | Stryker.NET |
| **Rust** | cargo test | mockall | proptest | cargo-mutants |

---

## When NOT to Use TDD

An honest assessment of TDD's limitations:

**Exploratory prototyping** — When you do not know *what* to build yet, writing tests for undefined behavior is counterproductive. Spike first, then TDD the production implementation.

**Visual UI work** — Pixel-perfect layout and animations are better validated with visual regression tools (Storybook, Chromatic). TDD works for UI *behavior* but not for UI *aesthetics*.

**Throwaway scripts** — A one-time data migration or CLI tool you will use once does not warrant the investment.

**Pure data wiring with no logic** — CRUD endpoints that simply pass data from HTTP to a database with no business rules. Test these with integration tests instead.

**Performance tuning** — You cannot TDD your way to good performance. Benchmarks and profiling are the right tools.

**Volatile requirements** — If the spec changes daily, tests written today may be wrong tomorrow. A lighter test-after approach may be more pragmatic until the domain stabilizes.

---

## Key Takeaways

- TDD is a **design technique** that produces tests as a byproduct. The real output is better-designed, more modular code.
- The **Red-Green-Refactor** cycle keeps you in a state of known-good at all times.
- Use **Chicago style** for domain logic, **London style** for service interactions, and blend both pragmatically.
- Avoid the common anti-patterns: testing implementation details, over-mocking, excessive setup, and slow suites.
- TDD pairs powerfully with **property-based testing** and **mutation testing** for deeper confidence.
- Know when TDD adds value and when it does not — prototypes, visual design, and throwaway scripts are better served by other approaches.
- Start small. Pick one feature, one module, one bug fix — and try the Red-Green-Refactor cycle. The skill compounds with practice.
