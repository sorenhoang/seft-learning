---
title: "Presenting Technical Work to Non-Technical Audiences"
order: 6
tags: ["business-acumen", "communication", "executive-communication", "presentations", "minto-pyramid"]
date: "2026-04-22"
draft: false
---

The deck was good. Forty slides, well-designed, covering the problem space, the constraints, the options considered, the chosen architecture, the rollout plan, the risks, the mitigations. The engineer who built it had been thinking about the problem for six weeks. The meeting was fifteen minutes long. By slide seven the CFO was checking his phone; by slide twelve the VP of Product had opened a tab for something else. Nobody said no. Nobody said yes. The project, quietly, did not happen.

This chapter is about why that happens and what to do differently. There's a small number of techniques that senior engineers eventually pick up — Barbara Minto's Pyramid Principle, the Amazon six-pager, the discipline of leading with the ask — and they change the hit rate on technical proposals dramatically.

## The Mistake Engineers Make

Engineers reason bottom-up. We gather evidence, chase implications, reach conclusions. We write that way too — context, analysis, trade-offs, recommendation. It's how scientific papers are structured. It's how good code reviews unfold.

Executives read top-down. They want the conclusion first, and they'll decide whether to keep reading based on whether it answers a question they're already carrying. If the first sentence of your memo isn't a recommendation, they may never get to the sentence that is.

This mismatch — *bottom-up thinking, top-down audience* — is the root cause of most of the failed technical presentations you've ever given. The fix is a structural one: learn to invert your writing.

## The Minto Pyramid Principle

Barbara Minto formalized this at McKinsey in 1978. The book, *The Pyramid Principle*, is the canonical treatment. The central rule:

> **Start with the answer. Then give supporting arguments. Then give evidence.**

Structurally: your main recommendation is at the top. Two to four supporting arguments sit beneath it. Each argument is supported by evidence. The reader can stop at any level and still have a coherent understanding.

In practice, a Minto-style opening to a technical proposal reads like:

> "We should migrate our primary data store from Postgres to a dedicated time-series database by Q3. Doing so will cut our monthly hosting bill by $60k, reduce p99 query latency on dashboards from 3.2s to under 400ms, and remove the largest recurring source of on-call pages for the team. The transition will take four engineer-months and requires a two-week dual-write period."

Four sentences. Three of them are evidence with numbers. Every decision-maker in the room now knows: what you want, what they get, what it costs. Only after this do you go into the technical details — and crucially, you only go as deep as the audience needs. If no one has questions, you stop.

## SCQA: The Opening Formula

Minto pairs the pyramid with a specific opening structure called **SCQA**:

- **Situation** — a piece of shared context nobody will dispute.
- **Complication** — what has changed, broken, or become newly urgent.
- **Question** — the implicit question the complication raises.
- **Answer** — your recommendation.

Applied to the database example:

- **S:** Our product's core dashboards run on Postgres, which has served us well for five years.
- **C:** Query volume has tripled in the last eight months, pushing p99 latency on dashboards from 400ms to over three seconds and driving a 40% increase in on-call incidents.
- **Q:** *(Implicit: what do we do about it?)*
- **A:** Migrate the time-series workload to a dedicated store by Q3.

This is a 30-second opening. It earns you the rest of the meeting. Skip it — jump straight into "so here's our migration plan" — and the audience is still trying to figure out what question you're answering while you're already on slide 5.

## The Executive Mindset

Some blunt realities worth internalizing:

1. **Executives have sixty seconds of attention for your ask, not sixty minutes for your journey.** If the ask isn't clear in the first minute, you've lost the room.
2. **They buy outcomes, not implementations.** "Saves $60k/month, removes on-call top complaint" is an outcome. "Switch from Postgres to TimescaleDB" is an implementation. Lead with the first; the second is a detail.
3. **The question in their head is "what do you want me to do?"** Approve a spend? Support a reorg? Communicate to the board? Make sure they know, explicitly, before anything else.

You'll notice that senior engineers who are good at this don't skip the technical detail — they just bury it. The technical detail is on slide 6, for anyone who wants it. Slide 1 is the ask.

## Translating Technical Concepts

Some analogies are load-bearing and some are distractions. A few rules that work:

- **Use concrete, everyday referents.** A queue is like an airport security line. A cache is like a fridge next to a pantry — fast access to the stuff you use most. A shard is like a franchise restaurant chain: every location has the same operations, but only serves its own customers.
- **Avoid analogies that require the listener to already understand the source domain.** "It's like a distributed commit log" is useless to someone who hasn't implemented a local commit log either.
- **Apply the "smart 12-year-old" rule** — Feynman's test. If you can't explain the core of your proposal to a sharp 12-year-old in five minutes, you don't fully understand it yet. (Note: this is a self-check, not an audience assumption. Don't address the CFO like they're a 12-year-old; just confirm your own understanding is solid before the meeting.)
- **Use diagrams only when the relationship between components is the argument.** If the diagram doesn't carry the point, cut it. A flowchart full of boxes and lines that doesn't resolve into "therefore, X" is decoration.

## Format Selection: Demo, Deck, or Doc

The medium is part of the message.

**The Amazon six-pager.** Jeff Bezos formalized this as Amazon's default: a six-page narrative memo, in complete sentences and full paragraphs, read silently at the start of the meeting for 20–30 minutes before discussion begins. The theory: bullet points let you get away with vague thinking; narrative forces rigor. No matter what format your company uses, writing a six-pager privately is one of the best ways to stress-test your own argument. If you can't defend it in prose, the bullets won't save you.

**The slide deck.** Best when you need to drive a linear argument in a room with eight or more people, or when the audience needs visual structure to follow along. Keep it short — under 15 slides for a 30-minute meeting. Every slide needs to answer "so what?" If it doesn't, cut it.

**The demo.** Only if the system is genuinely rock-solid. A flaky demo — a 500 error, a loading spinner that hangs, a data point that looks wrong — is a credibility bomb that you can't recover from in the same meeting. If there's even a 10% chance of a bad demo, record it beforehand and play the recording.

**The RFC or design doc.** Async, durable, reference-able. Use this when the decision doesn't need to be made in a meeting and you want a record.

Most technical leaders over-use slides. They're the highest-status format at most companies but usually the least effective for actually making decisions. For any consequential proposal, write the six-pager first. You may still translate it into a deck for the meeting, but the thinking will be better.

## Tactical Rules That Compound

A set of specific rules that change the hit rate on proposals:

**Lead with dollars, risk, or revenue.** "This saves $800k/year in egress costs" beats "we're moving to a different CDN." Always translate the ask into one of the three currencies executives care about.

**Quantify or cut.** "Faster" is noise. "p99 latency improves from 2.1 seconds to 340 milliseconds, which correlates with a 12% conversion lift on checkout" is signal. Every comparative claim should have a number behind it. If you can't get a number, the claim probably isn't worth making.

**Pre-read beats live-read.** Distribute the memo or deck 24 to 48 hours before the meeting. People who read ahead will come in with better questions. Even if only half the room pre-reads, the dynamic of the meeting will shift toward discussion rather than presentation.

**Apply the "so what?" test.** Go through your deck slide by slide and ask: does this answer *so what?* If it doesn't, delete it. Do this ruthlessly. A six-slide deck that answers "so what" six times beats a twenty-slide deck that answers it twice.

**Rehearse the first sixty seconds until it's mechanical.** The rest of the meeting can flex; the opening cannot. If you fumble the ask, you spend the rest of the meeting recovering from slide 1 rather than building on it.

**Know what objection will come from whom, and pre-answer it.** From chapter 5 — stakeholder mapping pays off here. If you know the CFO will ask about the migration window, address it on slide 3 rather than letting them interrupt on slide 6.

## Pre-Meeting Dynamics

The most overlooked variable in a technical presentation is what happens *before* the presentation.

**1:1 with the actual decision-maker.** Walk them through the proposal privately. This is not a pitch — it's a rehearsal of their objections. If they're going to push back, you want that pushback in the 1:1, not in front of six other executives. You can adjust; you cannot if it happens publicly for the first time.

**Know the actual decider vs the loudest voice.** These are often different people. The actual decider may be the quiet executive who rarely speaks; the loudest voice may be a senior engineer with strong opinions but no authority. Know which is which before you walk in.

**Have your coalition lined up.** At least two people in the room should already support your proposal when you walk in. A decision meeting with two pre-committed advocates is radically easier than one where you're starting from cold.

## Anti-Patterns

**"We chose Kafka because…"** — no executive cares about your queue. They care about what the queue enables, and only to the extent that it affects cost, risk, or revenue.

**The 40-slide deck at 8-point font.** This is a written-not-presented deck pretending to be a presentation. Either turn it into a doc and send it out, or cut it to ten slides.

**Surprising the CFO with a cost number.** A $2M/year infrastructure bump that first appears on slide 14 of a live deck is how proposals get killed. Pre-align on anything with material cost implications. Finance does not enjoy surprises.

**A live demo of a system with any flakiness.** See above. Pre-record it.

**Burying the ask.** If someone has to read 23 slides to learn what you're asking for, they will not read 23 slides.

## The Closing Test

Before any consequential technical presentation, run these five checks:

1. **Can I state the ask in one sentence?**
2. **Is the first slide or first paragraph that sentence?**
3. **Have I pre-aligned 1:1 with the most powerful stakeholder in the room?**
4. **Have I quantified every comparative claim?**
5. **Would this still land if they only read slide 1?**

If all five answers are yes, the meeting will probably go well. If two or more are no, you're not ready — reschedule if you can.

## Why This Series Ends Here

The full arc of these six chapters, one more time:

1. Why senior engineers need business acumen.
2. How to read a P&L and unit economics.
3. How business models shape architecture.
4. Cost-aware engineering.
5. Stakeholder mapping.
6. Presenting technical work.

Chapters 2 through 4 gave you the *content* — the financial, model, and cost vocabulary you need to make a serious case. Chapters 5 and 6 gave you the *conveyance* — the mapping and communication craft that gets the case heard.

Neither half works without the other. Perfect stakeholder mapping paired with a financially incoherent proposal still fails; a brilliant P&L analysis delivered on slide 23 still fails. Senior engineers ship things because they can do both: the content is tight, and the conveyance is deliberate.

The skill set in this series is the ceiling on how big a technical idea you can move through your company. Put differently: your best ideas are already there. What's missing — if anything is — is the part that turns them into decisions. That's the part this series was written to cover.

---
*This is the final chapter of Business Acumen for Senior Engineers. Pick one current or upcoming project, apply one idea from each chapter to it over the next quarter, and the compound effect will be larger than you expect.*
