---
title: "Design Docs and Code Review: Communication at Scale"
order: 3
tags: ["design-docs", "code-review", "technical-communication", "mentoring", "senior-engineers"]
date: "2026-04-22"
draft: false
---

Two practices define how senior engineers communicate across time and across teams: writing design documents and running code review. Both are commonly practiced. Both are commonly practiced badly. This chapter is about doing them well.

## Design Docs: The Problem with Most of Them

Most design documents fail for the same reasons. They are too long. They bury the recommendation. They are written for the wrong audience. And they treat approval as automatic rather than as a social process that requires navigation.

A design doc is not a record of your thinking process. It is a persuasion document with a specific goal: to align your team and stakeholders on a technical direction so that work can begin. Everything in the document serves that goal or it does not belong.

## The Structure That Gets Approved

The structure that consistently gets design docs approved is not the structure that feels most intellectually satisfying. It is the structure that respects the reader's time and answers their questions in the order they ask them.

**Context first.** Before you can convince anyone of a solution, they need to understand the problem. One paragraph: what is broken, who it affects, and what it costs. Skip the history; skip the political background; just state the problem clearly.

**Options before recommendation.** Readers do not trust a document that presents only one option. Show the two or three alternatives you considered, with honest trade-off analysis. This does the following: it demonstrates you thought seriously about the problem, it pre-empts the question "did you consider X?" and it makes your recommendation feel earned rather than assumed.

**Recommendation with reasoning.** State your recommendation directly. Not "we might consider option B" — "I recommend option B because of X and Y." Engineers who hedge their recommendations in design docs are optimizing for blame avoidance, not clarity. Clarity gets documents approved.

**Out of scope.** Explicitly list what this document does not address. This prevents scope creep in comments and makes the boundary of the decision clear.

**Open questions.** List the things you do not know yet that could affect the decision. This is honesty, not weakness. It also gives reviewers something to contribute rather than trying to find holes.

## The Political Dimension of Approval

A design document that technically correct but organizationally unread is a failed document. Getting a design approved is a social process, and treating it as purely technical is a common mistake.

Before you circulate the document: talk to the stakeholders informally. Share the problem framing with your tech lead before writing the full document. Run the recommendation by the most skeptical senior engineer on the team, privately, so you can address their concerns in the document itself. The formal review should have no surprises.

When you circulate: give reviewers a specific time window (48-72 hours is reasonable). State what kind of feedback you are looking for — "I am specifically looking for feedback on the security implications of option A and the migration plan" tells people where to focus. Reviewers who do not know what to look for will either not respond or will go off in unhelpful directions.

When feedback comes in: respond to every comment, even if the response is "acknowledged, keeping as written because of X." Silence on a comment reads as dismissal. A document that has visible, responsive engagement with its reviewers' questions signals that the author takes the review seriously.

## Code Review as a Mentoring Tool

Most code review is gatekeeping: does this code meet the bar? Senior engineers' code review should also be teaching: does this engineer understand why the bar is where it is?

The difference between these two modes produces very different outcomes over time. Gatekeeping keeps standards up in the short term. Teaching raises the team's collective capability over years. Senior engineers who only do one are only doing half their job.

## Shifting the Mode

The gatekeeping mindset produces comments like: "This is wrong. Use X instead."
The teaching mindset produces comments like: "This approach has a problem in the case where Y happens. The reason X works here is because of Z — can you think through the trade-off?"

The teaching comment takes longer to write. It also produces an engineer who will not make the same mistake again, rather than an engineer who fixed it this time without understanding why.

Not every comment needs to be a lesson. Some things are just wrong and should be fixed without ceremony. But the comments that identify patterns — repeated mistakes, gaps in understanding, over-complex solutions where simpler would do — deserve the teaching treatment.


## Comment Labeling

One of the most useful practices in code review is explicitly labeling the weight of your comments. This removes the ambiguity that makes code review stressful for the person receiving it.

A common system:
- **NIT:** Minor style preference. The author can take it or leave it, and you will not block the PR either way.
- **Suggestion:** You think this is worth changing, but you understand if the author has a reason not to.
- **Blocker:** This must be addressed before the code ships. Be specific about why.
- **Question:** You are genuinely asking, not implying a problem. Sometimes you learn something useful.

When every comment is treated as a blocker, the author cannot prioritize. When they all feel like blockers, authors start to avoid submitting work for review, or they stop reading review comments carefully because everything feels equally critical. Label your comments. It is a form of respect for the person reading them.

## Positive Feedback in Code Review

Senior engineers who only point out problems are teaching engineers that code review is a threat. The engineers who build the strongest teams through code review also use it to name things that are done well.

Not "LGTM" — that is not feedback. Specific positive feedback: "This error handling is much cleaner than the pattern we had before — good call abstracting it here," or "The naming in this function makes the intent clear without a comment, which is exactly what we want."

Positive feedback in code review does two things: it reinforces behaviors you want repeated, and it signals to the person being reviewed that your negative feedback comes from the same place as your positive feedback — care about the code and the team, not adversarialism.

## The Asymmetry of Senior Review

As a senior engineer, your code review carries more weight than you may realize. A junior engineer who reads a comment from a senior — even a gentle one — often reads it as more authoritative and critical than intended. Calibrate your communication accordingly.

This does not mean softening feedback that needs to be strong. It means being precise about what you are saying and why, so that the weight of your words matches the weight of the issue. "This is a significant risk and should be addressed before we ship" lands differently than "This is wrong" — even when they mean the same thing.

## The Practical Move This Week

For your next code review: label every comment as NIT, suggestion, or blocker. Leave at least one specific, positive comment on something done well. 

For your next design document: write the context section last, after you have written the rest of the document. You will find that writing the recommendation first clarifies what the context actually needs to say.

---
*Next: the skills that separate engineers who thrive in unclear situations from engineers who stall — navigating ambiguity, scoping work, and saying no in a way that builds trust.*
