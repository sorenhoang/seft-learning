---
title: "Writing Async Updates That Actually Get Read"
order: 1
tags: ["async-communication", "remote-work", "writing", "standup", "status-updates"]
date: "2026-04-22"
draft: false
---

The daily standup update is one of the most common pieces of writing in an engineer's day. It is also one of the most commonly written for the wrong audience.

Most standup updates are written for the writer — a brief record of what they worked on. An update written for the reader tells the team what they need to know to coordinate effectively. These are different documents.

## The Problem with "Worked On X"

The format that appears in most async standups:

> Yesterday: worked on the payment integration  
> Today: continuing payment integration  
> Blockers: none

This update is technically accurate and completely useless. The reader learns that the writer was busy. They learn nothing about progress, risk, or what they might need to do to help.

The person reading this update typically wants to know: is this on track? Is there anything I should be aware of? Is there anything the writer needs from me? None of those questions are answered.

## The Format That Creates Signal

A useful async update answers three questions that matter for coordination:

**1. What is the state of the work?** Not what did I do, but where does the work stand. Percentage complete is useful when meaningful ("the migration is 70% done, five of seven tables converted"). A description of what is working and what remains is useful when percentage is not. "The payment integration handles the success flow end-to-end; the refund flow and error states are not started" tells the team exactly where things stand.

**2. What is the risk or the next decision point?** If the work is on track with no complications, say so briefly. If there is a risk, surface it: "The integration is on track, but the vendor documentation for edge cases is incomplete — I am going to reach out to them today, and if I do not hear back by tomorrow I will need to make a judgment call on the behavior." That is a signal. The manager or tech lead reading it knows to watch for the follow-up.

**3. What do you need, if anything?** Blockers and needs should be specific. "Blocked" is not a blocker. "Need review of the DB schema in PR #412 before I can proceed with the next step" is a blocker. It names who can help and what they need to do.

A rewrite of the earlier example:

> **Payment integration:** success flow is complete and working in staging. Starting the refund flow today. Risk: the vendor's docs for partial refund edge cases are sparse — reaching out to them this morning. If no response by EOD, will flag for discussion tomorrow.  
> No blockers. No reviews needed yet.

Same facts. The second version is legible, actionable, and gives the reader everything they need.

## Weekly Status Updates

Weekly updates serve a different purpose than daily standups. Where standup coordinates the team in the short term, weekly reports give leadership and cross-functional stakeholders visibility into progress and risk at a higher level.

The structure that works:

**Headline.** One sentence on the state of the project or your area. "Payment integration on track for end-of-sprint delivery." or "API performance work is behind — see risks section." This allows readers to scan and stop if nothing requires their attention.

**What shipped or was completed.** Specific outputs, not effort. "Merged PRs for X, Y, Z. Deployed the configuration change that reduces cold start latency by 30%."

**What is in progress and what is next.** Brief, not exhaustive. Enough context that a reader who was not in last week's meetings can understand the trajectory.

**Risks and decisions needed.** The most important section. Name any risk that could affect timelines or quality. Flag any decision you need from someone else before you can proceed. This section is why leadership reads weekly reports — they are looking for things they need to act on.

**Metrics (when relevant).** If your work affects a measurable outcome, include the number. "Error rate in the payments API is now 0.3%, down from 1.2% before the change." This is the most credible form of progress signal available.

## The Principle Behind Both

Both standup updates and weekly reports follow the same principle: write for the reader, not for yourself.

Writing for yourself looks like a journal entry — what I did, what I was thinking, how I felt about the work. Writing for the reader looks like a briefing — what you need to know, what you need to do, what I need from you.

Most engineers have been giving journal entries and calling them status updates. The upgrade to briefings is a habit shift, not a skill acquisition. It takes two weeks of deliberate practice before it becomes automatic.

## The Practical Move This Week

Rewrite your next three standup updates using this format: state of the work + risk or next decision point + specific needs or blockers. After three days, compare them to your updates from last week and notice the difference.

---
*Next: how to explain technical work to people who do not share your vocabulary — PMs, leadership, and cross-functional partners who need to understand your work well enough to make decisions about it.*
