---
title: "Testing in CI/CD Pipelines"
order: 5
tags: ["testing", "ci-cd", "continuous-integration", "coverage", "pipeline"]
date: "2026-04-21"
draft: false
---

A test suite that runs once a week is a test suite nobody trusts. A test suite that runs on every commit, blocks bad changes before they merge, and ships green builds to production automatically is the foundation of continuous delivery. This chapter is about how to get from the first to the second.

## The Goal: Fast, Trustworthy Feedback

Every change an engineer makes creates a question: *did this break anything?* CI (Continuous Integration) exists to answer that question as quickly and reliably as possible. CD (Continuous Delivery / Deployment) takes the green answer and turns it into a production deploy with minimal human intervention.

The economics are simple: the faster the answer, the cheaper the fix. A test failure spotted 30 seconds after `git push` costs almost nothing. A test failure that only surfaces when someone manually promotes a build three days later costs a context switch, a re-investigation, a git bisect, and a ruined Friday.

Two metrics drive almost everything in pipeline design:

- **Feedback time** — from `git push` to test result. Target: under 10 minutes for the fast path.
- **Reliability** — the probability that a pass means "safe to merge." Target: >99%. Flaky CI poisons the well.

## Pipeline Stages: From Push to Production

A mature pipeline has several stages, each gating the next. A typical shape:

```
┌──────────────┐     ┌─────────────┐     ┌──────────────┐     ┌────────────┐
│  1. Lint &   │ ──▶ │ 2. Unit +   │ ──▶ │ 3. E2E /     │ ──▶ │ 4. Deploy  │
│    type      │     │  component  │     │  integration │     │  to staging│
│    check     │     │   tests     │     │    tests     │     │            │
└──────────────┘     └─────────────┘     └──────────────┘     └────────────┘
    ~30 sec             ~2-5 min            ~5-15 min            ~2 min
                                                                     │
                                                                     ▼
                                                          ┌────────────────┐
                                                          │ 5. Smoke test  │
                                                          │   in staging   │
                                                          └────────────────┘
                                                                     │
                                                                     ▼
                                                          ┌────────────────┐
                                                          │ 6. Deploy prod │
                                                          │  (canary/blue- │
                                                          │    green)      │
                                                          └────────────────┘
```

The principle: **fail fast, fail cheap.** A lint error that fails in 30 seconds is cheaper than the same lint error failing 14 minutes in, after the E2E suite has run.

## The Fast Path vs. The Full Path

Not every change needs every test. A documentation-only PR does not need to re-run the E2E suite. A backend-only change does not need to re-run visual regression tests. Pipelines should be **conditional**, routing changes to the tests they actually need.

Three common strategies:

### Path-Based Filtering

The simplest form: use your CI config to skip entire pipelines based on the files changed.

```yaml
# GitHub Actions — only run frontend tests if frontend files changed
on:
  push:
    paths:
      - "web/**"
      - "package.json"
```

### Selective / Affected-Only Testing

Tools like Nx, Turborepo, Bazel, and pytest's `--lf` (last-failed) can compute the dependency graph and run only tests affected by the change. A small PR in one package might trigger 50 tests instead of 5,000.

```bash
# Nx — run tests only for affected projects
npx nx affected:test --base=main
```

This is the highest-leverage optimization most pipelines can make. Tools with good dependency tracking can cut feedback time by an order of magnitude.

### Merge Queues and Sharding

For large monorepos, a **merge queue** (GitHub's native merge queue, Graphite, Mergify) batches PRs and runs the full test suite against the combined result before merging. This catches the class of bug where two individually-green PRs interact badly — which a naïve "test each PR in isolation" pipeline misses.

## Parallelization and Sharding

A suite that takes 30 minutes sequentially can take 3 minutes on 10 parallel runners. This is not free — you pay for compute — but at typical team sizes it is cheap insurance against slow feedback.

Two dimensions of parallelism:

- **Matrix jobs** — run the same tests in multiple environments (Node 20, 22; Python 3.11, 3.12; Chrome, Firefox) in parallel.
- **Sharding** — split the same test suite across N runners by test file, test count, or historical runtime.

Sharding by historical runtime (each shard gets tests that sum to roughly equal total time) is far better than sharding by file count. Ten short files take less time than one long file.

```yaml
# Pseudo-example: shard by runtime
strategy:
  matrix:
    shard: [1, 2, 3, 4, 5]
steps:
  - run: npm test -- --shard=${{ matrix.shard }}/5
```

## PR Gates: What Should Block a Merge?

Every organization has to decide: what must be green before code can merge? Common gates:

| Check                         | Typical policy             |
| :---------------------------- | :------------------------- |
| Lint / format                 | Block                      |
| Type check                    | Block                      |
| Unit tests                    | Block                      |
| Integration tests             | Block                      |
| E2E tests                     | Block (on main branch)     |
| Coverage threshold            | Block if coverage drops    |
| Security scan                 | Block on high-severity     |
| Visual regression             | Require approval, not block|
| Performance benchmark         | Warn, not block            |

A useful guideline: **block only on deterministic, well-understood checks.** If a gate fails randomly 5% of the time, it is not a gate — it is a toll booth that engineers learn to resent and route around.

## Coverage: A Guardrail, Not a Goal

Code coverage — the percentage of lines / branches / functions executed by your tests — is a seductive metric. It is easy to compute, easy to chart, and easy to set targets against. It is also one of the most commonly misused metrics in engineering.

### What Coverage Actually Tells You

Coverage measures **what your tests touched**. It does not measure:
- Whether the tests actually assert anything meaningful
- Whether the tests would catch a regression
- Whether the tested code is correct

You can get 100% coverage with tests that don't assert anything — they just call the code and never check the result. The coverage tool happily reports success; the tests are worthless.

### Goodhart's Law Strikes Again

> *"When a measure becomes a target, it ceases to be a good measure."*

Mandate 90% coverage, and teams will hit 90% coverage. They will also write meaningless tests to hit it, deprioritize hard-to-test code, and add `# pragma: no cover` to exclude anything inconvenient. The number goes up; the quality of the tests goes down.

### How to Use Coverage Well

- **As a floor, not a target.** "Don't let coverage drop" is reasonable. "Must reach 95%" is not.
- **Differential coverage.** Check that *new code* in a PR has coverage, rather than enforcing a global number. This focuses effort on code that is being actively touched.
- **Look at what is *not* covered, not just the percentage.** Uncovered code is a question to ask, not an automatic failure.
- **Mutation testing (covered in Chapter 7) is a stronger signal** than coverage. It measures whether your tests *would* catch bugs, not just whether they touched the line.

## Deployment Validation: Canary, Blue-Green, and Feature Flags

Green CI is necessary but not sufficient. A change can pass all tests and still break production — because staging never perfectly matches production, because of subtle traffic patterns, because a third-party dependency behaves differently under load.

Modern deployment patterns hedge this risk:

### Canary Deployments

Route a small percentage of production traffic (say, 1%) to the new version. Watch error rates, latency, business metrics. If anything looks wrong, automatically roll back. If everything looks fine, gradually increase to 100%.

Tests don't stop at CI. The canary period is itself a test — the highest-fidelity test you can run, because it uses real traffic.

### Blue-Green Deployments

Two identical production environments, "blue" (currently serving) and "green" (the new version). Deploy to green, run smoke tests, then switch the load balancer. If something breaks, switch back.

Great for fast rollback. Expensive because you pay for twice the infrastructure during the cutover.

### Feature Flags

Ship the code to production, but keep it disabled behind a flag. Enable it for internal users, then 1% of customers, then 10%, then everyone. If something breaks, flip the flag off — no deploy needed.

Feature flags decouple **deploy** from **release**. This is enormously valuable: you can deploy code that is not yet ready to serve users, test it in production conditions, and enable it on your own schedule. It also lets you run true A/B tests in production, which is the only place that matters.

The cost: flags accumulate technical debt. A flag that has been "fully rolled out" for six months but is still in the code is a landmine. Good teams have a lifecycle: every flag has an owner, a purpose, and a removal date.

## Tests as a Pipeline Artifact

Modern pipelines treat test results as first-class artifacts:

- **Test result uploads** (JUnit XML, TAP) feed dashboards (GitHub Checks, Azure DevOps Tests) so failures are clickable, not grepped from logs.
- **Test history** across runs surfaces flaky tests automatically. Tools like Buildkite Test Analytics, Datadog CI Visibility, and GitHub Actions' flaky test reporting compute flakiness rates per test.
- **Performance trends** — if the test suite is getting slower over time, something is wrong. Track p50/p95 test duration as a metric.

Treating test signals as data, not just pass/fail, is what separates a "we have CI" team from a "we use CI strategically" team.

## Smoke Tests: The Last Line of Defense

A **smoke test** is a minimal check that the deployed system is alive at all: can you load the homepage, can you log in, can you make an API call. It is not trying to catch subtle bugs. It is catching the "we deployed but a config file is missing" class of disaster.

Run smoke tests:
- After every deploy, against the real deployed URL
- Continuously in production (synthetic monitoring)
- As part of the canary rollout

Smoke tests should be small, fast, and stable. If they flake, they lose their meaning.

## A Realistic Pipeline Timeline

For a medium-sized web app, a good pipeline looks roughly like this:

| Stage                   | Duration | Runs on           |
| :---------------------- | :------- | :---------------- |
| Lint, format, types     | 30 sec   | Every PR          |
| Unit tests              | 2 min    | Every PR          |
| Integration tests       | 4 min    | Every PR          |
| Build container image   | 2 min    | Every PR          |
| E2E tests (critical)    | 6 min    | Every PR          |
| Deploy to staging       | 2 min    | Merge to main     |
| Full E2E in staging     | 15 min   | Merge to main     |
| Canary to production    | 10 min   | Auto after staging|
| Full rollout            | 20 min   | Auto on canary OK |

From PR open to full production rollout: about an hour on a green day. From PR open to "ready to merge": about 15 minutes. That is the benchmark to aim for.

## What's Next

We now have a pipeline that catches functional regressions fast. But functional correctness is only one dimension of quality. A system that works perfectly until an attacker injects SQL is not, for the user, working. The next chapter is about testing for security — the adversarial perspective that most functional test suites never consider.

---
*Next: Security Testing — SAST, DAST, threat modeling, OWASP, and integrating security into the development lifecycle.*
