---
title: "Effective Meetings: When, When Not, and How to Run Them"
order: 4
tags: ["meetings", "remote-work", "communication", "async-communication", "engineering-culture", "productivity"]
date: "2026-04-22"
draft: false
---

A one-hour meeting with eight people costs eight hours of collective time. If it could have been handled asynchronously in twenty minutes per person, it cost the team five hours of unnecessary work. If it surfaced a risk that would have caused three weeks of rework, it was one of the most valuable hours the team spent.

Meetings are neither inherently good nor inherently bad. They are a tool with specific appropriate uses and specific inappropriate uses. The engineers and teams that use this tool well do better work. The ones that use it habitually — scheduling meetings because that is what you do — waste significant capacity and create a culture that signals "deep work is interruptible."

## When Meetings Are Justified

A meeting is the right tool when at least one of these is true:

**The decision requires real-time reactions.** Some decisions are too nuanced or too consequential for async. A trade-off discussion where the right answer depends on how different people react to each other's reasoning benefits from the spontaneity of a live conversation. A proposal where the emotional temperature matters — where you need to see whether the room is with you or against you — needs presence.

**The work is inherently collaborative and synchronous.** Pair programming, collaborative debugging, whiteboard design sessions where the output evolves from the conversation — these are things that do not work async. The meeting is the medium.

**The group needs shared context that would be slow to build through documents.** Onboarding a new team member to a complex system, explaining a nuanced architectural constraint that has many interdependencies — sometimes the fastest path to shared understanding is a focused live session, not ten documents.

**The conversation requires emotional nuance.** Sensitive feedback, a team conflict, a difficult performance conversation — these should almost never be async. Text removes the signals that make these conversations workable.

## When Meetings Are Not Justified

**A decision can be made asynchronously.** If you are scheduling a meeting to decide something, ask whether an RFC, a written proposal, or a shared document with comments would surface the same information and produce the same decision in less time. Often the answer is yes.

**The meeting is for status reporting.** Status can be written and read on each person's schedule. A weekly team meeting that exists primarily to report status is converting individual reading time into collective time — a bad trade. Status belongs in documents.

**The meeting is for something that one person needs to communicate to many.** An announcement, a policy update, a product decision — these should be written, not met. A meeting adds no value to an information broadcast that a well-written document cannot provide more efficiently.

**The participants could contribute just as effectively in writing.** If the meeting consists of people presenting prepared thoughts with minimal real-time interaction, those thoughts could have been documents.

## The Required Elements of Any Meeting You Schedule

If you schedule a meeting, you are responsible for making it worth attending. That means providing, before the meeting starts:

**A clear agenda.** Not just a topic — a list of the specific questions or decisions the meeting will address. "Sprint planning" is a topic. "Decide scope for the auth refactor, prioritize the three platform migration tasks, and confirm ownership of the mobile bug triage" is an agenda. Participants who have an agenda can prepare; participants who have only a topic cannot.

**Pre-read materials, when relevant.** If participants need context to participate effectively, give it to them before the meeting. The meeting itself should not be spent bringing people up to speed — it should start at the level the pre-read established.

**A defined decision or output.** Every meeting should end with something concrete: a decision that was made, a set of action items with owners and due dates, or a clear statement of what the next step is. A meeting that ends without a concrete output has produced nothing but the appearance of progress.

## How to Run a Technical Meeting

**Start on time, always.** Starting five minutes late for a ten-person meeting wastes fifty minutes of collective time and signals that the time of people who arrived on time is less valuable than the comfort of people who did not. This norm, once established, compounds positively and quickly.

**Open with the goal.** Thirty seconds at the start: "We are here to decide X. By the end of this meeting, we need to have made that call." This reorients participants who joined without reading the agenda and keeps the discussion from drifting.

**Assign a facilitator and a note-taker.** The facilitator manages the conversation — keeps it on track, gives quieter people space to speak, calls time when a topic has run over. The note-taker captures decisions and action items in real time. These can be the same person for small meetings; for larger ones, split the roles.

**Timebox each agenda item.** "We have ten minutes for the deployment decision and fifteen for the migration prioritization" gives participants a sense of pace and gives you the authority to move on when a topic runs over. Without timeboxes, the most verbose agenda items consume the meeting.

**End with explicit action items.** Before closing: "Here is what we decided, here is who is doing what, here is the deadline." Read them aloud. This catches misalignments before the meeting ends rather than in a Slack thread three days later.

## Deciding Whether to Attend a Meeting You Were Invited To

You are not obligated to attend every meeting you are invited to. The question to ask: "Is my participation essential, or am I invited for optional context?" If optional, decline and ask to receive the notes. Your time is a resource, and spending it in meetings that do not require your presence directly reduces your capacity for the work that does.

The way to do this without creating friction: be explicit when you decline. "I am going to skip this one and read the notes — ping me if there is something you need my input on before the meeting." This signals that you are engaged and available, not uninterested.

## The Practical Move This Week

Review your calendar for the next week. For each recurring meeting, ask: what has this meeting produced in the last month that could not have been produced asynchronously? If the answer is "not much," propose to the organizer a switch to async for one month and see what is lost.

---
*Next: documentation as a communication tool — how to write things down in a way that actually serves your team, and why most engineering documentation fails the people it was meant to help.*
