---
title: "Caching Strategies"
order: 3
tags: ["system-design", "caching", "performance", "redis"]
date: "2024-03-15"
draft: false
---

# Caching Strategies

A cache stores frequently accessed data in fast storage to reduce latency and database load.

## Cache-Aside (Lazy Loading)

The most common pattern. The application manages the cache explicitly.

```python
def get_user(user_id: str) -> dict:
    # 1. Check cache first
    cached = redis.get(f"user:{user_id}")
    if cached:
        return json.loads(cached)

    # 2. Cache miss — fetch from DB
    user = db.query("SELECT * FROM users WHERE id = ?", user_id)

    # 3. Populate cache with TTL
    redis.setex(f"user:{user_id}", 3600, json.dumps(user))
    return user
```

## Write-Through

Write to cache and database simultaneously on every update.

**Pros:** Cache always up to date  
**Cons:** Write latency increases, stores data that may never be read

## Eviction Policies

| Policy | Description |
|--------|-------------|
| **LRU** | Evict least recently used |
| **LFU** | Evict least frequently used |
| **TTL** | Evict after a fixed time period |
| **Random** | Evict a random key (simple, sometimes effective) |

## Cache Invalidation

> "There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton

Common strategies:
- **TTL-based**: Let entries expire naturally — simple but may serve stale data
- **Event-driven**: Invalidate on write events — consistent but adds complexity
- **Versioned keys**: `user:42:v3` — old keys become unreachable naturally
