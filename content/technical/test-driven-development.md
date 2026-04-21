---
title: "Test-Driven Development: Writing Tests Before Code"
description: "A comprehensive guide to TDD — from the Red-Green-Refactor cycle and the Three Laws to practical patterns, anti-patterns, and real-world workflows across backend, frontend, and legacy systems."
tags: ["TDD", "Testing", "Software Engineering", "Clean Code", "Refactoring"]
date: "2026-04-19"
draft: false
---

# Test-Driven Development: Writing Tests Before Code

Test-Driven Development (TDD) is a software development methodology where you write a failing automated test *before* writing the production code that makes it pass. It inverts the conventional "write code, then test" into "write test, then code, then clean up."

TDD is not primarily about testing. It is a **design technique** that uses tests as a forcing function to produce small, decoupled, well-defined units of behavior. The tests are a byproduct — the real output is better-designed code.

Kent Beck formalized TDD in the late 1990s as part of Extreme Programming. As he puts it, TDD is about **confidence management** — you make small, provable steps that keep you in a state of known-good at all times.

---

## The Red-Green-Refactor Cycle

Each cycle should take roughly **1–10 minutes**.

**Red** — Write a test that describes a single new behavior. Run it. It must fail.

```typescript
describe('isValidEmail', () => {
  it('should return false for a string without @', () => {
    expect(isValidEmail('invalid-email')).toBe(false);
  });
});
```

**Green** — Write the simplest code that makes the test pass. Hard-coding is legitimate if only one test exists.

```typescript
function isValidEmail(email: string): boolean {
  return false;
}
```

**Refactor** — With a passing suite as your safety net, improve the code's structure without changing behavior. Then add the next test, which goes red, and the cycle repeats:

```typescript
// Next red test drives more behavior
it('should return true for user@example.com', () => {
  expect(isValidEmail('user@example.com')).toBe(true);
});

// Green: expand
function isValidEmail(email: string): boolean {
  const parts = email.split('@');
  return parts.length === 2 && parts[0].length > 0 && parts[1].includes('.');
}
```

---

## The Three Laws of TDD

Robert C. Martin codified TDD's finest-grained rhythm:

1. **You must write a failing test before you write any production code.**
2. **You must not write more of a test than is sufficient to fail.**
3. **You must not write more production code than is sufficient to make the failing test pass.**

The consequences: you never write a function "because you will need it later," you never gold-plate, and your codebase is never more than seconds away from a fully passing state.

---

## Inside-Out vs Outside-In

### Chicago/Detroit School (Inside-Out)

Start from the innermost domain logic and work outward. State-based verification — assert on returned values. Real collaborators, minimal mocks.

```typescript
it('should calculate order total', () => {
  const order = new Order();
  order.addItem({ name: 'Widget', price: 9.99, quantity: 2 });
  order.addItem({ name: 'Gadget', price: 14.99, quantity: 1 });
  expect(order.total()).toBe(34.97);
});
```

### London School (Outside-In)

Start from the outermost layer and work inward. Mock collaborators, verify interactions.

```typescript
it('should delegate to payment service on checkout', () => {
  const paymentService = mock<PaymentService>();
  const controller = new CheckoutController(paymentService);
  controller.checkout(orderData);
  expect(paymentService.charge).toHaveBeenCalledWith(orderData.total, orderData.paymentMethod);
});
```

**When to use each:** Chicago for domain logic and algorithms. London for service interactions and API layers. Most teams blend both.

---

## Benefits

- **Design feedback** — If a unit is hard to test, that is information about the design: too many dependencies, unclear responsibilities, or hidden side effects.
- **Regression safety** — Every test becomes a permanent sentinel. Projects with comprehensive suites detect defects **2–5x earlier**.
- **Living documentation** — Tests fail when they become out of date, unlike comments or wiki pages.
- **Reduced debugging** — When a test fails, the bug is in the last few lines you wrote. Debugging sessions shrink from hours to seconds.

---

## Common Misconceptions

**"TDD is slow"** — It adds time to writing but removes much more from debugging and maintenance. Net velocity increases once the practice becomes habitual.

**"100% coverage = quality"** — Coverage is a trailing indicator, not a goal. Kent Beck: "I would be suspicious of anything like 100%." Aim for 70–90% meaningful coverage.

**"TDD means no bugs"** — TDD reduces regressions and logical errors but does not eliminate concurrency issues, performance problems, or requirements misunderstandings.

**"TDD doesn't work for UI"** — It works when you test *behavior* rather than *pixels*. React Testing Library's philosophy is fundamentally TDD-compatible.

---

## Practical Patterns

### Arrange-Act-Assert

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
});
```

### Test Doubles

**Stub** — Returns predetermined data. **Spy** — Records calls for inspection. **Mock** — Verifies interactions. **Fake** — Simplified working implementation (e.g., in-memory database).

Rule of thumb: prefer fakes and stubs. Reserve mocks for cases where the *interaction* is the important behavior.

---

## Anti-Patterns

**Testing implementation details** — Tests that reach into private state break on every refactoring. Fix: test through the public interface.

**Over-mocking** — When tests have so many mocks they essentially test the mock framework. Fix: mock at architectural boundaries, use real objects internally.

**Excessive setup** — 50 lines of setup before one line of action signals too many dependencies — a design smell, not a testing problem.

**The slow suite** — Tests hitting real databases or networks discourage running them. Fix: fakes for I/O, keep unit tests under 1ms each.

---

## TDD in Different Contexts

**Backend APIs** — TDD fits naturally. Start with a test for an endpoint's expected response, build the handler, add edge cases.

```typescript
it('POST /users should return 400 if email is missing', async () => {
  const response = await request(app).post('/users').send({ name: 'Alice' });
  expect(response.status).toBe(400);
  expect(response.body.error).toContain('email');
});
```

**Frontend** — Test behavior and accessibility, not visual appearance. Use `getByRole`, `getByLabelText`, not CSS selectors.

**Microservices** — Use London style to define service contracts, Chicago style for each service's internals. Contract testing tools like **Pact** formalize cross-service tests.

**Legacy code** — Michael Feathers' playbook: find a seam, write characterization tests for current behavior, make your change under protection, iterate. The **Sprout Method** extracts new behavior into a fully TDD'd method called from legacy code.

---

## Real-World Example: Password Validation

Rules: min 8 characters, at least one uppercase, one digit, one special character.

```typescript
// Iteration 1 — RED: minimum length
it('should reject passwords shorter than 8 characters', () => {
  const result = validatePassword('Ab1!xyz');
  expect(result.valid).toBe(false);
  expect(result.errors).toContain('Password must be at least 8 characters');
});

// GREEN: minimal implementation
function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  return { valid: errors.length === 0, errors };
}
```

Each subsequent iteration adds one test (uppercase, digit, special character), goes red, and you add the minimal check to go green. After all tests pass, **refactor** into a declarative rules array:

```typescript
const PASSWORD_RULES: PasswordRule[] = [
  { test: (p) => p.length >= 8, message: 'Password must be at least 8 characters' },
  { test: (p) => /[A-Z]/.test(p), message: 'Must contain an uppercase letter' },
  { test: (p) => /[0-9]/.test(p), message: 'Must contain a digit' },
  { test: (p) => /[!@#$%^&*]/.test(p), message: 'Must contain a special character' },
];

function validatePassword(password: string): ValidationResult {
  const errors = PASSWORD_RULES.filter((r) => !r.test(password)).map((r) => r.message);
  return { valid: errors.length === 0, errors };
}
```

All tests still pass. The refactoring made the code extensible without changing behavior.

---

## Advanced Concepts

**Property-based testing** — Define invariants that must hold for *all* inputs; the framework generates hundreds of random inputs. Libraries: **fast-check** (JS/TS), **Hypothesis** (Python), **jqwik** (Java).

**Mutation testing** — Systematically mutates your source code (`>` to `>=`, `true` to `false`) and checks whether tests catch it. If tests still pass, you have a gap. Tools: **Stryker** (JS/TS/.NET), **PIT** (Java), **mutmut** (Python).

**ATDD** — Acceptance TDD extends the cycle to the requirements level. The team defines acceptance criteria as executable tests, then uses inner TDD cycles to implement the feature.

**BDD** — Behavior-Driven Development (Dan North) adds a communication layer with Given-When-Then syntax. Not a replacement for TDD — a shared language on top of it.

---

## When NOT to Use TDD

**Exploratory prototyping** — spike first, then TDD the production implementation. **Visual UI** — use visual regression tools for aesthetics. **Throwaway scripts** — not worth the investment. **Pure CRUD with no logic** — test with integration tests instead. **Performance tuning** — benchmarks and profiling are the right tools.

---

## Tools and Frameworks

| Language | Test Runner | Mocking | Property-Based | Mutation |
|:--|:--|:--|:--|:--|
| **JavaScript/TypeScript** | Jest, Vitest | Built-in (jest.fn) | fast-check | Stryker |
| **Python** | pytest | unittest.mock | Hypothesis | mutmut |
| **Java/Kotlin** | JUnit 5 | Mockito | jqwik | PIT |
| **Go** | testing (built-in) | testify | gopter | — |
| **C#/.NET** | xUnit.net | Moq, NSubstitute | FsCheck | Stryker.NET |
| **Rust** | cargo test | mockall | proptest | cargo-mutants |

---

## Key Takeaways

- TDD is a **design technique** that produces tests as a byproduct.
- The **Red-Green-Refactor** cycle keeps you in a state of known-good at all times.
- Use **Chicago style** for domain logic, **London style** for service interactions, and blend both pragmatically.
- Avoid the anti-patterns: testing implementation details, over-mocking, excessive setup, and slow suites.
- Know when TDD adds value and when it does not — prototypes, visual design, and throwaway scripts are better served by other approaches.
- Start small. Pick one feature, one bug fix — and try the cycle. The skill compounds with practice.
