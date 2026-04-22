---
title: "User Interviews Through an Engineer's Lens"
order: 1
tags: ["product-discovery", "user-research", "user-interviews", "engineering-leadership"]
date: "2026-04-22"
draft: false
---

There's a specific signal that your organization is stuck in the old model of product development: engineers receive research summaries but never sit on a customer call. The summaries are filtered, compressed, and usually presented as a list of conclusions. Something has always been lost in the compression, and whatever's lost is often the thing that mattered.

This chapter is the case for engineers sitting directly on interview calls, and the minimum viable methodology for doing it without embarrassing yourself.

## Why Engineers Belong in Interviews

Teresa Torres's *Continuous Discovery Habits* (2021) calls it the **"product trio"** — PM, designer, and engineer jointly participating in discovery, not sequentially consuming each other's output. Marty Cagan, in *Inspired*, is even more direct: engineers at discovery *"typically produce the most innovative ideas"* because they're the only people in the room who know what's newly feasible. A clever hack in the infrastructure you shipped last quarter might make a previously-impossible product move a 2-week project — but only the engineer can see that, and only if they're in the room when the opportunity shows up in a user's story.

Concretely, engineers pick up three things in interviews that PMs and researchers usually miss:

- **Latent technical constraints.** A user says "I paste the data into a Google Sheet and clean it up before it's usable" — the researcher hears *workflow friction*; the engineer hears *our data model is exporting the wrong shape*.
- **Adjacent solutions.** The user describes their ideal; the engineer knows which parts are already 80% built in a different module and which are months of work.
- **Feasibility reality-checks in real time.** When the PM sketches a response ("so what if we..."), the engineer can flag "that would require rewriting the payment flow" without the team spending two weeks of design work on a dead end.

None of this works if engineers only read research summaries. It works when engineers are in the call, listening for the half-beat where the user says "actually, what I really wish was…"

## The Canonical Methodology

Three books form the core reading list. You don't need to read all three cover to cover; knowing their central ideas gets you most of the value.

- **Steve Portigal, *Interviewing Users* (2013; 2nd ed. 2023).** The craft of semi-structured interviewing. Teaches the "grand tour" opening question and the strategic use of silence as a technique.
- **Erika Hall, *Just Enough Research* (2013; 2nd ed. 2019).** The pragmatic-operator view. Research is *"the systematic investigation of materials and sources"* — you don't need a researcher title to do it, and most organizations don't have one.
- **Teresa Torres, *Continuous Discovery Habits* (2021).** The cadence argument: weekly touchpoints with three or more customers, non-negotiable. Combined with the **Opportunity-Solution Tree** (desired outcome → opportunities → solutions → assumption tests).

A fourth, shorter book worth reading is **Rob Fitzpatrick's *The Mom Test* (2013)**. The central insight: people (including your mom) will lie to be polite about your idea. The way to avoid polite lies is to ask about their *past behavior*, not their *future intentions*.

## Engineer-Specific Pitfalls

Engineers bring specific anti-patterns to interviews that other disciplines don't. Catch yourself on these:

**Solutioning mid-interview.** You hear a problem and your brain produces a solution, which you want to validate. *"So you'd want a dropdown that..."* — and the user, being polite, agrees. You haven't learned anything new; you've just anchored them on your half-formed idea.

**Debating feasibility.** The user describes an aspiration; you explain why it's technically hard. The user loses interest and the interview turns into an architecture discussion they're not qualified to have. Save feasibility debate for the design review.

**The "so you want X? we could do Y" trap.** You map their words onto your current mental model of the system and start translating in real time. This is premature architectural commitment happening inside your head. Keep it there — on paper, *after* the interview.

**Leading questions rooted in build-cost.** *"Would a simple toggle work?"* is a question optimized for what's easy to build, not what's right. The real answer might require a feature that's harder to build but 10× more valuable.

**Confirmation bias with pass/fail thinking.** Engineers are trained on unit tests — binary, green, done. Interviews are qualitative and probabilistic. You're not looking for yes/no; you're looking for *patterns across five conversations*.

## Good and Bad Question Patterns

Two kinds of questions earn their keep:

- **"Tell me about the last time you [did X]."** Anchors the user in real memory. They stop generating hypotheticals and start recalling events.
- **"Walk me through what happened, step by step."** Forces narrative. You'll hear about the five steps they didn't mention in the summary.
- **"What did you do *before* that?"** / **"What happened next?"** Reveals the workflow around the moment they originally described.
- **"What would have to be true for you to [take action]?"** Surfaces blockers without being leading.
- **The Five Whys** (Toyota) — repeated "why did that matter?" to drill to the underlying need.

And the ones to avoid:

- *"Would you use a feature that...?"* A hypothetical is fiction. People will say yes to be polite (Fitzpatrick's *Mom Test* insight).
- *"How do you feel about...?"* Abstracts away from behavior. You get a feeling; you needed a story.
- *"If you could have anything, what would..."* A wish-list exercise. Wishes don't translate to purchase behavior.
- *"Do you think X is a problem?"* — leading plus hypothetical, the worst combination.

## Getting Three Calls a Week as an Engineer

Torres's weekly-interview cadence sounds intimidating if your company has no research function. It shouldn't. There are concrete, low-friction ways an engineer can get into three customer conversations every week, even in a small startup or a siloed enterprise:

- **Ask your PM to add you to their interview rotation.** Most PMs are thrilled to have an engineer show up — it signals the feature will actually get built.
- **Shadow sales discovery calls.** Sales teams run these constantly. In consumer SaaS, they often have a Gong library of recorded calls you can skim.
- **Join support escalations.** When a customer has a P1 issue, there's a call with their team. You learn more in 30 minutes about how they actually use the product than in a month of reading dashboards.
- **Read Zendesk or Intercom tickets directly.** Not technically interviews, but free qualitative signal. Spend 30 minutes a week in the queue.
- **Attend customer-success QBRs** (quarterly business reviews) with top accounts. High signal, especially for enterprise products.
- **Run internal dogfooding sessions** with power users inside your company. Lower-stakes practice for the skill.

Listen for three signals in particular:

- **Workarounds** — spreadsheets, manual scripts, tabs kept open for hours. Every workaround is a feature you haven't built.
- **Unmet needs** — things they gave up on. "We used to try to..." is a goldmine.
- **Emotion spikes** — frustration, relief, surprise. These mark the parts of the experience that are *load-bearing* emotionally; everything flat in between is easy to forget.

## From Notes to Something Actionable

The hardest part of interview work is the synthesis. Raw notes don't produce decisions. Two tools help:

**Observation vs insight.** An *observation* is a thing you heard or saw: *"Alice exports a CSV every Monday morning and reformats it in Excel."* An *insight* is what it implies: *"the weekly-reporting ritual is the real job, not the export itself."* Engineers tend to stop at observations; insights are what drive decisions.

**Affinity mapping.** Write each observation on a sticky (physical or Miro). Cluster related ones. Label each cluster. The labels are often opportunities worth investigating. This is the same pattern you'd use for an architectural retrospective — the tool is domain-independent.

**Opportunity-Solution Tree (Torres).** The clusters become *opportunities* under a *desired outcome*. Each opportunity can be served by multiple *solutions*; each solution has *assumption tests* that let you de-risk it before building. The tree is the bridge between qualitative interview data and the quantitative experimentation of the next chapter.

## The Habit, Not the One-Off

Interview skill compounds with reps. The first three interviews you run yourself will feel awkward — you'll ask leading questions, interrupt silences, and walk out without clear takeaways. By the fifteenth, you'll be catching yourself before you solution, sitting through silences until the user fills them, and walking out with two or three insights that change your roadmap.

The fastest way to get to the fifteenth interview is to commit to one a week for a quarter. Schedule them now, before the rest of this chapter fades.

---
*Next in the series: how to combine what you hear in interviews with what you measure in your dashboards — and why "data-driven" is usually the wrong aspiration.*
