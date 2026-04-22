---
title: "Documentation as a Communication Tool"
order: 5
tags: ["documentation", "technical-writing", "communication", "knowledge-management", "engineering-culture"]
date: "2026-04-22"
draft: false
---

Most engineering documentation fails the people it was meant to help. It is written once, never updated, and gradually drifts further from reality until the team stops trusting it — at which point it exists only as an organizational artifact that nobody reads.

The failure is not a writing problem. It is a framing problem. Documentation treated as a record of current state becomes stale the moment anything changes. Documentation treated as a communication tool — designed for specific readers with specific questions — stays relevant as long as the communication remains necessary.

## What Documentation Is Actually For

Documentation serves four distinct purposes, and mixing them produces documents that serve none:

**Orientation.** Helping a new team member, a new contributor, or a future engineer understand a system, a codebase, or a process. This documentation is evergreen in structure but needs regular updating as the system evolves.

**Reference.** Giving practitioners fast access to details they need frequently but cannot remember. API documentation, runbooks, configuration references. This documentation needs to be correct above all else and is updated whenever the thing it describes changes.

**Decision record.** Explaining why something is the way it is. Architecture Decision Records (ADRs), postmortem findings, product trade-off logs. This documentation is append-only and does not go stale — the decision was made, and the record is permanent.

**Proposal.** Driving alignment on something that has not yet happened. Design documents, RFCs, product specs. This documentation has a lifecycle: it is written, reviewed, approved, and then superseded either by the decision record or by the thing it described being built.

When you are about to write something, identify which type it is. The structure, the update cadence, and the audience are all different depending on the type.

## The Problem Nobody Reads

The most common complaint about documentation: "Nobody reads it." This is usually a symptom, not a root cause.

Documentation that is hard to find does not get read. Documentation that is not clearly indexed — so readers do not know it exists — does not get read. Documentation that is long and poorly structured does not get read past the first screen. Documentation that seems to be directed at nobody in particular does not get read by anybody.

The fix for each:

**Hard to find:** put documentation where people look, not where it is logical to store. Most teams look in the repository first, then the team wiki, then a search. If your documentation is in neither of those places, it will not be found.

**Not indexed:** every significant document needs to be reachable from a known entry point — a README, a team wiki page, a getting-started guide. A document with no inbound links is a document that requires already knowing it exists in order to find it.

**Too long:** the first paragraph of any technical document should tell the reader whether this document is for them and what they will get from it. If that paragraph does not appear, readers cannot assess whether to invest the time. Many readers will not.

**Directed at nobody:** write for a specific reader with a specific question. "This document explains how to add a new OAuth provider for a backend engineer who has not worked on the auth system before" is a reader and a question. "Authentication overview" is neither.

## Architecture Decision Records

The most underused form of documentation in engineering teams is the Architecture Decision Record (ADR). An ADR is a short document that captures:

- The decision that was made
- The context that led to it
- The options that were considered
- The rationale for the chosen option
- The consequences — both intended and anticipated

ADRs are powerful because they answer the question that costs the most when the answer is not available: "Why is this the way it is?" Without ADRs, that question requires finding someone who was present when the decision was made, which is increasingly impossible as teams change. With ADRs, the answer is three minutes away.

The format should be short. An ADR that runs more than two pages has become a design document. The goal is capture, not elaboration. A good ADR template:

**ADR template:**

> **Context:** What situation led to this decision?
>
> **Decision:** What we decided.
>
> **Options considered:** What else we evaluated and why we did not choose it.
>
> **Rationale:** Why this option over the alternatives.
>
> **Consequences:** What this commits us to, what it makes harder, what it prevents.



Write one ADR per significant decision. "Significant" means: a future engineer reading this codebase would wonder why this exists. If the decision is obvious, it does not need an ADR. If the decision is surprising, it definitely does.

## Keeping Documentation Alive

Documentation decays at the rate that the system it describes changes. The only way to keep documentation alive is to make updating it part of the definition of done for any change that affects it.

This is a process problem, not a motivation problem. Engineers who genuinely care about the team rarely deliberately let documentation go stale. They simply do not have a reliable trigger to update it. The trigger needs to be structural.

Practices that work:
- **Pull request checklists.** "Does this change affect any documentation? If yes, update it." A simple checkbox in the PR template makes the question automatic.
- **Documentation ownership.** Each piece of documentation has an owner who is responsible for its accuracy. Ownership without accountability drifts; explicit ownership holds.
- **Scheduled review.** Quarterly review of core documentation — not a deep rewrite, but a pass to verify that the most important documents still reflect reality.

## The Practical Move This Week

Find a decision your team made in the last six months that is not documented anywhere. Write a one-page ADR for it. Share it with the team as a model and propose that new significant decisions get this treatment going forward.

---
*Next: what to do when communication breaks down entirely — navigating conflict in teams, from technical disagreements to interpersonal friction.*
