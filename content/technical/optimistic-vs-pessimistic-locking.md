---
title: "Optimistic vs Pessimistic Locking: Choosing the Right Concurrency Strategy"
description: "Two ways to handle concurrent writes — lock first and ask questions later, or assume conflicts are rare and detect them at commit. When to use which, with concrete SQL and code."
tags: ["Databases", "Concurrency", "System Design", "Backend"]
date: "2026-04-29"
draft: false
---

# Optimistic vs Pessimistic Locking

When two users try to update the same row at the same time, one of them is going to step on the other unless your system has a story for it. That story is **concurrency control**, and it almost always boils down to one of two strategies: **pessimistic locking** or **optimistic locking**.

The names tell you the philosophy. Pessimistic assumes a conflict *will* happen and prevents it upfront. Optimistic assumes conflicts are rare and only checks at the last moment.

---

## The problem: lost updates

Consider a classic scenario — two support agents editing the same customer record:

```
T0  Agent A reads customer #42 (name="Alice", phone="111")
T1  Agent B reads customer #42 (name="Alice", phone="111")
T2  Agent A writes phone="222"
T3  Agent B writes phone="333"   ← A's update is silently overwritten
```

Both reads succeeded, both writes succeeded, but Agent A's change is gone. No error, no warning. This is the **lost update problem**, and it's what locking is designed to prevent.

---

## Pessimistic locking — lock first, work later

Pessimistic locking grabs an exclusive lock on the row *as soon as you read it*. Anyone else who tries to read or modify it has to wait until you commit or roll back.

In SQL, this is `SELECT ... FOR UPDATE`:

```sql
BEGIN;

SELECT id, name, phone
FROM   customers
WHERE  id = 42
FOR UPDATE;        -- row is now locked for this transaction

-- ... agent edits the form, makes a decision ...

UPDATE customers
SET    phone = '222'
WHERE  id = 42;

COMMIT;            -- lock released
```

While this transaction is open, any other `SELECT ... FOR UPDATE` or `UPDATE` on row 42 blocks. The second agent waits — or times out — until the first one finishes.

**Strengths**

- Simple mental model: if you read it, you own it.
- No retries needed — by the time you write, you know nothing has changed.
- Strong correctness for short, contended operations (think: deducting from an account balance).

**Weaknesses**

- Locks held across user think-time are catastrophic. If Agent A reads the row and goes to lunch, everyone else is blocked for 45 minutes.
- Deadlocks become possible if multiple rows are locked in different orders.
- Doesn't scale across services or HTTP requests — a lock only lives inside one database transaction.

> Rule of thumb: pessimistic locks are for **short**, **server-side** critical sections — not for "a human is editing a form" workflows.

---

## Optimistic locking — write and check

Optimistic locking takes the opposite bet: most of the time nobody else is touching this row, so don't lock anything. Instead, every row carries a **version** (or a timestamp). When you write, you assert the version hasn't changed. If it has, the write fails and the caller decides what to do.

The schema gets a `version` column:

```sql
ALTER TABLE customers ADD COLUMN version INT NOT NULL DEFAULT 0;
```

The read returns the current version:

```sql
SELECT id, name, phone, version
FROM   customers
WHERE  id = 42;
-- → version = 7
```

The write asserts the version *and* bumps it atomically:

```sql
UPDATE customers
SET    phone   = '222',
       version = version + 1
WHERE  id      = 42
  AND  version = 7;        -- the assertion
```

Now check `rowCount`:

- `1` → success, your update went through and the row is now at version 8.
- `0` → somebody else updated it first. The row is no longer at version 7. **Conflict.**

When a conflict happens, you have three choices: re-read and retry automatically, re-read and let the user merge, or surface an error. Most ORMs (JPA's `@Version`, Django's `select_for_update` alternative, SQLAlchemy's `version_id_col`, ActiveRecord's `lock_version`) wrap this pattern and throw a `StaleObjectException` or similar.

**Strengths**

- No locks held — perfect for long workflows where users edit data over seconds, minutes, or HTTP requests.
- Scales horizontally; works across stateless services.
- Cheap when conflicts are rare.

**Weaknesses**

- You must handle conflicts somewhere — automatic retry, user-facing merge, or an error path.
- Wasted work on conflict: the user filled out a form, hit save, and now has to redo it.
- Bad fit for high-contention rows (e.g., a single inventory counter for a flash sale) — you'll spend more time retrying than working.

---

## A side-by-side

| Dimension              | Pessimistic                              | Optimistic                                   |
|------------------------|------------------------------------------|----------------------------------------------|
| Default assumption     | Conflicts are likely                     | Conflicts are rare                           |
| Mechanism              | DB row locks (`SELECT ... FOR UPDATE`)   | Version column + conditional `UPDATE`        |
| Lock duration          | Length of the transaction                | None                                         |
| Best for               | Short critical sections, hot rows        | Long workflows, low-contention rows          |
| Failure mode           | Blocking / timeout / deadlock            | Conflict on commit → retry or surface        |
| Cross-request friendly | No                                       | Yes                                          |
| Implementation cost    | Low (built into SQL)                     | Schema change + conflict handling logic      |

---

## How to choose

A few quick heuristics:

1. **Is the critical section short and inside a single transaction?** → Pessimistic. `SELECT ... FOR UPDATE` is exactly what it's there for.
2. **Does the workflow span an HTTP request, a UI form, or multiple services?** → Optimistic. You can't hold a DB lock across a user's coffee break.
3. **Is contention high on a single row?** (counters, inventory, leaderboard) → Neither, on its own. Reach for queues, atomic increments (`UPDATE ... SET n = n + 1`), or sharded counters.
4. **Are you doing money?** → Whichever you choose, also use proper transaction isolation (`SERIALIZABLE` or `REPEATABLE READ`) and idempotency keys. Locks are not the whole story.

---

## A common mistake: mixing them up

A pattern I see often: developers add a `version` column "for safety" and then *also* use `SELECT ... FOR UPDATE`. That's not extra safety — it's two strategies fighting each other. You're paying the cost of pessimistic locking *and* the cost of conflict handling.

Pick one per use case. If different parts of your system need different strategies, that's fine — they can coexist. But on a single update path, choose deliberately.

---

## The takeaway

Pessimistic locking trades concurrency for simplicity. Optimistic locking trades simplicity for concurrency. Both are correct; neither is universally better.

Match the strategy to the *shape of the work*: short and contended → pessimistic; long and stateless → optimistic. Once you internalize that, the choice stops being a gut call and starts being something you can explain to your team in one sentence.
