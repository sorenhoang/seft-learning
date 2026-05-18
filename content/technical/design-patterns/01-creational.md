---
title: "Creational Patterns — Singleton, Factory Method, Abstract Factory, Builder, Prototype"
order: 1
tags: ["design-patterns", "kotlin", "creational-patterns"]
date: "2026-05-18"
draft: false
lang: "en"
---

Creational patterns are about one thing: **controlling how objects are created**. That sounds mundane until you realize that every dependency injection framework, every connection pool, every configuration builder in existence is a creational pattern with a name.

This chapter covers all five GoF creational patterns — what problem each solves, when to reach for it, when not to, and how Kotlin's language features change the picture.

---

## Singleton

### What problem does it solve?

Some objects should exist exactly once in your application — a database connection pool, a configuration registry, a logger. Without a Singleton, every part of the codebase creates its own instance, wasting resources or causing inconsistency.

> **Analogy:** A country has one president. Every government department doesn't elect their own.

### When to use it

- The object manages shared resources (connection pools, thread pools, caches).
- Multiple instances would cause bugs or inconsistency (config values, registries).
- The object is stateless and expensive to initialize.

### When NOT to use it

- You need to unit test code that depends on it — Singletons with mutable state make tests order-dependent and hard to isolate.
- You're tempted to use it for convenience ("I just need this one thing everywhere"). That's global state, and it will hurt you.
- Spring already manages your bean lifecycle — prefer `@Singleton` beans over hand-rolled Singletons.

### Kotlin implementation

Kotlin's `object` declaration is a thread-safe Singleton by the language specification:

```kotlin
object AppConfig {
    val apiBaseUrl: String = System.getenv("API_BASE_URL") ?: "https://api.example.com"
    val requestTimeoutMs: Long = 5_000L
}

// Usage — no instantiation, just access
val url = AppConfig.apiBaseUrl
```

For lazy initialization (the object is expensive to create), use `lazy`:

```kotlin
object Database {
    val connection: Connection by lazy {
        DriverManager.getConnection("jdbc:postgresql://localhost/mydb")
    }
}
```

### In the wild

Spring beans are Singletons by default. When you write:

```kotlin
@Service
class UserService(private val userRepository: UserRepository) { ... }
```

Spring creates exactly one `UserService` instance and injects it everywhere. The container manages the lifecycle so you don't have to write `object UserService`.

**The Kotlin trap:** Kotlin makes `object` so easy that engineers reach for it when they should be injecting a dependency. If you can't swap the implementation in a test, you've made the code untestable.

---

## Factory Method

### What problem does it solve?

You want to let subclasses or callers decide which class to instantiate, without coupling the caller to a concrete type. The creator defines the interface; subclasses fill in the `new`.

> **Analogy:** A bakery has a recipe (the abstract method). Each branch bakes its own interpretation — one makes sourdough, another makes brioche — but the ordering system only knows "bread".

### When to use it

- You don't know at design time what type of object to create.
- Subclasses should control what gets instantiated.
- You want to let callers extend creation behavior without modifying existing code (Open/Closed Principle).

### When NOT to use it

- When there's only one implementation and it will never change — the abstraction is overhead.
- When a constructor with a clear name is enough. Kotlin's named constructors (companion object factory functions) are simpler for straightforward cases.

### Kotlin implementation

```kotlin
interface Notification {
    fun send(message: String)
}

class EmailNotification(private val email: String) : Notification {
    override fun send(message: String) = println("Email to $email: $message")
}

class SmsNotification(private val phone: String) : Notification {
    override fun send(message: String) = println("SMS to $phone: $message")
}

// Factory Method — subclasses decide what to create
abstract class NotificationService {
    abstract fun createNotification(recipient: String): Notification  // Factory Method

    fun notify(recipient: String, message: String) {
        val notification = createNotification(recipient)
        notification.send(message)
    }
}

class EmailNotificationService : NotificationService() {
    override fun createNotification(recipient: String): Notification =
        EmailNotification(recipient)
}

class SmsNotificationService : NotificationService() {
    override fun createNotification(recipient: String): Notification =
        SmsNotification(recipient)
}
```

**Idiomatic Kotlin alternative** — for simple cases, a companion object factory function does the same job with less code:

```kotlin
interface Notification {
    fun send(message: String)

    companion object {
        fun forChannel(channel: String, recipient: String): Notification = when (channel) {
            "email" -> EmailNotification(recipient)
            "sms"   -> SmsNotification(recipient)
            else    -> throw IllegalArgumentException("Unknown channel: $channel")
        }
    }
}
```

### In the wild

Spring's `BeanFactory` is a textbook Factory Method. `ApplicationContext.getBean("userService")` delegates to concrete factory implementations (XML, annotation, Java config) that each instantiate beans differently. The caller never knows which factory created the bean.

---

## Abstract Factory

### What problem does it solve?

When you need to create *families of related objects* that must be used together, and you want to ensure you never accidentally mix objects from different families.

> **Analogy:** IKEA furniture — a table and chairs from the POÄNG family match each other. If you mix POÄNG with BILLY, the proportions clash. The Abstract Factory ensures you always get a matched set.

### When to use it

- You have multiple product families (Material Design UI vs. Cupertino UI, MySQL persistence vs. PostgreSQL persistence).
- Objects in the same family must be compatible with each other.
- You want to switch entire families at runtime without touching client code.

### When NOT to use it

- When you only have one family — you've added two layers of abstraction for nothing.
- When families rarely change. Abstract Factory is powerful but verbose; start with Factory Method and promote only if you need families.

### Kotlin implementation

```kotlin
// Product interfaces
interface Button { fun render() }
interface TextField { fun render() }
interface Dialog { fun render() }

// Family A — Material Design
class MaterialButton : Button { override fun render() = println("Material Button") }
class MaterialTextField : TextField { override fun render() = println("Material TextField") }
class MaterialDialog : Dialog { override fun render() = println("Material Dialog") }

// Family B — Cupertino (iOS-style)
class CupertinoButton : Button { override fun render() = println("Cupertino Button") }
class CupertinoTextField : TextField { override fun render() = println("Cupertino TextField") }
class CupertinoDialog : Dialog { override fun render() = println("Cupertino Dialog") }

// Abstract Factory
interface UIFactory {
    fun createButton(): Button
    fun createTextField(): TextField
    fun createDialog(): Dialog
}

class MaterialUIFactory : UIFactory {
    override fun createButton() = MaterialButton()
    override fun createTextField() = MaterialTextField()
    override fun createDialog() = MaterialDialog()
}

class CupertinoUIFactory : UIFactory {
    override fun createButton() = CupertinoButton()
    override fun createTextField() = CupertinoTextField()
    override fun createDialog() = CupertinoDialog()
}

// Client code — never references concrete classes
class Screen(private val factory: UIFactory) {
    fun render() {
        factory.createButton().render()
        factory.createTextField().render()
        factory.createDialog().render()
    }
}

// At startup, pick the factory once
val factory: UIFactory = if (isPlatformAndroid) MaterialUIFactory() else CupertinoUIFactory()
val screen = Screen(factory)
```

### In the wild

Android's `ViewModelProvider.Factory` is an Abstract Factory for ViewModels. `HiltViewModelFactory` and `SavedStateViewModelFactory` are concrete implementations that ensure the ViewModel gets the right `SavedStateHandle` or injected dependencies — you never mix them.

---

## Builder

### What problem does it solve?

Some objects have many optional parameters, and telescoping constructors (`constructor(a)`, `constructor(a, b)`, `constructor(a, b, c)`…) become unreadable. Builder separates construction from representation, letting you set only what you need.

> **Analogy:** A custom pizza order. You tell the counter: thin crust, tomato sauce, mozzarella, mushrooms, no olives. The builder (the counter) assembles your exact pizza; you don't need to specify every ingredient.

### When to use it

- Object construction requires many optional parameters.
- The same construction process should be able to produce different representations.
- You need validation before the object is finalized (the `build()` step can throw).

### When NOT to use it

- **In Kotlin: almost never for your own code.** Named parameters and default values replace Builder for the vast majority of cases — with the added benefit of null-safety enforced by the compiler.
- Still useful when wrapping Java libraries (Retrofit, OkHttp) that predate Kotlin.

### Kotlin implementation

Classic Java-style Builder (still needed when interoperating with Java):

```kotlin
class HttpClient private constructor(
    val baseUrl: String,
    val timeoutMs: Long,
    val headers: Map<String, String>,
    val retryCount: Int
) {
    class Builder(private val baseUrl: String) {
        private var timeoutMs: Long = 5_000
        private val headers: MutableMap<String, String> = mutableMapOf()
        private var retryCount: Int = 0

        fun timeout(ms: Long) = apply { timeoutMs = ms }
        fun header(key: String, value: String) = apply { headers[key] = value }
        fun retries(count: Int) = apply { retryCount = count }

        fun build(): HttpClient {
            require(baseUrl.startsWith("https://")) { "Base URL must use HTTPS" }
            return HttpClient(baseUrl, timeoutMs, headers.toMap(), retryCount)
        }
    }
}

val client = HttpClient.Builder("https://api.example.com")
    .timeout(10_000)
    .header("Authorization", "Bearer $token")
    .retries(3)
    .build()
```

The idiomatic Kotlin replacement — named parameters + defaults + `require` for validation:

```kotlin
data class HttpClientConfig(
    val baseUrl: String,
    val timeoutMs: Long = 5_000,
    val headers: Map<String, String> = emptyMap(),
    val retryCount: Int = 0
) {
    init {
        require(baseUrl.startsWith("https://")) { "Base URL must use HTTPS" }
    }
}

val config = HttpClientConfig(
    baseUrl = "https://api.example.com",
    timeoutMs = 10_000,
    headers = mapOf("Authorization" to "Bearer $token"),
    retryCount = 3
)
```

Less code, same validation, full null safety, readable at the call site.

### In the wild

Retrofit's configuration is a classic Builder — because it predates Kotlin and must work from Java:

```kotlin
val retrofit = Retrofit.Builder()
    .baseUrl("https://api.example.com/")
    .addConverterFactory(GsonConverterFactory.create())
    .client(okHttpClient)
    .build()
```

`OkHttpClient` and `AlertDialog.Builder` on Android follow the same pattern for the same historical reason.

---

## Prototype

### What problem does it solve?

Creating a new object is expensive or complex (deep object graph, external resource setup), but you already have a configured instance. Clone it instead of rebuilding from scratch.

> **Analogy:** A company stamp. You stamp once, get a clean impression, and use that copy — you don't re-carve the stamp for every document.

### When to use it

- Object creation is expensive (database queries, remote API calls to set up state).
- You need many similar objects that vary only slightly from a base configuration.
- The exact type of object to clone is unknown at design time (runtime polymorphism + clone).

### When NOT to use it

- When object creation is cheap — cloning adds complexity for no gain.
- When a `data class copy()` already covers the use case (it usually does in Kotlin).
- Watch out for **shallow vs. deep copy**: the default `copy()` on a data class is shallow. If your object holds mutable references, clones will share them.

### Kotlin implementation

Kotlin's `data class` implements Prototype natively via `copy()`:

```kotlin
data class UserProfile(
    val id: UUID = UUID.randomUUID(),
    val name: String,
    val role: String,
    val permissions: Set<String> = emptySet()
)

val adminTemplate = UserProfile(
    name = "Template Admin",
    role = "admin",
    permissions = setOf("read", "write", "delete")
)

// Clone and customize — adminTemplate is untouched
val alice = adminTemplate.copy(id = UUID.randomUUID(), name = "Alice")
val bob   = adminTemplate.copy(id = UUID.randomUUID(), name = "Bob", role = "moderator")
```

For non-data classes or deep copy requirements, implement `clone()` explicitly:

```kotlin
interface Prototype<T> {
    fun clone(): T
}

class NetworkConfig(
    val hosts: MutableList<String>,
    val port: Int,
    val useTls: Boolean
) : Prototype<NetworkConfig> {
    override fun clone(): NetworkConfig = NetworkConfig(
        hosts = hosts.toMutableList(),  // deep copy of mutable list
        port = port,
        useTls = useTls
    )
}
```

### In the wild

Spring uses a `prototype` bean scope (note: lowercase, not the pattern name) where each `getBean()` call returns a fresh clone of the bean definition. This is the opposite of Singleton scope — a direct application of Prototype thinking for beans that must not share state.

---

## Wrapping up

Creational patterns answer the question "who decides what gets built?" — and the answer shapes testability, flexibility, and coupling throughout the codebase.

| Pattern | Core intent | Kotlin shortcut? |
|---|---|---|
| Singleton | One instance shared globally | `object` declaration |
| Factory Method | Subclass decides the concrete type | Companion object factory functions |
| Abstract Factory | Families of related objects stay consistent | — |
| Builder | Step-by-step construction with validation | Named params + default values (usually) |
| Prototype | Clone from an existing instance | `data class copy()` |

Next: [Structural Patterns Part 1 →](/technical/design-patterns/02-structural-part1) — how classes and objects are composed to form larger structures.
