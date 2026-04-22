---
title: "Leading Without a Title"
order: 2
tags: ["technical-leadership", "senior-engineers", "engineering-culture", "influence"]
date: "2026-04-22"
draft: false
---

Most engineers think of technical leadership as something that happens after you become a tech lead or manager. It is not. Technical leadership is a behavior pattern, not a role. And the engineers who are most effective at it are often the ones who practice it most consistently before anyone gives them a title.

This chapter is about what that practice looks like, day to day.

## What Technical Leadership Actually Is

Technical leadership is not about having the final say on architecture decisions. It is not about running meetings or being the most vocal person in the room. At its core, it is about two things:

**Reducing the amount of coordination others need to do to make good decisions.** You do this by writing things down, building shared context, and surfacing the right questions before they become blockers.

**Raising the quality of technical work around you.** You do this through code review, pairing, architecture conversations, and — most importantly — modeling the behaviors you want to see.

Both of these are actions, not titles.

## The Daily Behaviors

Technical leadership manifests in small, repeated moments. The compound effect of these moments is what makes someone a leader in practice, regardless of their org chart position.

**Writing things down before they get lost.** Every team has decisions that get made in Slack threads or verbal conversations and then disappear. The senior engineer who writes the three-paragraph summary of "what we decided and why" after that conversation is doing leadership work. It costs five minutes and prevents months of re-litigation.

**Asking the question the room is avoiding.** In technical discussions, there is often a question everyone is dancing around — a trade-off nobody wants to name, a dependency nobody wants to acknowledge, a timeline that everyone suspects is wrong but nobody wants to say out loud. The senior engineer who names it clearly, without accusation, is doing leadership work.

**Setting standards through your own work.** Your code is read by every engineer on your team. How you structure it, how you document it, how you handle error cases — these set a standard, whether you intend them to or not. Deliberately setting a high bar in your own work, and being willing to explain the reasoning behind your choices in code review, teaches more than any internal talk.

**Following through on commitments.** This one sounds trivial. It is not. Engineers who say they will investigate something and then report back, who keep their technical tasks updated, who do not let promises fall through the cracks — these engineers are trusted. Trust is what converts influence into leadership.

## The Glue Engineer

Tanya Reilly coined the term "glue work" in a 2019 talk that resonated far beyond the conference where she gave it. Glue work is the work that holds teams together: onboarding new teammates, writing the runbook nobody has time for, coordinating between teams so the implementation effort stays aligned, running the retro well, debugging the deployment pipeline that everyone hates but nobody has fixed.

This work is leadership work. It is also, as Reilly points out, often the work that does not get credited in promotion cycles — particularly for women and underrepresented engineers who are more likely to be implicitly expected to do it.

Two things are true simultaneously:
1. Glue work is essential and under-recognized, and the system should credit it better.
2. Engineers who only do glue work and neglect technical depth will stall.

The practical implication: do the glue work that matters, and make it visible. Write down what you did and why it mattered. The invisible-labor problem is partly a visibility problem, and you can address your part of it.

## Writing as Leadership

The single highest-leverage leadership behavior available to an engineer without a title is writing clearly about technical problems. A well-written design proposal shapes a project from the start. A well-written incident postmortem prevents future incidents and builds a team's collective understanding of the system. A well-written architecture note makes it possible for engineers who join in two years to understand decisions made today.

Writing is how technical leaders scale their influence beyond the room they are in. An engineer who can write a clear, persuasive technical argument will always have more impact than one who can only make that argument verbally.

The specific practices:
- **RFCs (Requests for Comments).** Before building something significant, write a short document describing the problem, the options you considered, and your recommendation. Share it widely, collect comments, and make the decision process visible.
- **Design documents.** Covered in detail in the next chapter.
- **Postmortems.** Write them thoroughly, without blame, and share them across the org. "What we learned" is leadership.
- **Decision logs.** A short document per significant decision: what we decided, why, what the alternatives were, and what would cause us to revisit. Revisit quarterly.

## The Authority Trap

A common mistake: waiting for authority before leading. "Once I'm a tech lead, I'll push for better code review standards." "Once I'm a principal, I'll write the architecture documentation."

The trap is that authority comes after demonstrated leadership, not before. The organizations that promote engineers into tech lead roles are looking for engineers who are already doing the things tech leads do. The title formalizes what is already happening — it does not create the opportunity to start.

The engineers who think of leadership as something that begins with a title are the ones who stall.

## The Practical Move This Week

Find a decision your team made in the last month that is not written down anywhere. Write a two-paragraph document describing what was decided and why. Share it in your team's documentation or Slack channel.

Notice whether it generates discussion. If people have questions or corrections, that is exactly the value it produced — surface that undocumented decision before it becomes a disagreement six months from now.

---
*Next: the two practices that define senior engineering communication across teams and time — writing design docs that get approved, and running code review in a way that grows the engineers you review.*
