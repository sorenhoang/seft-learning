---
title: "Jobs-to-be-Done: What Users Actually Want vs What They Say"
order: 2
tags: ["product-mindset", "jobs-to-be-done", "user-research", "product-thinking"]
date: "2026-04-22"
draft: false
---

A customer walks into a hardware store and says *"I need a quarter-inch drill."* Ted Levitt, the marketing professor, famously observed: they don't want a drill. They want a quarter-inch hole. They'd be delighted if there were a better way to make the hole — a laser, a well-placed suction cup, or some future technology that doesn't exist yet. The drill is an instrument, not the goal.

This is the central insight behind **Jobs-to-be-Done** (JTBD), the framework Clayton Christensen popularized for thinking about customer behavior. It's the single most useful mental model for engineers trying to read between the lines of a PRD — because PRDs, like the customer in the hardware store, describe the drill the team wants to build. JTBD asks what hole the user is actually trying to make.

## Origin and Canon

The framework didn't start with Christensen. Tony Ulwick at Strategyn developed **Outcome-Driven Innovation** in the early 1990s, using a similar logic. Christensen's version, popularized through *Competing Against Luck* (2016, with Hall, Dillon, and Duncan) and the HBR essay "Know Your Customers' Jobs to Be Done" (September 2016), is the trade-book canon. The **milkshake case study** — a classic of product-thinking — dates to a 2003 Christensen lecture, written up in HBS Working Knowledge as "Clay Christensen's Milkshake Marketing" in 2011.

The milkshake study is worth knowing because it shows the framework doing something other frameworks can't. A fast-food chain wanted to sell more milkshakes. They tried adding flavors, toppings, thicker consistency — all feature-centric thinking — and nothing moved. When Christensen's team watched actual customers, they discovered that roughly half of all milkshakes were bought before 8:30 AM by solo commuters. The job being hired? *"Keep me from getting bored on my morning drive, and fill me up so I'm not hungry by 10 AM."* The competition wasn't other milkshakes. It was bagels (messy), bananas (gone too fast), and donuts (crumbs in the car). The right "feature" wasn't more flavors — it was *thicker consistency* (lasts longer through the straw) and *chunks of fruit* (provides surprise during the drive).

No amount of user satisfaction survey about "what do you want in a milkshake?" would have produced that insight. JTBD is designed to find it.

## The Core Formulation

The standard JTBD statement takes a specific shape, popularized by Bob Moesta and Alan Klement:

> **When [situation],** I want to **[motivation],** so I can **[expected outcome].**

Concrete examples:

- *"When I'm commuting at 7 AM, I want something I can eat one-handed in traffic, so I can arrive at work without being hungry and bored."*
- *"When I'm in a design review with six people, I want to capture the decision without disrupting the flow, so I can make sure we remember what we agreed to."*
- *"When I finish a long debugging session, I want to note what I learned, so I don't forget it the next time this bug appears."*

Each statement has three parts: the *situation* (when), the *motivation* (want), and the *outcome* (so I can). The situation is the anchor — it locates the job in real life rather than in the abstract. The motivation is what the user is trying to do. The outcome is why they care.

A job has three dimensions:

- **Functional.** The practical result — get the hole, arrive fed, capture the decision.
- **Emotional.** How the user wants to feel — competent, not embarrassed, in control.
- **Social.** How the user wants to be perceived — prepared, diligent, organized.

A milkshake serves the functional job of filling the commuter up. It also serves the emotional job of providing a small pleasant ritual, and the social job of being a socially acceptable breakfast (unlike, say, a candy bar). Missing any of the three dimensions misses part of why people actually hire the product.

## Why This Matters for Engineers Specifically

Engineers are trained on literal spec execution. You read a ticket; you build the thing; you close the ticket. The discipline of inferring the *why* behind the *what* is exactly what JTBD provides.

Consider a PRD that says: *"Add dark mode to the app."* A literal-execution engineer builds a theme toggle with dark colors. A JTBD-fluent engineer asks: *what job is the user hiring dark mode to do?* If the job is *"reduce eye strain while coding at night,"* the right solution might be scheduled auto-toggle + OLED-aware palette + reduced blue-light timing — not a toggle at all. If the job is *"match my system preferences so I don't have to think about it,"* the right solution is a single "follow system" setting. If the job is *"look cool on screenshots,"* the right solution is a theme that photographs well.

Three different JTBDs, three different technical solutions. The PRD didn't say which. JTBD gives the engineer the vocabulary to ask.

## The Switch Interview

The practical method for uncovering JTBD is the **"switch interview"** (Bob Moesta, *Demand-Side Sales 101*, 2020; also Alan Klement's *When Coffee and Kale Compete*, free online). You interview people who *recently switched* to your product and reconstruct the moment of switch. What was happening in their life when they started looking? What had they tried before? What finally made them decide? What worried them about changing?

Moesta's **Four Forces** model describes the push-pull at the moment of switch:

- **Push of the current.** What's driving them away from their existing solution?
- **Pull of the new.** What's attracting them to the alternative?
- **Anxiety about the new.** What worries them about switching?
- **Habit of the present.** What's holding them in the status quo?

A product wins when push + pull > anxiety + habit. Understanding which of the four forces is binding tells you where to invest engineering effort — often in *reducing anxiety* rather than *adding features*, which is usually where engineering attention defaults.

## Personas vs Jobs

The common confusion worth naming: **personas** describe *who* a user is (demographics, psychographics, tech-sophistication). **Jobs** describe *what they're trying to do*. These are orthogonal.

A thirty-five-year-old product manager named "Sarah" is a persona. Sarah can hire a note-taking app to do many different jobs: capture a customer interview, write a launch email, draft a Medium post, remember why her last architecture decision failed. Same persona; four different jobs. A persona-centric design will try to make one product that serves all of Sarah's needs. A job-centric design will look at each job separately and ask whether the product serves it well.

The practical result: persona-thinking produces features with generic appeal. Job-thinking produces features with specific, measurable impact. Engineers doing product work benefit more from the latter.

## Limitations Worth Naming

JTBD isn't universal, and treating it as such produces its own failures.

- **Platform and infrastructure products often don't have a crisp "job."** A payments API is evaluated comparatively — does it match Stripe's capabilities at lower cost — more than it's "hired" for a job. Developer APIs are *compared*, not *switched to*. Forcing JTBD framing here produces analysis paralysis.
- **"Jobs wars."** Alan Klement and Tony Ulwick have publicly disagreed on the precise definition of a job (Klement rejects the formal "job executor" model; Ulwick's ODI insists on it). For practical engineering use, pick one framing and be internally consistent; the debate between purists is not your problem.
- **Buzzword theater.** Writing existing user stories in JTBD format without running switch interviews is cargo-culting. The value is in the *research discipline*, not the sentence structure.

A good test for whether a team is using JTBD well: can they name the *previous thing* their users tried before adopting the product, and what finally caused them to switch? If not, they're not doing JTBD; they're just writing differently-formatted user stories.

## The Engineer's Application

Concretely, how a senior engineer uses JTBD in their day-to-day:

- **Read the PRD. Write the implied JTBD statement.** If you can't write it, ask the PM directly: "What's the job the user is hiring this feature to do?" If they can't answer, the feature isn't ready to scope.
- **Use JTBD to challenge feature proposals.** When a PM says "let's add feature X," the engineer-mindset response is *"how do we build it?"* The product-mindset response is *"what job does this serve, and is this the minimal path?"* The second question sometimes exposes that the feature isn't the right path at all.
- **Look for existing workarounds in user behavior.** Workarounds are the strongest signal that users are hiring something — sometimes your product, sometimes a tool you didn't expect — to do a job you haven't thought about. Spreadsheets exported from dashboards are a goldmine.

The discipline is straightforward once it's a habit. The hard part is the first few times you do it — you'll feel like you're asking obvious questions, or you'll get "that's a PM question" back from a PM who wanted to move fast. Push through. Teams that do this well ship dramatically fewer wasted features.

---
*Next in the series: the engineer's pre-code review of a PRD — the specific gaps to spot, the questions to raise, and the "second draft" move that turns you from spec-receiver into spec-collaborator.*
