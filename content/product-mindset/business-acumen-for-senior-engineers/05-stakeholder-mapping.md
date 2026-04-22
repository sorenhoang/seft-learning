---
title: "Stakeholder Mapping"
order: 5
tags: ["business-acumen", "stakeholder-management", "leadership", "communication", "influence"]
date: "2026-04-22"
draft: false
---

Most "technical failures" at companies past 50 engineers are stakeholder-management failures in disguise. The platform rewrite that ships and doesn't get adopted. The migration that sets off a finance alarm nobody saw coming. The architecture decision that gets overruled by someone who wasn't in the room for any of the three design reviews. None of these are technical failures in the strict sense. The code worked. The design was sound. The social system around the code didn't line up.

This chapter is about the social system — how to see it, map it, and work it deliberately.

## An Opening Example

A platform team at a 400-engineer company spends nine months rewriting the internal auth service. The new one is faster, better tested, cleaner. The API surface is more principled. On a technical scorecard, it beats the old one on every axis.

Ship day comes. Two consumer teams — the ones whose applications account for most of the auth traffic — refuse to migrate. Their reasons, on closer inspection:

- The new API broke their SDK codegen pipeline. Nobody on the platform team had checked.
- Their PM had never heard of the project. She'd just planned a high-priority launch for the same quarter.
- A principal engineer on one of the teams had built the original v1. He was taking the rewrite personally, and he had more political capital than the platform team's manager realized.

The project gets reclassified as "optional." A year later the old service is still running. Every quarterly roadmap review re-litigates the migration. Nobody is happy.

Every engineer reading this can identify at least two projects in their career that went like this. The diagnosis is almost always the same: the team confused *technical correctness* with *organizational readiness*. Stakeholder mapping is the discipline that keeps you honest about the difference.

## Why This Skill Isn't Optional Past Senior

At senior and below, the job is mostly individual execution. You don't need to map stakeholders to write a well-tested service. At staff/principal and above, your job is increasingly *to orchestrate work that crosses team boundaries* — and the moment work crosses a team boundary, stakeholder management becomes the core skill.

Two diagnostic questions that tell you whether you're under-investing here:

1. Have you ever been "surprise-vetoed" late in a project by someone you forgot to include? (Everyone has. The question is whether you've adjusted since.)
2. Can you name, for your current top-priority project, the three people whose buy-in is non-negotiable — and when you last talked to each of them 1:1?

If you can't answer the second cleanly, you have a stakeholder-mapping gap, not a technical one.

## The Canonical Frameworks

There are more frameworks than you need. Three are worth knowing by name.

### Mendelow's Power/Interest Grid

Introduced by Aubrey Mendelow at ICIS 1991. A 2×2 matrix with two axes:

- **Power**: how much this stakeholder can affect the project's outcome.
- **Interest**: how much they care about it.

This produces four quadrants:

```
                     High Power
                         |
         Keep Satisfied  |  Manage Closely
                         |
    Low Interest --------+-------- High Interest
                         |
            Monitor      |  Keep Informed
                         |
                     Low Power
```

- **Manage Closely** (high power, high interest): direct stakeholders. Weekly 1:1s. Deep involvement in design decisions.
- **Keep Satisfied** (high power, low interest): execs and senior leaders who don't care *until they do*. The quadrant engineers miss most often. A 1-page monthly memo is usually enough — until something goes wrong, at which point their interest spikes and your credibility is entirely determined by how well you've kept them satisfied so far.
- **Keep Informed** (low power, high interest): enthusiastic consumers, other teams who'll be affected. Regular async updates; invitation to design reviews.
- **Monitor** (low power, low interest): peripheral. Don't actively engage unless the situation changes.

The under-invested quadrant is always *Keep Satisfied*. The over-invested quadrant is often *Keep Informed* — you end up spending too much time updating people who were never going to block you.

### The Salience Model (Mitchell, Agle, Wood, 1997)

A more nuanced framework from *Academy of Management Review*. Instead of two axes, it uses three attributes — and stakeholders are classified by which they possess:

- **Power** — the ability to impose will.
- **Legitimacy** — socially accepted right to have a voice.
- **Urgency** — time-pressure and criticality of their claim.

The seven resulting classes are worth knowing mostly for two of them:

- **Definitive stakeholder** (all three attributes) — can't ignore. Your exec sponsor, the security org on a data-classification-changing project, the CFO on a budget-breaking initiative.
- **Dangerous stakeholder** (power + urgency, missing legitimacy) — the person or group with power and a sense of urgency who will derail your project through side channels. They haven't been given formal authority, but they'll exert it anyway. Recognize them before they surprise you.

Most engineers don't need the full seven-way taxonomy. The specific insight that's worth carrying is: *a stakeholder without legitimacy can still stop your project if they have power and perceive urgency*. Ignoring them because they "shouldn't" have a say is how projects die.

### RACI

A lighter-weight, execution-phase tool:

- **Responsible** — does the work.
- **Accountable** — ultimately owns the outcome. **There should be exactly one per decision.**
- **Consulted** — provides input before the decision.
- **Informed** — told after the decision.

RACI is most useful once a project is funded and you're lining up execution. The most common failure mode is listing 4 Accountables, at which point nobody is actually accountable and decisions stall. One A per decision. Non-negotiable.

## A Working Example: Launching a New Internal API

Stakeholder mapping is most learnable on a concrete example. Assume you're a tech lead proposing a new internal API that multiple consumer teams will call. Who matters?

- **Consumer teams and their PMs** → Manage Closely. They are the users. Bring them in as design partners before the API surface is stable. If their PM doesn't know about your project, you don't have a project.
- **Platform team peers** → Consulted. They'll need to integrate, and they have strong opinions about interface contracts.
- **Security / AppSec** → Keep Satisfied, escalating to Definitive if data classification changes. The threat-model review is a gate, not a suggestion.
- **Compliance / Legal** → Usually Dormant (to use the Salience vocabulary), but if your API touches personal data or crosses regional boundaries, they become Definitive overnight.
- **Finance / FinOps** → A surprise-veto source if the project shifts cloud spend by more than ~5% of a budget line. Bring them in early if the cost delta is non-trivial.
- **Exec sponsor** → Keep Satisfied. A monthly 1-pager (*what shipped, what's coming, where I need your help*) is usually the right cadence — not weekly updates, which just get skimmed.
- **Downstream: SRE, Support, DevRel** → Keep Informed *before* launch. If they find out about your API the day it ships, they will be Dangerous (power + urgency, missing legitimacy) the first time something breaks.

Notice that the most technically interesting stakeholders — the consumer teams — are only one slice. The remaining slices are where the project actually lives or dies.

## Hidden Stakeholders: Where Surprise Vetoes Come From

The repeating lesson of every project post-mortem: the stakeholder that killed it wasn't in the original map. Common hiding spots:

- **Security and AppSec** — especially when a project is late in the quarter and the team is trying to avoid "slowing down."
- **Legal and Privacy** — GDPR, DPAs, any data crossing jurisdictions. If the answer to "does this touch personal data?" is "kind of," you need legal in the loop.
- **Finance and Procurement** — any new vendor, any new SaaS contract, any cloud-spend shift over a threshold. Procurement in particular has been known to block entire launches over contract terms.
- **Executive assistants** — they control the decision-maker's calendar. Technically they aren't stakeholders; practically, if you can't get on the calendar, the project is stalled.
- **Support leadership** — inherits the runbook burden for anything you ship. If you haven't talked to them, your launch will ship and your support team's queue will explode and everyone will be unhappy.
- **The engineer on another team who built v1** — this is specific enough to be a named role at most companies. Projects that rewrite or deprecate someone's previous work need that person's buy-in, or at least their managed exclusion. Ignoring them is how you create a Dangerous stakeholder.

## Pre-Work: The "No Surprises" Rule

The single most valuable habit in stakeholder management is the *no surprises* rule:

> Every person in a decision meeting should already know your position and their concerns should already be addressed before they walk in. The meeting ratifies; it does not decide.

Mechanically, this means:

- **1:1 pre-alignment** before any consequential meeting. Short conversations — 20 minutes each with the three or four people who matter most. You walk them through the proposal, hear their objections, and incorporate or pre-answer them.
- **Coalition before consensus.** You want two or three people walking into the meeting already supporting your position. A decision reached with two pre-aligned advocates in the room is radically easier than one with none.
- **Continuous mapping.** Stakeholder maps go stale. A reorg, a new VP, a shifted priority — any of these can change who matters. Refresh your map at project-start and at every major milestone.

Gabarro and Kotter's **"Managing Your Boss"** (HBR 1980, revised 2005) is the classic treatment of this for the manager-relationship case, and most of it generalizes. Their core point: understand your boss's goals, pressures, and blind spots, and adapt your working style accordingly. Replace "boss" with "stakeholder" and the guidance holds.

## Common Anti-Patterns

**The cold-drop RFC.** You post a 20-page design document in #engineering on Friday afternoon, expect feedback by Monday, and read silence as consent. It isn't; it's busy people ignoring you.

**"We decided internally" syndrome.** Your team makes a decision that affects other teams and announces it as a fait accompli. Every team you didn't consult is now an obstacle.

**One-time mapping.** You list stakeholders at project kickoff and never revisit. Three months in, two of them have moved to different teams and one has been replaced. You're still running on the old map.

**Confusing authority with influence.** The person with the title isn't always the person with the power. A principal engineer without a manager title often has *effective veto* that a VP doesn't. Pay attention to who people actually listen to, not just who signs offer letters.

**Treating stakeholder work as "politics."** Some of it is. Most of it is vocabulary and coordination — the same skills you use to align a design review across three engineers, scaled up to align a project across three departments. Reframing "politics" as "explicit coordination" makes it feel less dirty and more teachable.

## A Template You Can Actually Use

Before your next cross-team initiative, fill in the following for ten minutes:

1. **Who are the three people with the most power to stop this?** How will I pre-align with each of them before the kickoff meeting?
2. **Who are the hidden stakeholders I'm most likely to miss?** (Security, legal, finance, downstream ops, the engineer who built v1.)
3. **For each, what's their current disposition — supportive, neutral, skeptical, opposed?** What would move them one step toward supportive?
4. **Who's the single Accountable for the overall decision?** Not "owners" plural — one name.
5. **When is my next planned 1:1 with each Manage Closely stakeholder?** (If the answer is "not scheduled," fix that today.)

The exercise takes ten minutes and routinely prevents three months of avoidable rework. This is, for senior engineers, one of the highest-leverage ten minutes you can spend on any given project.

---
*Next in the series: the mechanics of actually making your case — how to present technical work to audiences who don't share your vocabulary, and the structures that work when you only have sixty seconds.*
