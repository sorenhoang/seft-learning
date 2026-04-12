---
title: "Scalability Patterns"
order: 2
tags: ["system-design", "scalability", "performance"]
date: "2024-03-08"
draft: false
---

# Scalability Patterns

Scalability is the ability of a system to handle increased load by adding resources.

## Vertical vs. Horizontal Scaling

### Vertical Scaling (Scale Up)
Add more power to an existing machine — more CPU, RAM, or faster storage.

**Pros:** Simple, no application changes needed  
**Cons:** Has a hard ceiling, single point of failure, expensive at the top end

### Horizontal Scaling (Scale Out)
Add more machines and distribute the load across them.

**Pros:** Theoretically unlimited, better fault tolerance  
**Cons:** Requires stateless design, adds network complexity

```python
# Stateless service — safe to run on any node
def process_request(request_data: dict) -> dict:
    # All state lives in the database, not in memory
    user = db.get_user(request_data["user_id"])
    return {"status": "ok", "name": user.name}
```

## Load Balancing Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| Round Robin | Rotate through servers in sequence | Uniform workloads |
| Least Connections | Route to server with fewest active connections | Variable request duration |
| IP Hash | Route based on client IP | Session affinity |
| Weighted | Assign traffic proportion by server capacity | Heterogeneous nodes |

## Database Scaling

### Read Replicas
Route read queries to replicas, writes to the primary.

```
Primary (writes) ──► Replica 1 (reads)
                 └──► Replica 2 (reads)
```

### Sharding
Partition data across multiple databases by a shard key.

$$
\text{shard} = \text{hash(user\_id)} \mod N
$$

**Choose a shard key that:**
- Distributes data evenly (avoid hot shards)
- Avoids cross-shard joins for common queries
- Remains stable over time (avoid re-sharding)
