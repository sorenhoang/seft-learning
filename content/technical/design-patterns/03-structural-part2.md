---
title: "Structural Patterns — Facade, Flyweight, Proxy"
order: 3
tags: ["design-patterns", "kotlin", "structural-patterns"]
date: "2026-05-18"
draft: false
lang: "en"
---

The three patterns in this chapter are among the most practically important in any JVM codebase — yet two of them (Proxy and Flyweight) operate mostly invisibly. You've been using them for years without realizing it.

---

## Facade

### What problem does it solve?

A complex subsystem has many moving parts — libraries, services, configurations — and the caller doesn't need to know about all of them. Facade provides a simple, unified interface over the complexity, hiding the internals.

> **Analogy:** A hotel concierge. You say "I need a restaurant, a taxi, and theatre tickets." The concierge coordinates all of it. You don't phone the restaurant, the taxi company, and the box office yourself.

### When to use it

- A subsystem is complex and you want to offer a simplified entry point for common use cases.
- You're integrating several libraries and want to hide the integration glue from callers.
- You want to reduce coupling between client code and a complex subsystem.

### When NOT to use it

- Don't make the Facade a God Object — if it grows to hundreds of methods, split it.
- Don't use Facade to prevent engineers from accessing the subsystem when they need to. It's a convenience, not a wall.
- If the caller genuinely needs fine-grained control, a Facade that hides everything is more annoying than helpful.

### Kotlin implementation

Imagine sending a notification requires: creating a payload, choosing a channel, authenticating with the provider, and logging the result. Callers shouldn't need to know about any of that:

```kotlin
// Complex subsystem classes
class PayloadBuilder {
    fun build(message: String, recipient: String): String =
        """{"to":"$recipient","body":"$message"}"""
}

class ChannelSelector {
    fun select(recipient: String): String =
        if (recipient.contains("@")) "email" else "sms"
}

class NotificationProvider {
    fun send(channel: String, payload: String): Boolean {
        println("Sending via $channel: $payload")
        return true
    }
}

class AuditLogger {
    fun log(channel: String, success: Boolean) =
        println("Notification via $channel: ${if (success) "OK" else "FAILED"}")
}

// Facade — one simple method over the whole subsystem
class NotificationFacade {
    private val builder   = PayloadBuilder()
    private val selector  = ChannelSelector()
    private val provider  = NotificationProvider()
    private val logger    = AuditLogger()

    fun notify(recipient: String, message: String) {
        val channel = selector.select(recipient)
        val payload = builder.build(message, recipient)
        val success = provider.send(channel, payload)
        logger.log(channel, success)
    }
}

// Caller — one line, no subsystem knowledge
val notifications = NotificationFacade()
notifications.notify("alice@example.com", "Your order has shipped.")
```

### In the wild

**Retrofit** is a Facade over OkHttp, HTTP serialization (Gson/Moshi), coroutine adapters, and connection management. You define a `@GET("/users")` interface and call it — one line. Everything beneath is hidden.

**Room** is a Facade over SQLite. Without it, you'd manage cursors, `ContentValues`, thread synchronization, and schema versioning manually. Room turns that into `@Query("SELECT * FROM users")`.

Both are excellent examples of Facade done right: they hide complexity, but give you escape hatches (raw `OkHttpClient`, `SupportSQLiteDatabase`) when you need lower-level control.

---

## Flyweight

### What problem does it solve?

You need a huge number of similar objects — thousands or millions — but most of their state is shared. Flyweight separates the **intrinsic state** (shared, immutable, stored once) from the **extrinsic state** (unique per instance, supplied by the caller) to drastically reduce memory usage.

> **Analogy:** A chess set. The "white pawn" piece design is shared — you don't carve a different piece for each of the 8 pawns. The position of each pawn on the board (extrinsic state) is separate data, not part of the piece itself.

### When to use it

- You have a large number of objects consuming too much memory.
- Most of the object's state can be made extrinsic (passed in from outside).
- The objects are immutable or can be treated as immutable after creation.

### When NOT to use it

- When objects are few in number — the cache overhead isn't worth it.
- When extrinsic state management makes client code significantly more complex.
- Don't apply it before measuring memory usage. Premature optimization is real.

### Kotlin implementation

A simple example: a game rendering engine with thousands of tree sprites, all sharing the same texture.

```kotlin
// Flyweight — intrinsic (shared, immutable) state only
data class TreeType(
    val name: String,
    val color: String,
    val texture: String  // imagine this is a heavy bitmap
) {
    fun draw(x: Int, y: Int) =
        println("Drawing $name tree at ($x,$y) with color=$color")
}

// Flyweight Factory — ensures shared instances
object TreeTypeFactory {
    private val cache = mutableMapOf<String, TreeType>()

    fun getOrCreate(name: String, color: String, texture: String): TreeType =
        cache.getOrPut("$name-$color") {
            println("Creating new TreeType: $name")
            TreeType(name, color, texture)
        }
}

// Client stores extrinsic state (position) separately
data class Tree(val x: Int, val y: Int, val type: TreeType)

class Forest {
    private val trees = mutableListOf<Tree>()

    fun plant(x: Int, y: Int, name: String, color: String, texture: String) {
        val type = TreeTypeFactory.getOrCreate(name, color, texture)
        trees.add(Tree(x, y, type))
    }

    fun draw() = trees.forEach { it.type.draw(it.x, it.y) }
}

// 1000 trees, but only 2 TreeType objects in memory
val forest = Forest()
repeat(500) { i -> forest.plant(i, i * 2, "Oak", "green", "oak.png") }
repeat(500) { i -> forest.plant(i, i * 3, "Pine", "dark-green", "pine.png") }
forest.draw()
```

### In the wild

**JVM integer cache**: `Integer.valueOf(127) === Integer.valueOf(127)` is `true`. The JVM pools `Integer` objects from -128 to 127. This is Flyweight — the same object is shared across all callers. Beyond that range, new objects are created.

**Java String pool**: String literals in class files are interned — `"hello" === "hello"` is `true`. The JVM stores one copy of each unique literal string and reuses it.

**Android RecyclerView**: The ViewHolder recycling pool is a Flyweight factory. View objects (intrinsic: layout, style) are reused; item data (extrinsic: text, image URL) is re-bound per position. Without this, scrolling a list of 10,000 items would create 10,000 view objects.

In Kotlin, `object` declarations are naturally Flyweights for stateless objects — a single instance is created once and shared globally.

---

## Proxy

### What problem does it solve?

You want to control access to an object — to add lazy initialization, access control, logging, caching, or remote communication — without the client knowing a proxy is involved. The Proxy has the same interface as the real object and intercepts calls transparently.

> **Analogy:** A celebrity's personal assistant. The assistant handles all calls to the celebrity — filters unimportant ones, schedules the important ones, sometimes answers on the celebrity's behalf. The caller interacts with the assistant exactly as they would with the celebrity.

There are four common Proxy variants:

| Variant | What it controls |
|---|---|
| **Virtual Proxy** | Delays expensive object creation until first use (lazy init) |
| **Protection Proxy** | Controls access based on permissions |
| **Remote Proxy** | Represents an object in a different address space (gRPC stub, RMI) |
| **Caching Proxy** | Caches results of expensive operations |

### When to use it

- You need lazy initialization of an expensive object.
- You need to add access control without modifying the service class.
- You need logging, caching, or retry logic around an object without cluttering it.
- The real object lives remotely (microservice, database) and needs a local stand-in.

### When NOT to use it

- Don't confuse Proxy with Decorator. **Decorator adds behavior the client is aware of; Proxy controls access transparently.** A logging decorator is chosen by the client; a Spring AOP proxy is applied automatically.
- Don't use Proxy as a general "wrapper for everything" — it should have a focused access-control or lifecycle concern.

### Kotlin implementation

**Virtual Proxy** — lazy initialization:

```kotlin
interface Image {
    fun render()
}

class HighResolutionImage(private val url: String) : Image {
    init {
        println("Loading $url from disk (expensive)...")
        Thread.sleep(100)  // simulate load
    }
    override fun render() = println("Rendering $url")
}

class ImageProxy(private val url: String) : Image {
    private val realImage: Image by lazy { HighResolutionImage(url) }

    override fun render() {
        println("Proxy: checking cache for $url")
        realImage.render()
    }
}

// Real image only loads when render() is first called
val image: Image = ImageProxy("hero-banner.png")
println("Proxy created, no loading yet")
image.render()   // loads now
image.render()   // uses cached instance
```

**Protection Proxy** — access control:

```kotlin
interface AdminPanel {
    fun deleteUser(id: String)
    fun viewLogs(): List<String>
}

class RealAdminPanel : AdminPanel {
    override fun deleteUser(id: String) = println("Deleted user $id")
    override fun viewLogs() = listOf("login: alice", "login: bob")
}

class SecureAdminProxy(
    private val real: AdminPanel,
    private val currentUserRole: String
) : AdminPanel {
    override fun deleteUser(id: String) {
        check(currentUserRole == "SUPER_ADMIN") {
            "Only SUPER_ADMIN can delete users"
        }
        real.deleteUser(id)
    }

    override fun viewLogs(): List<String> {
        check(currentUserRole in listOf("ADMIN", "SUPER_ADMIN")) {
            "Insufficient permissions to view logs"
        }
        return real.viewLogs()
    }
}
```

### In the wild

**Spring AOP** is the most impactful Proxy in the JVM ecosystem. When you write:

```kotlin
@Service
class OrderService {
    @Transactional
    fun placeOrder(order: Order): OrderResult { ... }
}
```

Spring doesn't call `placeOrder` directly. It generates a CGLIB proxy class at startup that wraps `OrderService`. Every call to `placeOrder` goes through the proxy, which begins a transaction before delegating and commits (or rolls back) after. The caller never knows a proxy exists — that's the entire point.

The same mechanism powers `@Cacheable`, `@Async`, `@Secured`, and every other Spring AOP annotation. **You've been calling Proxy methods every time you use Spring.**

Kotlin coroutines use a similar pattern: `Continuation` interceptors wrap coroutine resumptions to switch threads, add timeouts, or inject context. `Dispatchers.IO` is essentially a Proxy over your coroutine's execution.

---

## The Proxy vs. Decorator Distinction

This is the most common confusion in structural patterns:

| | Proxy | Decorator |
|---|---|---|
| **Purpose** | Control *access* to the real object | Add *behavior* to the real object |
| **Who applies it** | Usually the framework, transparently | Usually the client, explicitly |
| **Client awareness** | Client doesn't know a proxy exists | Client composes decorators intentionally |
| **Spring example** | `@Transactional` proxy | `BeanPostProcessor` wrapping |
| **OkHttp example** | — | `Interceptor` chain |

The test: *Does the client choose to add this wrapper?* If yes → Decorator. If the framework applies it without the client's knowledge → Proxy.

---

## Wrapping up

| Pattern | One-line summary | You've seen it in... |
|---|---|---|
| Facade | Simple interface over a complex subsystem | Retrofit, Room |
| Flyweight | Share immutable state across many objects | JVM Integer/String cache, RecyclerView ViewHolder |
| Proxy | Transparent access control over an object | Spring `@Transactional`, every AOP annotation |

Next: [Behavioral Patterns Part 1 →](/technical/design-patterns/04-behavioral-part1) — Chain of Responsibility, Command, Iterator, Mediator, Memento.
