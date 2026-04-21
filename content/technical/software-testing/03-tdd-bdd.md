---
title: "Test-Driven Development (TDD) & BDD"
order: 3
tags: ["testing", "tdd", "bdd", "red-green-refactor", "gherkin"]
date: "2026-04-21"
draft: false
---

Most engineers write code and then, if time allows, write tests for it. Test-Driven Development inverts the order. You write the test first, watch it fail, and only then write enough code to make it pass. This sounds like a small change of sequence. It is actually a change in how you design software.

## The Red–Green–Refactor Cycle

TDD, as Kent Beck popularized it in *Test-Driven Development: By Example* (2003), is a three-step loop:

1. **Red** — Write a test for behavior that does not exist yet. Run it. It fails (red).
2. **Green** — Write the simplest code possible to make the test pass. No more. Run it. It passes (green).
3. **Refactor** — Now that you have a safety net, clean up the code. Rename things, extract helpers, remove duplication. Run the tests after each change. They stay green.

The cycle is short — ideally minutes, not hours. You do not batch up a week of work and then test. You test one behavior, make it work, clean it up, then move to the next.

A concrete example. Suppose you are writing a function that converts a price to a localized string.

**Red:**
```python
def test_formats_usd_price():
    assert format_price(1234.5, "USD") == "$1,234.50"
```
Run the test. It fails — `format_price` doesn't exist.

**Green:**
```python
def format_price(amount, currency):
    return f"${amount:,.2f}"
```
Run the test. It passes. The function ignores `currency`, but we only asked it to handle USD.

**Refactor:** No obvious cleanup yet. Move on.

**Red, again:**
```python
def test_formats_eur_price():
    assert format_price(1234.5, "EUR") == "€1,234.50"
```
Fails. The `$` is hardcoded.

**Green:**
```python
SYMBOLS = {"USD": "$", "EUR": "€"}

def format_price(amount, currency):
    return f"{SYMBOLS[currency]}{amount:,.2f}"
```

**Refactor:** Still clean. Continue.

Each cycle adds one piece of behavior, backed by one test. After an hour, you have a fully-tested function and a suite that documents exactly what it does.

## Why TDD Is a Design Tool, Not a Testing Tool

The popular pitch for TDD is "you end up with tests." That is true but not the main point. The real value of TDD is that writing tests first exerts **design pressure** on your code.

Untestable code has recognizable symptoms: functions that depend on global state, classes that construct their own dependencies, modules that read from the filesystem on import. If you try to test such code, you have to mock the world. This friction is a signal. When TDD forces you to write a test *before* the code, you feel that friction immediately — while the design is still plastic — and you naturally build code with clearer seams.

Concretely, TDD tends to produce:
- **Smaller functions.** You can only fit so much logic into a test; larger functions are harder to test, so they stay small.
- **Dependency injection.** If you cannot construct the object in a test, you cannot test it. So you pass dependencies in.
- **Pure functions where possible.** Pure functions are trivially testable; side effects are not. TDD pushes side effects to the edges.

These are the same properties that make code easier to change. TDD is less "test the code" and more "design the code through tests."

## What TDD Is Not

Several caveats that get lost in evangelism:

**TDD is not 100% coverage.** You write tests for behavior that matters. Trivial getters and one-line wrappers usually don't earn a test. Coverage is a side effect, not a goal.

**TDD is not a replacement for thinking.** You still need to decide what behaviors are worth testing. Writing a test that says "the code does exactly what the code does" is useless — that is testing the implementation, not the behavior.

**TDD is not for every context.** Exploratory code — a spike to figure out whether an approach is even feasible — rarely benefits from TDD. Throwaway scripts don't either. TDD pays off most in code you expect to maintain.

**TDD is not pair programming.** They are often discussed together because they are both Extreme Programming practices, but either works without the other.

## Common TDD Pitfalls

### Testing Implementation Instead of Behavior

The most common mistake: writing a test that asserts *how* the code works rather than *what it does*.

```python
# Bad — tests implementation
def test_calculate_total_uses_reduce():
    with mock.patch("functools.reduce") as mock_reduce:
        calculate_total([1, 2, 3])
        mock_reduce.assert_called_once()

# Good — tests behavior
def test_calculate_total_sums_items():
    assert calculate_total([1, 2, 3]) == 6
```

The first test breaks if you switch from `reduce` to a `for` loop. The second one doesn't — and it shouldn't.

### Over-Mocking

If your test has more mocks than assertions, you have stopped testing the code and started testing your mocks. The test passes because you told it to. When the real collaborators change, the mocks don't, and bugs slip through.

Prefer real objects when they are fast and deterministic. Reach for mocks at boundaries (network, filesystem, clock) where real dependencies are slow or non-deterministic.

### Writing Tests After the Fact and Calling It TDD

"Test-last" development — writing tests after the code works — is fine, but it is not TDD. It does not give you the design pressure. And there is a subtler cost: tests written after the fact often look like whatever shape made the existing code easy to test, which means they lock in the existing design rather than challenging it.

### Skipping Refactor

The third step of red–green–refactor is the one most teams drop. The code passes; they move on. A week later, the code is a mess of "just enough to pass" hacks. Refactor is not optional. It is where you pay down the debt you just took on.

## Behavior-Driven Development (BDD)

BDD is often described as "TDD with better vocabulary." That sells it short, but it is a useful starting point. Dan North coined BDD in 2006 to solve a problem he kept seeing: engineers would do TDD correctly and still end up with code that didn't do what the business actually wanted.

The root cause, North argued, was language. A test named `test_login_1` tells you nothing about what the system is supposed to do. A test named `should_reject_login_with_incorrect_password` tells you immediately.

BDD formalizes this with a structure called **Given–When–Then**:

- **Given** — the context before the action (the state of the world).
- **When** — the action or event.
- **Then** — the expected outcome.

```gherkin
Scenario: User logs in with correct credentials
  Given a registered user with email "a@b.com" and password "secret"
  When the user submits the login form with those credentials
  Then the user is redirected to the dashboard
  And a session cookie is set
```

This format is called **Gherkin**, and tools like **Cucumber** (Ruby/Java), **SpecFlow** (.NET), and **Behave** (Python) execute Gherkin scenarios by mapping each step to a function.

### Why Gherkin?

Gherkin's killer feature is that it is plain English. A product manager can read a Gherkin spec and understand what the system does. They can even write one, and an engineer can wire up the steps underneath. This closes a communication gap that has broken countless projects.

The tradeoff: Gherkin is verbose and adds a layer of indirection. A one-line unit test is often clearer than a three-step Gherkin scenario. BDD shines at the **acceptance test** level — describing user-facing behaviors — not at the unit level.

### BDD Without Gherkin

You do not need Cucumber to do BDD. The same Given–When–Then structure works in any test framework:

```python
def test_user_logs_in_with_correct_credentials(client, db):
    # Given a registered user
    db.users.insert(email="a@b.com", password_hash=hash("secret"))

    # When the user submits the login form
    response = client.post("/login", json={"email": "a@b.com", "password": "secret"})

    # Then the user is redirected to the dashboard
    assert response.status_code == 302
    assert response.headers["Location"] == "/dashboard"
```

Many teams adopt the "Given–When–Then" structure inside regular unit tests without adopting the full Cucumber toolchain. That is a perfectly reasonable middle ground.

## When to Use TDD vs. BDD

These are not competing — they operate at different levels.

| Level                    | Style             | Written by                      |
| :----------------------- | :---------------- | :------------------------------ |
| Acceptance / feature     | BDD (Gherkin)     | Product + engineering together  |
| Integration              | TDD-style tests   | Engineers                       |
| Unit                     | TDD               | Engineers                       |

A common workflow:
1. Product and engineering agree on a Gherkin scenario for a new feature.
2. Engineers turn that into a failing acceptance test (outer loop).
3. Engineers TDD their way through the implementation (inner loop) — red, green, refactor at the unit level.
4. When the acceptance test passes, the feature is done.

This is sometimes called the "double-loop TDD" pattern, or ATDD (Acceptance Test-Driven Development).

## Does TDD Actually Work?

The empirical evidence is mixed but mostly positive. Multiple studies — summarized in Laurie Williams' research and in *Making Software* (O'Reilly, 2010) — have found that TDD teams produce code with roughly 40–80% fewer defects than non-TDD teams, at the cost of 15–35% more time per feature. Whether that tradeoff is worth it depends on your context: for high-stakes production code, almost always; for a one-off script, probably not.

The more interesting finding is that most of the benefit comes not from the tests themselves but from the shorter feedback loop. Engineers doing TDD catch mistakes within minutes; engineers doing test-last catch them hours or days later. Short feedback loops are the mechanism.

## Getting Started

If you have never done TDD, try this exercise. Pick a small, self-contained function you would normally write straight through — say, a string formatter or a parser. Commit to red–green–refactor for just that function. Write one test, watch it fail, make it pass, clean up. Do it again. Do it ten times.

What you will notice is not that your code gets better — it might, it might not — but that your *thinking* gets more structured. You stop writing speculative abstractions, because the test only asks for what it asks for. You stop adding "just in case" error handling, because no test demands it. You write less code. The code you write does the thing.

That is TDD's real gift: not better tests, but better code, arrived at by a more disciplined route.

## What's Next

We have covered why we test (Chapter 1), what kinds of tests (Chapter 2), and when to write them (Chapter 3). The next chapter is about making tests *actually useful at scale* — the automation strategy that turns a thousand tests from a source of pain into a source of confidence.

---
*Next: Test Automation Strategy — what to automate, how to fight flakiness, and how to manage test data.*
