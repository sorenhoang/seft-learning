---
title: "Behavioral Patterns — Chain of Responsibility, Command, Iterator, Mediator, Memento"
order: 4
tags: ["design-patterns", "kotlin", "behavioral-patterns"]
date: "2026-05-18"
draft: false
lang: "en"
---

Behavioral patterns are about communication — how objects interact and distribute responsibility. They answer the question: *who handles this request, and how does that decision get made?*

With 11 behavioral patterns, GoF allocates the most patterns to this category because behavior is where most of the complexity in software actually lives. This chapter covers five of them.

---

## Chain of Responsibility

### What problem does it solve?

You have a request that may be handled by one of several handlers, but you don't know which handler should process it at design time. Chain of Responsibility passes the request along a chain of handlers until one processes it — or it falls off the end.

> **Analogy:** A customer support escalation. You call tier-1 support. If they can't help, they escalate to tier-2. If tier-2 can't handle it, it goes to engineering. Each tier decides: handle or pass.

### When to use it

- Multiple objects may handle the same request, and the handler isn't known in advance.
- You want to decouple senders from receivers.
- You need the ability to add or remove handlers without modifying client code (Open/Closed Principle).

### When NOT to use it

- When there's always exactly one handler — just call it directly.
- When request routing is complex (multiple handlers at the same level, parallel processing) — consider a proper router or event bus instead.
- Long chains with many handlers can make debugging hard. Keep chains short and each handler focused.

### Kotlin implementation

```kotlin
// Handler interface
abstract class SupportHandler {
    private var next: SupportHandler? = null

    fun setNext(handler: SupportHandler): SupportHandler {
        next = handler
        return handler
    }

    fun handle(ticket: SupportTicket) {
        if (canHandle(ticket)) {
            process(ticket)
        } else {
            next?.handle(ticket) ?: println("No handler for: ${ticket.description}")
        }
    }

    abstract fun canHandle(ticket: SupportTicket): Boolean
    abstract fun process(ticket: SupportTicket)
}

data class SupportTicket(val priority: Int, val description: String)

class Tier1Support : SupportHandler() {
    override fun canHandle(ticket: SupportTicket) = ticket.priority < 3
    override fun process(ticket: SupportTicket) =
        println("Tier 1 resolved: ${ticket.description}")
}

class Tier2Support : SupportHandler() {
    override fun canHandle(ticket: SupportTicket) = ticket.priority < 7
    override fun process(ticket: SupportTicket) =
        println("Tier 2 resolved: ${ticket.description}")
}

class EngineeringTeam : SupportHandler() {
    override fun canHandle(ticket: SupportTicket) = true
    override fun process(ticket: SupportTicket) =
        println("Engineering resolved: ${ticket.description}")
}

// Build the chain
val chain = Tier1Support().apply {
    setNext(Tier2Support()).setNext(EngineeringTeam())
}

chain.handle(SupportTicket(1, "Password reset"))       // Tier 1
chain.handle(SupportTicket(5, "Billing dispute"))      // Tier 2
chain.handle(SupportTicket(9, "Data corruption bug"))  // Engineering
```

**Functional variant** — in Kotlin, a chain can be modeled as a list of predicates + handlers, without abstract classes:

```kotlin
data class SupportTicket(val priority: Int, val description: String)

val chain: List<Pair<(SupportTicket) -> Boolean, (SupportTicket) -> Unit>> = listOf(
    { t -> t.priority < 3 }  to { t -> println("Tier 1: ${t.description}") },
    { t -> t.priority < 7 }  to { t -> println("Tier 2: ${t.description}") },
    { _  -> true }            to { t -> println("Engineering: ${t.description}") }
)

fun handle(ticket: SupportTicket) =
    chain.firstOrNull { (canHandle, _) -> canHandle(ticket) }
         ?.second?.invoke(ticket)
         ?: println("Unhandled: ${ticket.description}")
```

### In the wild

**OkHttp's `Interceptor` chain** is Chain of Responsibility. Each interceptor decides whether to process the request, modify it, and pass it down with `chain.proceed(request)`. The last interceptor in the chain is the actual HTTP call.

**Spring Security's filter chain** works identically — `UsernamePasswordAuthenticationFilter`, `JwtTokenFilter`, `ExceptionTranslationFilter` form a chain where each filter decides to handle or pass.

---

## Command

### What problem does it solve?

You want to turn a request into a standalone object — encapsulating the action, its parameters, and the receiver — so that requests can be queued, logged, undone, or executed at a later time.

> **Analogy:** A restaurant order slip. The waiter writes your order (Command) and passes it to the kitchen (receiver). The waiter doesn't cook; the slip can be queued, cancelled, or re-ordered if the kitchen makes a mistake.

### When to use it

- You need to queue or schedule operations.
- You need undo/redo functionality.
- You want to support transactional behavior (execute, rollback).
- You're implementing a macro recorder — a sequence of commands to replay.

### When NOT to use it

- For simple, synchronous one-shot calls, a direct method call is clearer.
- **In Kotlin: lambdas replace Command in most cases.** A `() -> Unit` is a Command. A `suspend () -> Unit` is an async Command. The full pattern is only needed when you require undo capability or rich command metadata.

### Kotlin implementation

Classic Command with undo support:

```kotlin
interface Command {
    fun execute()
    fun undo()
}

class TextEditor {
    private val content = StringBuilder()

    fun insert(text: String, position: Int) {
        content.insert(position, text)
    }
    fun delete(position: Int, length: Int) {
        content.delete(position, position + length)
    }
    fun getText() = content.toString()
}

class InsertCommand(
    private val editor: TextEditor,
    private val text: String,
    private val position: Int
) : Command {
    override fun execute() = editor.insert(text, position)
    override fun undo() = editor.delete(position, text.length)
}

// Command history for undo
class CommandHistory {
    private val history = ArrayDeque<Command>()

    fun execute(command: Command) {
        command.execute()
        history.addLast(command)
    }

    fun undo() {
        history.removeLastOrNull()?.undo()
    }
}

val editor = TextEditor()
val history = CommandHistory()

history.execute(InsertCommand(editor, "Hello", 0))
history.execute(InsertCommand(editor, " World", 5))
println(editor.getText())   // Hello World
history.undo()
println(editor.getText())   // Hello
```

**Lambda as Command** — for simple cases without undo:

```kotlin
class TaskQueue {
    private val queue = ArrayDeque<() -> Unit>()

    fun enqueue(task: () -> Unit) = queue.addLast(task)
    fun processAll() = queue.forEach { it() }
}

val queue = TaskQueue()
queue.enqueue { println("Sending email...") }
queue.enqueue { println("Generating report...") }
queue.processAll()
```

### In the wild

**Android's `WorkManager`** encapsulates work as `Worker` / `CoroutineWorker` subclasses — each is a Command. WorkManager queues them, persists them across process restarts, and executes them with retry and constraint logic.

**Spring's `@Async` and task executors** treat annotated method calls as Command objects submitted to a thread pool — the caller returns immediately; the command executes asynchronously.

**`Runnable`/`Callable`** in the Java concurrency API are textbook Commands submitted to an `ExecutorService`.

---

## Iterator

### What problem does it solve?

You have a collection and want to traverse it without exposing its internal structure. Iterator provides a standard interface (`hasNext()`, `next()`) so that clients can traverse any collection the same way.

> **Analogy:** A TV remote's channel-up button. You don't know how the cable provider organizes channel data internally — you just press next and receive the next one.

### When to use it

- You need to traverse a complex data structure (tree, graph) without exposing its internals.
- You want to support multiple simultaneous traversals of the same collection.
- You're building a custom collection that should work with Kotlin's `for` loop.

### When NOT to use it

- For standard `List`, `Set`, `Map` — the JVM already provides iterators; don't reinvent them.
- When a simple `forEach` lambda reads better.
- When the traversal is a one-liner, a custom Iterator class adds ceremony with no benefit.

### Kotlin implementation

Kotlin's `for` loop desugars to an `Iterator`. Implementing `Iterable<T>` makes any class work in `for` loops:

```kotlin
class NumberRange(private val start: Int, private val end: Int) : Iterable<Int> {
    override fun iterator(): Iterator<Int> = object : Iterator<Int> {
        private var current = start
        override fun hasNext() = current <= end
        override fun next() = current++
    }
}

val range = NumberRange(1, 5)
for (n in range) print("$n ")  // 1 2 3 4 5
```

**Idiomatic Kotlin: `sequence`** — for lazy or infinite iteration, `sequence {}` with `yield` replaces a hand-written iterator entirely:

```kotlin
fun fibonacci(): Sequence<Long> = sequence {
    var a = 0L
    var b = 1L
    while (true) {
        yield(a)
        val next = a + b
        a = b
        b = next
    }
}

fibonacci().take(10).toList()
// [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

For custom tree traversal:

```kotlin
data class TreeNode<T>(val value: T, val children: List<TreeNode<T>> = emptyList())

fun <T> TreeNode<T>.depthFirst(): Sequence<T> = sequence {
    yield(value)
    children.forEach { child -> yieldAll(child.depthFirst()) }
}

val tree = TreeNode(1, listOf(
    TreeNode(2, listOf(TreeNode(4), TreeNode(5))),
    TreeNode(3, listOf(TreeNode(6)))
))

tree.depthFirst().toList()  // [1, 2, 4, 5, 3, 6]
```

### In the wild

Every Kotlin collection implements `Iterable`. `Sequence` is a lazy Iterator that avoids intermediate collections in pipelines. `Flow` is an async Iterator — `collect { }` is conceptually `while (hasNext()) { next() }` on a coroutine stream.

Spring Data's `Streamable<T>` and `Page<T>` are iterators over paginated database results. Hibernate's `ScrollableResults` is a cursor-based iterator over large query result sets.

---

## Mediator

### What problem does it solve?

When many objects communicate with each other directly, you get a web of dependencies that's hard to maintain. Mediator introduces a central coordinator — objects talk to the mediator, not to each other.

> **Analogy:** Air traffic control. Aircraft don't communicate with each other; they all talk to the tower. The tower decides who lands first, who circles, who gets a runway. Remove the tower, and you have chaos.

### When to use it

- Multiple components need to coordinate but shouldn't know about each other directly.
- A UI form has many controls that affect each other's state (show/hide, enable/disable).
- You're building an event bus or message router.

### When NOT to use it

- The Mediator itself can become a God Object if it accumulates too much logic. Keep it thin — routing, not business logic.
- For simple two-object interaction, just call the method directly. Mediator overhead isn't free.
- Don't use it to avoid designing a proper API — Mediator hides coupling, it doesn't eliminate it.

### Kotlin implementation

A chat room where participants don't know each other — they only know the room:

```kotlin
interface Mediator {
    fun notify(sender: Participant, message: String)
}

abstract class Participant(protected val mediator: Mediator) {
    abstract val name: String
    abstract fun receive(from: String, message: String)

    fun send(message: String) = mediator.notify(this, message)
}

class ChatRoom : Mediator {
    private val participants = mutableListOf<Participant>()

    fun join(participant: Participant) = participants.add(participant)

    override fun notify(sender: Participant, message: String) {
        participants
            .filter { it !== sender }
            .forEach { it.receive(sender.name, message) }
    }
}

class ChatUser(override val name: String, room: ChatRoom) : Participant(room) {
    override fun receive(from: String, message: String) =
        println("[$name] $from: $message")
}

val room = ChatRoom()
val alice = ChatUser("Alice", room).also { room.join(it) }
val bob   = ChatUser("Bob",   room).also { room.join(it) }
val carol = ChatUser("Carol", room).also { room.join(it) }

alice.send("Hello everyone!")
// [Bob]   Alice: Hello everyone!
// [Carol] Alice: Hello everyone!
```

**Kotlin idiomatic variant** — `SharedFlow` as a mediator:

```kotlin
class EventBus {
    private val _events = MutableSharedFlow<AppEvent>(extraBufferCapacity = 64)
    val events: SharedFlow<AppEvent> = _events

    suspend fun publish(event: AppEvent) = _events.emit(event)
}

// Components subscribe without knowing each other
class OrderService(private val bus: EventBus) {
    suspend fun placeOrder(order: Order) {
        // ... save order ...
        bus.publish(OrderPlacedEvent(order.id))
    }
}

class InventoryService(private val bus: EventBus) {
    suspend fun listenForOrders() {
        bus.events.filterIsInstance<OrderPlacedEvent>().collect { event ->
            println("Reserving inventory for order ${event.orderId}")
        }
    }
}
```

### In the wild

**Spring's `ApplicationEventPublisher`** is a Mediator. When you `publishEvent(OrderPlacedEvent(...))`, Spring delivers it to all `@EventListener`-annotated methods. Publishers don't know listeners exist; listeners don't know who published.

**Android's `ViewModel`** as a shared ViewModel between Fragments is Mediator in action. Instead of Fragment A calling Fragment B directly, both observe `LiveData`/`StateFlow` on the shared ViewModel. The ViewModel mediates; Fragments are decoupled.

---

## Memento

### What problem does it solve?

You need to capture an object's internal state so you can restore it later — without breaking encapsulation by exposing private fields to the outside world.

> **Analogy:** A game save file. You can restore the game to exactly the state it was in when you saved — character position, inventory, story progress — without the save system needing to understand the game engine's internals.

### When to use it

- You need undo/redo functionality.
- You need to restore an object to a previous state after a failed operation.
- You want to take snapshots of an object's state for versioning or auditing.

### When NOT to use it

- When snapshots are large and frequent — memory consumption grows fast. Consider a delta/diff approach instead.
- When the object holds external resources (file handles, DB connections) that can't be meaningfully captured in a snapshot.
- In Kotlin, if `data class copy()` covers your use case, don't write a Memento class — you already have one.

### Kotlin implementation

Classic Memento with Originator and Caretaker:

```kotlin
// Memento — snapshot of Originator's state
data class EditorMemento(
    val content: String,
    val cursorPosition: Int
)

// Originator — the object whose state is saved/restored
class TextEditor {
    var content: String = ""
    var cursorPosition: Int = 0

    fun save(): EditorMemento = EditorMemento(content, cursorPosition)

    fun restore(memento: EditorMemento) {
        content = memento.content
        cursorPosition = memento.cursorPosition
    }

    fun type(text: String) {
        content = content.substring(0, cursorPosition) + text + content.substring(cursorPosition)
        cursorPosition += text.length
    }
}

// Caretaker — manages history, doesn't inspect mementos
class EditorHistory {
    private val history = ArrayDeque<EditorMemento>()

    fun push(memento: EditorMemento) = history.addLast(memento)

    fun pop(): EditorMemento? = history.removeLastOrNull()
}

val editor = TextEditor()
val history = EditorHistory()

editor.type("Hello")
history.push(editor.save())   // snapshot

editor.type(", World")
history.push(editor.save())   // snapshot

editor.type("!!!")
println(editor.content)       // Hello, World!!!

history.pop()?.let { editor.restore(it) }
println(editor.content)       // Hello, World

history.pop()?.let { editor.restore(it) }
println(editor.content)       // Hello
```

**Kotlin shortcut** — for immutable state, `data class` makes every instance a Memento automatically:

```kotlin
data class AppState(
    val count: Int = 0,
    val filter: String = "all",
    val isLoading: Boolean = false
)

class Store {
    private val history = ArrayDeque<AppState>()
    var state: AppState = AppState()
        private set

    fun dispatch(reducer: (AppState) -> AppState) {
        history.addLast(state)   // snapshot before change
        state = reducer(state)
    }

    fun undo() {
        history.removeLastOrNull()?.let { state = it }
    }
}
```

This is essentially Redux's architecture in 15 lines of Kotlin — and it's Memento at its core.

### In the wild

**Android's `onSaveInstanceState(Bundle)`** is the system-managed Memento. When the OS kills your Activity to reclaim memory, it calls `onSaveInstanceState` to capture the state into a Bundle (the Memento). When the user returns, `onRestoreInstanceState(Bundle)` restores from that snapshot.

**JDBC savepoints** — `connection.setSavepoint()` captures database state; `connection.rollback(savepoint)` restores it. The savepoint is a Memento; the connection is the Originator.

---

## Wrapping up

| Pattern | Core intent | Kotlin shortcut |
|---|---|---|
| Chain of Responsibility | Pass a request along a handler chain | List of predicates + lambdas |
| Command | Encapsulate a request as an object | Lambda / suspend lambda |
| Iterator | Traverse a collection without exposing its structure | `Iterable`, `Sequence`, `Flow` |
| Mediator | Central coordinator for decoupled communication | `SharedFlow` as event bus |
| Memento | Capture and restore object state | `data class copy()` + history list |

Next: [Behavioral Patterns Part 2 →](/technical/design-patterns/05-behavioral-part2) — Observer, State, Strategy, Template Method, Visitor, Interpreter.
