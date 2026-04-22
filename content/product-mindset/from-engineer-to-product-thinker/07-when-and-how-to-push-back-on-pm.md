---
title: "When and How to Push Back on Your PM"
order: 7
tags: ["product-mindset", "communication", "engineering-leadership", "conflict", "disagreement"]
date: "2026-04-22"
draft: false
---

The single best test of whether you've become a senior engineer — not in title, but in actual practice — is whether you can push back on your PM in a way that makes the work better without making the relationship worse. Junior engineers rarely push back; they execute. Staff+ engineers push back constantly; it's much of the job. The skill you develop in between those two stages is most of this chapter.

Done well, pushback is the clearest contribution a senior engineer makes to a project. Done badly, it's the fastest path to being labeled difficult, sidelined, and eventually optimized out. The vocabulary and craft required to do it well are learnable — but almost nobody gets taught them formally.

## Why Engineers Under-Push-Back

Most engineers push back too little, not too much. The reasons are predictable:

- **Career risk, real and perceived.** Saying the uncomfortable thing in a group meeting feels dangerous. Sometimes it is.
- **Hierarchy.** PMs often present as more senior organizationally, especially in companies where they hold the roadmap.
- **Not wanting to be "that engineer."** The one who slows things down, the one PMs dread looping in early.
- **No vocabulary for PM-level concerns.** Engineers can articulate technical risks fluently; they often can't articulate opportunity cost, positioning risk, or strategic mismatch in PM language.
- **"It probably won't matter."** The specific failure mode where you believe the PM's approach is wrong but can't bring yourself to say so, because the stakes feel not-high-enough.

The cost of silent compliance is almost always higher than the cost of spoken disagreement done well. The feature that ships wrong. The six months of post-launch fix work. The post-mortem where someone asks *"did anyone see this coming?"* and you did, and didn't say. Over a career, those moments accumulate into the difference between an engineer who shipped things that mattered and one who shipped things that happened.

## Partnership, Not Hierarchy

The mental model that makes good pushback possible: **the PM-engineer relationship is a partnership, not a hierarchy.** Marty Cagan (SVPG) has written about this for a decade. The best product teams are trios — PM, tech lead, designer — jointly owning outcomes. They are peers. The PM owns the *why* and the *what*; the engineer owns the *how* and much of the *can*; neither owns the decision unilaterally.

This model isn't universal. Some companies still run feature-factory orgs where the PM "gives specs to engineering," and pushback is organizationally unwelcome. If that's your org, the tactics below still work — they just carry more risk. The diagnostic is simple: *does your PM treat well-reasoned pushback as a contribution or as a threat?* If the former, lean in. If the latter, be more careful and more written — and consider, seriously, whether you're in the right company.

## Legitimate Reasons to Push Back

A taxonomy of *good* reasons to challenge a PM's proposal. Each of these is load-bearing; each deserves a conversation.

- **The effort estimate is wrong.** Engineers have the math; PMs often don't. If the PM is assuming three weeks for something you know is three months, that's a decision-affecting error.
- **The technical approach is misaligned with the stated product goal.** The feature as specified doesn't actually serve the JTBD the PM is trying to serve. (See Chapter 2.)
- **Ignored constraints.** Existing system behavior, team capacity, hard external dependencies. The PRD assumes something untrue.
- **Under-weighted risk.** The PM hasn't thought through a failure mode that you can see. Security, data integrity, compliance, operational load — all common blind spots for non-engineer PMs.
- **User need not served by the proposed solution.** You've noticed that the solution, even if built perfectly, wouldn't actually address the problem described.
- **Better alternative exists.** You can see a path that's cheaper, faster, or lower-risk that the PM hasn't considered.
- **Scope-timeline mismatch.** The classic. The scope as written cannot ship in the timeline as written. Pretending otherwise will fail everyone later.

Any of these deserves a pushback. Not all of them deserve the same volume or venue.

## Illegitimate Reasons to Push Back

Equally important: the reasons that aren't actually legitimate, dressed up as if they are. Self-honesty matters here.

- **You don't want to learn a new framework.**
- **Personal aesthetic preference disguised as technical concern.**
- **Territoriality over code you wrote.**
- **"My way is better" without evidence.**
- **Attachment to the existing solution because you built it.**

If the real driver of your pushback is any of the above, don't push back. You'll lose credibility that you'll want later for the legitimate version of the same conversation.

## The SBI Framework

A practical technique from the Center for Creative Leadership, taught since the 1990s: **Situation-Behavior-Impact**.

- **Situation** — name the specific when/where.
- **Behavior** — describe an observable action, without judgment.
- **Impact** — name the concrete consequence on the team, product, or user.

Applied to an engineer-to-PM example:

> *"In Thursday's standup (Situation), when the scope was expanded to include SSO (Behavior), it pushed our launch date past the sales conference we'd originally prioritized this work for (Impact). I want to re-talk the scope decision."*

Versus the vague version:

> *"I don't think we can add SSO."*

The first is actionable; the second is a vibe. SBI forces you to name the specific thing, which both clarifies your own thinking and gives the PM something concrete to respond to.

## The Escalation Ladder

When you disagree, work up the ladder. Never skip steps.

**Level 1: 1:1 with the PM.** Verbal first, async follow-up summary (email, Slack, comment) so the exchange is on the record. Most disagreements resolve here. This is the only level where you should bring up big premise-level concerns — once you're past it, the PM should already know your position.

**Level 2: Written async on the PRD.** Comments in the doc, or an email with the specific concerns. Gives the PM time to think, space to revise without losing face, and a record of your raising the concern. This is where you memorialize your reasoning.

**Level 3: Tech lead or EM.** Frame as *"I want a second read on this"*, not *"I'm escalating around my PM."* The distinction is subtle but real — the first is consultation, the second is confrontation. Your EM's job is to help you; your PM's EM is a different conversation.

**Level 4: Leadership / skip-level.** Last resort. Going to Level 4 without Levels 1 through 3 burns the PM relationship permanently, even when you're right. If you find yourself drafting a skip-level email, your first question should be *"have I actually done 1 through 3?"*

The trap most engineers fall into is skipping straight to Level 2 or Level 3 — writing a pointed comment on the doc or looping in the tech lead, rather than having the 1:1 conversation first. The PM then feels ambushed, because they learned about your concern *from someone else*, after you could have told them directly. Every subsequent interaction is poisoned by that initial feeling.

## Disagree and Commit

The organizational principle that makes pushback sustainable: **Amazon's "disagree and commit"**, formalized in Jeff Bezos's 2016 shareholder letter.

> *"If you have conviction on a particular direction even though there's no consensus, it's helpful to say, 'Look, I know we disagree on this but will you gamble with me on it? Disagree and commit?'"*

> *"This isn't one way. If you're the boss, you should do this too. I disagree and commit all the time."*

Andy Grove operated by the same principle at Intel decades earlier (*High Output Management*, 1983). The cultural norm:

1. You get to ask your questions.
2. You get to make your case strongly, with numbers, with alternatives, with risk assessments.
3. Once the decision is made, you commit fully. You execute as if the decision were your own idea. You do not slow-walk, do not quietly sabotage, do not re-litigate in every subsequent meeting.

This last point is where most engineers fail. They win some and lose some; they commit fully to the ones they won and drag their feet on the ones they lost. The result: over time, PMs route around them. The engineer who re-opens *"why are we doing this"* in sprint three of a decided project is the engineer who stops being invited to sprint one.

## When Pushback Is a Signal to Leave

A hard truth worth naming: if you are a senior engineer, your pushback is consistently well-reasoned and respectful, and it is *consistently ignored* by leadership, and the outcomes are *consistently bad* — you are in the wrong org. This is not a character flaw on your part. Some orgs systematically under-weight engineering input. Staying in one of them as a senior engineer is a slow career mistake.

The signals: your estimates are routinely overridden and routinely right. Risks you flagged show up in production. You find yourself saying *"I told them"* to your friends. You've stopped bothering to write the second-draft PRD because nobody reads it.

At that point, the most senior thing you can do — in every sense of "senior" — is leave for an org that will actually listen. The alternative is to shrink your voice until you match the org's expectations, which over a few years makes you unrecognizable to your earlier self.

## Phrasings That Work

A set of specific framings, field-tested, that raise concerns without raising hackles. Adapt as needed.

**Framing a premise question:**
> *"I want to make sure we're solving the right problem. Can we talk through the user need?"*

**Flagging risk before commitment:**
> *"I can build this. Before we commit, here are three risks I want us to weigh."*

**Offering alternatives:**
> *"I see two paths. Path A is faster but has trade-off X. Path B takes Y longer but avoids it. I want your read on which we should pick."*

**Recording dissent while committing:**
> *"I've captured my concerns in the doc. If we still decide to ship as scoped, I'll commit fully — I just want the concerns on the record for the retrospective."*

**Surfacing a missed constraint:**
> *"Help me understand the constraint I'm missing. From where I sit, Y looks cheaper. What am I not seeing?"*

Each of these does specific work. The first positions you as aligned on the goal. The second is risk management, not resistance. The third offers two choices rather than a single objection. The fourth reserves the right to be proven right later, without dragging your feet now. The fifth invites the PM to share information they probably have that you don't.

## Build Bridges, Not Battles

The overarching heuristic: **push back on ideas, never on people**. Roger Fisher and William Ury's *Getting to Yes* (1981), the foundational text of principled negotiation, framed this as *"separate the people from the problem."* Douglas Stone, Bruce Patton, and Sheila Heen's *Difficult Conversations* (1999, Harvard Negotiation Project) is the canonical treatment for the interpersonal case — they separate the "what happened" conversation from the "feelings" conversation from the "identity" conversation, and argue that conflating them is what makes difficult conversations go badly.

Practically: never make it about whether the PM is smart, skilled, or trustworthy. Make it about whether the specific proposal is the best option. The distinction is small in any single conversation and enormous across a working relationship.

## The Bottom Line

Pushback, done well, is a gift to the org. It catches mistakes before they become launches; it shapes features before they become bugs; it builds the kind of trust that makes future decisions faster, not slower. The craft is learning *when* to push (only when it's load-bearing), *how* to push (with specifics, alternatives, and stated risks), *where* to push (up the ladder in order, starting 1:1), and *how to commit* when you lose the argument (fully, not sullenly).

Engineers who master this become the people PMs want in every kickoff. The rest wait to be told what to build.

---
*Next in the series: the systemic version of all of this — how to shift a team or an org from shipping features to delivering outcomes, and why engineers are the people who can often drive that change even when leadership hasn't bought in yet.*
