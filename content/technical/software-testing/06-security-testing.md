---
title: "Security Testing"
order: 6
tags: ["testing", "security", "sast", "dast", "owasp", "devsecops"]
date: "2026-04-21"
draft: false
---

Functional tests answer the question, *does it do what it should?* Security tests answer a very different question: *does it refuse to do what it shouldn't?* A system can pass every functional test and still be trivially exploitable — because the tests only check the happy path, and attackers are in the business of finding the unhappy ones.

This chapter is about the discipline of thinking adversarially about your own code, and the tools that automate as much of that thinking as possible.

## The Adversarial Mindset

Most testing assumes a cooperative user: someone trying to accomplish a task, making reasonable inputs, clicking the buttons in the expected order. Security testing assumes the opposite — a user who will:

- Submit a million-character string where you expected ten
- Include characters you have never seen before in usernames
- Replay a valid request a thousand times with altered parameters
- Call your API endpoints in an order your UI would never produce
- Paste JavaScript into fields you thought were "just text"
- Manipulate cookies, tokens, and headers you assumed clients couldn't see

Security testing is about *expanding the input space* you consider, from "what a good user would do" to "what any input at all could do."

## The OWASP Top 10 — Your Starting Point

The Open Web Application Security Project (OWASP) publishes the **OWASP Top 10**, a periodically-updated ranking of the most critical web application security risks. It is the canonical starting point for knowing what to test for. As of the 2021 edition (still the most recent at the time of writing):

1. **Broken Access Control** — users accessing data or functions they shouldn't (the #1 risk, and by a wide margin).
2. **Cryptographic Failures** — weak or missing encryption of data at rest or in transit.
3. **Injection** — SQL, NoSQL, OS command, LDAP injection; untrusted input executed as code.
4. **Insecure Design** — architectural flaws that no amount of code review can fix after the fact.
5. **Security Misconfiguration** — default passwords, verbose errors, unnecessary features enabled.
6. **Vulnerable and Outdated Components** — using a library with a known CVE.
7. **Identification and Authentication Failures** — weak passwords, missing MFA, session fixation.
8. **Software and Data Integrity Failures** — trusting unsigned updates, insecure deserialization.
9. **Security Logging and Monitoring Failures** — you got breached, and you can't tell.
10. **Server-Side Request Forgery (SSRF)** — your server making HTTP requests on behalf of an attacker.

Any security testing program should be able to say, for each of these: "here is how we detect this class of bug." If you can only answer that for three of the ten, you have a concrete roadmap.

## The Three Pillars: SAST, DAST, SCA

Automated security testing splits into three complementary approaches.

### SAST — Static Application Security Testing

SAST tools read your source code without executing it, looking for patterns known to be dangerous: concatenating user input into SQL strings, calling `eval()` on untrusted data, hardcoded secrets in the repo.

**Strengths:**
- Runs in CI on every commit — catches issues before merge
- Finds bugs in code paths that are hard to reach dynamically
- Fast feedback loop

**Weaknesses:**
- Can't see runtime behavior — misses issues that depend on configuration, state, or integration
- False positive rate can be high (a "dangerous" pattern that is actually safe in context)

**Popular tools:** Semgrep (fast, rule-based, easy to customize), SonarQube (enterprise, broad), Snyk Code, CodeQL (GitHub's, very deep), Bandit (Python), Brakeman (Ruby), ESLint security plugins (JS).

### DAST — Dynamic Application Security Testing

DAST tools test your running application from the outside: they crawl the app, send malicious inputs, and check responses. They don't read your code; they probe the behavior.

**Strengths:**
- Finds real vulnerabilities in the deployed system — no theoretical debate about whether a pattern is exploitable
- Language-agnostic; works on anything that speaks HTTP

**Weaknesses:**
- Slower; requires a running environment
- Only finds issues on code paths the crawler exercises
- Can break things — DAST against production is usually a bad idea

**Popular tools:** OWASP ZAP (free, widely-used), Burp Suite (the professional standard), StackHawk, Acunetix, Nessus (broader, also covers infra).

### SCA — Software Composition Analysis

SCA tools scan your dependency tree against known vulnerability databases (CVE, GHSA, NVD). If you depend on a library with a known exploit, you find out immediately.

**Strengths:**
- Finds the most common real-world breach vector: outdated dependencies with public exploits
- Easy to run in CI; easy to understand results

**Weaknesses:**
- Only catches *known* vulnerabilities. Zero-days by definition don't show up here.
- Alert fatigue — a large dependency tree may have dozens of low-severity advisories, and learning to triage them is its own skill.

**Popular tools:** Dependabot (GitHub-native, automatic PR creation), Snyk Open Source, npm audit / pip-audit / bundler-audit (ecosystem-specific), Trivy (containers + dependencies), Renovate (more configurable than Dependabot).

### The Three Together

None of the three is sufficient alone. A mature program runs all three:
- SCA catches the "we depend on vulnerable package" class.
- SAST catches the "we wrote unsafe code" class.
- DAST catches the "our deployed system is exploitable" class.

They overlap partially, and each catches things the others miss.

## IAST and RASP: The Runtime Hybrids

Two less common but valuable categories:

- **IAST (Interactive Application Security Testing)** — instruments the running application and watches what it actually does during normal testing. When functional tests exercise a code path, IAST observes the data flow and flags insecure patterns. Combines SAST's code visibility with DAST's runtime accuracy. Examples: Contrast Security, Checkmarx IAST.
- **RASP (Runtime Application Self-Protection)** — similar instrumentation, but deployed in production to *block* attacks in real time. Not strictly testing, but the infrastructure is adjacent.

For most teams, SAST + DAST + SCA is enough to start. IAST is worth considering once the basics are wired up and the ROI becomes clear.

## Threat Modeling: The Up-Front Work

The tools above are reactive — they look at code you have written. **Threat modeling** is the proactive counterpart: thinking through what could go wrong *before* you write the code.

The canonical framework is **STRIDE**, introduced at Microsoft:

| Letter | Threat                           | Defense                            |
| :----- | :------------------------------- | :--------------------------------- |
| **S**  | **S**poofing (identity)          | Authentication                     |
| **T**  | **T**ampering (data)             | Integrity (hashes, signatures)     |
| **R**  | **R**epudiation (deniable action)| Audit logs                         |
| **I**  | **I**nformation disclosure       | Encryption, access control         |
| **D**  | **D**enial of service            | Rate limiting, quotas, redundancy  |
| **E**  | **E**levation of privilege       | Principle of least privilege, RBAC |

A threat modeling session asks, for each component or data flow: *which of STRIDE applies here, and how are we preventing it?* Thirty minutes of threat modeling during design is worth days of retrofitting security after the fact.

Alternative frameworks include **PASTA** (process-oriented), **LINDDUN** (privacy-focused), and **attack trees** (enumerating attack paths as a tree of sub-goals).

## Penetration Testing: Humans in the Loop

Automated tools find known patterns. **Penetration testing** ("pen testing") is humans — usually an external specialist firm — trying to break your application the way an attacker would. They chain together findings automated tools would miss, combine vulnerabilities creatively, and explore application-specific logic.

Pen tests are typically:
- **Point in time** — a snapshot of security at one moment
- **Expensive** — thousands to tens of thousands of dollars per engagement
- **Scoped** — black-box (no knowledge), grey-box (some docs), or white-box (full source access)
- **Periodic** — typically annual, plus before major launches or compliance audits

A pen test is a complement to continuous automated testing, not a replacement. Use automated tools to catch the everyday stuff; use pen testers to find the clever stuff.

## Fuzz Testing: Feeding the Beast

**Fuzzing** is a specific technique: feed random, malformed, or mutated input to your code and watch it crash. Originally developed for finding memory safety bugs in C programs, fuzzing now applies to parsers, protocol handlers, file format readers, and any code that accepts untrusted input.

Modern fuzzers like **libFuzzer**, **AFL++**, and language-specific ones (Go's native `testing/fuzz`, Python's Atheris) use coverage-guided mutation: they feed random bytes, see which branches got exercised, and prioritize inputs that explore new code paths.

For security-critical input-handling code (JSON parsers, image decoders, auth token validators), a few CPU-hours of fuzzing routinely finds bugs no human would have thought to write a test for. Google's **OSS-Fuzz** project has found tens of thousands of bugs in open-source libraries this way.

## Secrets Management and Pre-Commit Hooks

A separate, cheaper class of security testing: catching secrets before they land in the repo.

**Secret scanners** (GitGuardian, TruffleHog, GitHub's native secret scanning, Gitleaks) look for API keys, tokens, and credentials in commits, branches, and history. They catch them at push time, block them in CI, or — worst case — alert you after the fact.

**Pre-commit hooks** (the `pre-commit` framework, husky for JS) run scanners locally before the commit is even created. Cheaper than catching it in CI, way cheaper than rotating a leaked key.

Assume secrets will occasionally leak, and have a rotation playbook. Never assume "well, no one saw it." Public GitHub commits are scraped by bots within seconds of being pushed.

## DevSecOps: Shifting Security Left

The pattern of integrating security testing into the development pipeline — rather than treating it as a separate, end-of-cycle phase — goes by the name **DevSecOps**. The shift is cultural as much as technical:

- Security tools run in CI on every PR, not as a quarterly review.
- Developers own remediation of findings in their code, not a separate security team.
- Security engineers become enablers and consultants, not gatekeepers.
- Threat modeling happens during design, not post-launch.
- Compliance controls are automated (SOC 2, HIPAA, PCI requirements checked by scripts, not by humans with checklists).

The practical test for whether your team is doing DevSecOps: if a developer pushes a PR that introduces an SQL injection, does that PR get blocked automatically within 10 minutes? If yes, you are doing it. If it takes a security engineer to notice manually, you are not.

## A Practical Security Testing Baseline

For a team starting from zero, a reasonable order of adoption:

1. **SCA on every PR.** Dependabot or equivalent. Low effort, high return.
2. **Secret scanning.** Block commits containing credentials. Cheap and catastrophic to skip.
3. **Basic SAST.** Semgrep with the default rulesets, running in CI. Fix the high-severity findings; tune out the false positives.
4. **HTTPS and secure headers audit.** Automated via Mozilla Observatory or ZAP's baseline scan.
5. **Threat modeling** on any new service or major feature. Even a 30-minute STRIDE session catches obvious misses.
6. **Annual pen test** once you have paying customers or sensitive data.
7. **Fuzz testing** for input-handling critical paths.
8. **DAST** in a staging environment, nightly or weekly.

This is a 3–6 month journey for most teams, not a one-sprint project.

## Security Testing's Limits

A final honest note: no amount of security testing eliminates the possibility of a breach. Determined attackers with enough time will find something. The goal is not perfect security — it is raising the bar high enough that the attacker moves on to an easier target, detecting breaches when they happen, and limiting their blast radius.

Security testing sits inside a larger program that also includes: secure coding standards, least-privilege architecture, monitoring and alerting, incident response playbooks, and ongoing education. Testing is necessary; it is not sufficient.

## What's Next

We have covered testing's classical domain: correctness, automation, CI/CD, and security. The final chapter looks at where testing is going — AI-assisted test generation, mutation testing, property-based testing, chaos engineering, and the growing practice of testing in production itself.

---
*Next: Modern Testing — AI, Chaos, and Beyond.*
