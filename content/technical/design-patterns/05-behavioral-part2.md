---
title: "Behavioral Patterns — Observer, State, Strategy, Template Method, Visitor, Interpreter"
order: 5
tags: ["design-patterns", "kotlin", "behavioral-patterns"]
date: "2026-05-18"
draft: false
lang: "en"
---

This is the final chapter of the series. The six patterns here include some of the most frequently used in everyday Kotlin development — and some of the most misunderstood. Observer alone has been reimplemented so many times in the Kotlin ecosystem that tracing its evolution tells you something important about how modern reactive programming was born.

---

## Observer

### What problem does it solve?

An object (the subject) changes state. Many other objects (observers) need to be notified and react. Observer decouples subjects from observers — the subject doesn't know who's listening, and observers can be added or removed at runtime.

> **Analogy:** A newspaper subscription. The newspaper (subject) doesn't know who its readers are. Subscribers (observers) receive each edition. You subscribe, you get the paper. You cancel, you stop getting it.

### When to use it

- An object's state change should trigger reactions in other objects, and you don't know those objects at design time.
- You need to notify multiple objects without coupling them to the subject.
- Decoupled event-driven systems.

### When NOT to use it

- When notifications arrive faster than observers can process — you need backpressure handling (use `Flow` or `Channel` instead of raw callbacks).
- Be careful about memory leaks: observers that are never unregistered hold references indefinitely. Always unsubscribe when the observer's lifecycle ends.
- Chains of observers triggering other observers create unpredictable update cascades.

### Kotlin implementation

Classic Observer:

```kotlin
interface Observer<T> {
    fun update(value: T)
}

class Subject<T> {
    private val observers = mutableListOf<Observer<T>>()
    private var state: T? = null

    fun subscribe(observer: Observer<T>) = observers.add(observer)
    fun unsubscribe(observer: Observer<T>) = observers.remove(observer)

    fun setState(value: T) {
        state = value
        observers.forEach { it.update(value) }
    }
}

// Usage
val stockPrice = Subject<Double>()
stockPrice.subscribe(object : Observer<Double> {
    override fun update(value: Double) = println("Dashboard: price is $value")
})
stockPrice.subscribe(object : Observer<Double> {
    override fun update(value: Double) {
        if (value < 100.0) println("Alert: price dropped below 100!")
    }
})

stockPrice.setState(150.0)
stockPrice.setState(90.0)
```

**Idiomatic Kotlin — `StateFlow` and `SharedFlow`**: This is how modern Android and coroutines code implements Observer:

```kotlin
class StockViewModel : ViewModel() {
    private val _price = MutableStateFlow(0.0)
    val price: StateFlow<Double> = _price.asStateFlow()

    fun updatePrice(newPrice: Double) {
        _price.value = newPrice
    }
}

// In UI (collector = observer)
viewLifecycleOwner.lifecycleScope.launch {
    viewModel.price.collect { price ->
        binding.priceLabel.text = "$$price"
    }
}
```

`StateFlow` handles the lifecycle automatically when scoped to `lifecycleScope` — no manual subscribe/unsubscribe.

### The Observer evolution in Android

| Era | Implementation | Problem it solved |
|---|---|---|
| Pre-2015 | Manual `interface Observer` + `ArrayList` | Raw GoF pattern |
| 2015–2018 | RxJava `Observable` | Operators, threading, backpressure |
| 2018–2021 | Android `LiveData` | Lifecycle awareness, no leak |
| 2021–present | Kotlin `Flow` / `StateFlow` | Coroutine-native, structured concurrency |

All four are Observer. The pattern didn't change — the delivery mechanism evolved.

### In the wild

**Spring's `ApplicationEventPublisher`**: `publishEvent(OrderShippedEvent(orderId))` notifies every `@EventListener` — a synchronous Observer where Spring is the Subject.

**Kotlin's `Flow`**: Every `collect { }` call is an observer registration. Every `emit()` call is a state change notification.

---

## State

### What problem does it solve?

An object changes behavior based on its internal state, and you have cascading `if/when` blocks that check the state flag. State pattern replaces the conditional with a class (or sealed subtype) per state, where each state knows its own behavior.

> **Analogy:** A smartphone lock screen. Same power button — completely different behavior depending on state: locked → show PIN prompt, unlocked → sleep, low battery → show charging screen.

### When to use it

- An object's behavior changes dramatically based on its current state.
- You have `when (state) { ... }` blocks duplicated across multiple methods.
- State transitions need to be explicit and validated (not just any `state = X`).

### When NOT to use it

- When there are 2–3 states that are unlikely to grow. A boolean or simple enum + `when` is cleaner.
- Don't create a State hierarchy for UI loading states — a sealed class with `when` in the composable is already the pattern, without the ceremony.
- When state transitions are trivial and behavior barely differs between states.

### Kotlin implementation

**Idiomatic Kotlin: sealed class** is the natural State pattern. No abstract State class with a back-reference to the context required:

```kotlin
sealed class TrafficLight {
    abstract val displayColor: String
    abstract fun next(): TrafficLight

    object Red : TrafficLight() {
        override val displayColor = "RED"
        override fun next() = Green
    }

    object Green : TrafficLight() {
        override val displayColor = "GREEN"
        override fun next() = Yellow
    }

    object Yellow : TrafficLight() {
        override val displayColor = "YELLOW"
        override fun next() = Red
    }
}

var light: TrafficLight = TrafficLight.Red

repeat(6) {
    println("Current: ${light.displayColor}")
    light = light.next()
}
```

For states that carry data:

```kotlin
sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    data class Authenticated(val user: User, val token: String) : AuthState()
    data class Error(val message: String) : AuthState()
}

class AuthViewModel : ViewModel() {
    private val _state = MutableStateFlow<AuthState>(AuthState.Idle)
    val state: StateFlow<AuthState> = _state.asStateFlow()

    fun login(email: String, password: String) {
        _state.value = AuthState.Loading
        viewModelScope.launch {
            runCatching { authService.login(email, password) }
                .onSuccess { _state.value = AuthState.Authenticated(it.user, it.token) }
                .onFailure { _state.value = AuthState.Error(it.message ?: "Unknown error") }
        }
    }
}
```

The `when` expression on a sealed class is exhaustive — the compiler forces you to handle every state.

### In the wild

**Android lifecycle** is a State machine: `Created → Started → Resumed → Paused → Stopped → Destroyed`. Each lifecycle owner cycles through these states; the framework calls the appropriate lifecycle method when transitioning.

**Spring `BeanDefinition` lifecycle**: beans move from defined → instantiated → injected → initialized → ready → destroyed. Each phase has associated post-processors.

**Workflow engines** (Camunda, Activiti) model business processes as explicit State machines — `Draft → Submitted → Under Review → Approved/Rejected`.

---

## Strategy

### What problem does it solve?

You have multiple algorithms for the same task — sorting, compression, pricing, validation — and you want to swap them at runtime without changing the calling code.

> **Analogy:** GPS navigation. You pick a strategy: fastest route, shortest route, or avoid tolls. The navigation app doesn't change — the routing algorithm does.

### When to use it

- You have several variants of an algorithm that should be interchangeable.
- You want to eliminate conditional logic that selects an algorithm.
- Behavior needs to change at runtime based on user choice or configuration.

### When NOT to use it

- **In Kotlin: most Strategy use cases collapse to a lambda.** A function type `(Input) -> Output` IS a Strategy interface with one method. Only reach for an explicit class when you need state inside the strategy or multiple methods.
- Don't introduce Strategy for two algorithms that will never grow to three.

### Kotlin implementation

Classic interface-based Strategy:

```kotlin
interface SortStrategy<T : Comparable<T>> {
    fun sort(items: MutableList<T>)
}

class BubbleSort<T : Comparable<T>> : SortStrategy<T> {
    override fun sort(items: MutableList<T>) {
        for (i in 0 until items.size - 1) {
            for (j in 0 until items.size - i - 1) {
                if (items[j] > items[j + 1]) {
                    val tmp = items[j]
                    items[j] = items[j + 1]
                    items[j + 1] = tmp
                }
            }
        }
    }
}

class QuickSort<T : Comparable<T>> : SortStrategy<T> {
    override fun sort(items: MutableList<T>) = items.sort()  // delegate to stdlib
}

class DataProcessor<T : Comparable<T>>(private var strategy: SortStrategy<T>) {
    fun setStrategy(strategy: SortStrategy<T>) { this.strategy = strategy }
    fun process(data: MutableList<T>) = strategy.sort(data)
}
```

**Idiomatic Kotlin** — the same thing with no boilerplate:

```kotlin
class DataProcessor<T : Comparable<T>>(
    private var sort: (MutableList<T>) -> Unit = { it.sort() }
) {
    fun setStrategy(strategy: (MutableList<T>) -> Unit) { sort = strategy }
    fun process(data: MutableList<T>) = sort(data)
}

val processor = DataProcessor<Int>()
val data = mutableListOf(5, 3, 1, 4, 2)

processor.process(data)
println(data)  // [1, 2, 3, 4, 5]

processor.setStrategy { list -> list.sortDescending() }
processor.process(data)
println(data)  // [5, 4, 3, 2, 1]
```

A lambda is a Strategy. A higher-order function parameter is a Strategy injection point. In Kotlin, you've been using Strategy without naming it.

### In the wild

**`Comparator`** is the Strategy interface in every Java/Kotlin sort call:

```kotlin
val users = listOf(User("Bob", 30), User("Alice", 25), User("Carol", 35))

// Strategy: sort by name
users.sortedWith(compareBy { it.name })

// Strategy: sort by age descending
users.sortedWith(compareByDescending { it.age })
```

**Spring's `AuthenticationStrategy`** and `PasswordEncoder` are Strategies — you inject `BCryptPasswordEncoder` or `Argon2PasswordEncoder`, and the authentication logic doesn't change.

---

## Template Method

### What problem does it solve?

You have an algorithm with a fixed structure, but some steps vary between implementations. Template Method defines the skeleton of the algorithm in a base class, deferring certain steps to subclasses — without changing the overall flow.

> **Analogy:** A cooking recipe. The steps are fixed: prepare ingredients → cook → plate. Each chef's specific "cook" step is different — but the sequence never changes.

### When to use it

- Multiple classes share the same algorithm structure but differ in specific steps.
- You want to enforce an invariant algorithm structure that subclasses can't break.
- You're building a framework where users extend behavior by overriding specific hooks.

### When NOT to use it

- When inheritance becomes unwieldy — deep Template Method hierarchies are hard to follow. Consider Strategy (composition) instead.
- When Kotlin's higher-order functions make the "hook" simpler as a lambda parameter.

### Kotlin implementation

```kotlin
abstract class DataExporter {
    // Template Method — defines the algorithm skeleton
    fun export(data: List<Any>): String {
        val filtered   = filter(data)
        val formatted  = format(filtered)
        val compressed = if (shouldCompress()) compress(formatted) else formatted
        return wrap(compressed)
    }

    protected abstract fun filter(data: List<Any>): List<Any>
    protected abstract fun format(data: List<Any>): String

    // Hook — subclasses may override, but don't have to
    protected open fun shouldCompress(): Boolean = false
    private fun compress(data: String): String = "[compressed:$data]"
    private fun wrap(data: String): String = "EXPORT{$data}"
}

class CsvExporter : DataExporter() {
    override fun filter(data: List<Any>) = data.filter { it.toString().isNotBlank() }
    override fun format(data: List<Any>) = data.joinToString(",")
}

class JsonExporter : DataExporter() {
    override fun filter(data: List<Any>) = data
    override fun format(data: List<Any>) = "[${data.joinToString(",") { "\"$it\"" }}]"
    override fun shouldCompress() = true
}

println(CsvExporter().export(listOf("Alice", "Bob", "", "Carol")))
println(JsonExporter().export(listOf("Alice", "Bob", "Carol")))
```

**Functional Kotlin variant** — when you want Template Method without inheritance:

```kotlin
fun <T> exportData(
    data: List<T>,
    filter:   (List<T>) -> List<T>  = { it },
    format:   (List<T>) -> String,
    compress: Boolean               = false,
): String {
    val filtered  = filter(data)
    val formatted = format(filtered)
    val result    = if (compress) "[compressed:$formatted]" else formatted
    return "EXPORT{$result}"
}

// Each "subclass" is now a call with different lambdas
exportData(listOf("Alice", "Bob"), format = { it.joinToString(",") })
exportData(listOf("Alice", "Bob"), format = { "[${it.joinToString(",")}]" }, compress = true)
```

### In the wild

This is the most-used pattern in Spring. Every `*Template` class is a Template Method implementation:

- **`JdbcTemplate`**: `execute(sql)` → gets connection, prepares statement, *executes your code*, closes connection. You provide the query; Spring provides the lifecycle.
- **`RestTemplate`**: `getForObject(url, type)` → creates request, *calls your URL*, handles response, deserializes. You provide the URL; Spring handles the HTTP ceremony.
- **`AbstractController`**: defines request handling flow, lets subclasses override specific steps.

When you extend `AbstractXxx` in any framework and override a method called `doXxx`, you're using Template Method.

---

## Visitor

### What problem does it solve?

You have a stable class hierarchy and want to add new operations to it without modifying those classes. Visitor separates the operation from the object structure.

> **Analogy:** A tax assessor visiting different property types. The assessor applies different formulas for residential vs. commercial vs. industrial properties. The properties don't change — the assessment algorithm does.

### When to use it

- You need to add many distinct operations to an object hierarchy without touching those classes.
- You don't own the hierarchy (third-party library AST nodes, compiler IR).
- The hierarchy is stable, but new operations are added frequently.

### When NOT to use it

- **If you own the hierarchy and it uses sealed classes — use `when` instead.** It achieves exhaustive dispatch without the double-dispatch ceremony of `visit`/`accept`.
- When the element hierarchy changes frequently — every new element type requires updating every visitor.
- When there's only one operation — just add the method to the class.

### Kotlin implementation

Classic Visitor (when you don't own the element hierarchy):

```kotlin
// Element hierarchy — stable, not owned by you
interface Shape {
    fun accept(visitor: ShapeVisitor)
}

class Circle(val radius: Double) : Shape {
    override fun accept(visitor: ShapeVisitor) = visitor.visit(this)
}

class Rectangle(val width: Double, val height: Double) : Shape {
    override fun accept(visitor: ShapeVisitor) = visitor.visit(this)
}

class Triangle(val base: Double, val height: Double) : Shape {
    override fun accept(visitor: ShapeVisitor) = visitor.visit(this)
}

// Visitor interface — one method per element type
interface ShapeVisitor {
    fun visit(circle: Circle)
    fun visit(rectangle: Rectangle)
    fun visit(triangle: Triangle)
}

// New operations as Visitors — no changes to Shape classes
class AreaCalculator : ShapeVisitor {
    var totalArea = 0.0
    override fun visit(circle: Circle)        { totalArea += Math.PI * circle.radius * circle.radius }
    override fun visit(rectangle: Rectangle)   { totalArea += rectangle.width * rectangle.height }
    override fun visit(triangle: Triangle)     { totalArea += 0.5 * triangle.base * triangle.height }
}

class SvgRenderer : ShapeVisitor {
    override fun visit(circle: Circle)        = println("<circle r='${circle.radius}'/>")
    override fun visit(rectangle: Rectangle)   = println("<rect w='${rectangle.width}' h='${rectangle.height}'/>")
    override fun visit(triangle: Triangle)     = println("<polygon .../>")
}

val shapes: List<Shape> = listOf(Circle(5.0), Rectangle(4.0, 6.0), Triangle(3.0, 8.0))

val calc = AreaCalculator()
shapes.forEach { it.accept(calc) }
println("Total area: ${calc.totalArea}")
```

**Idiomatic Kotlin: `sealed class` + `when`** — when you own the hierarchy:

```kotlin
sealed class Shape {
    data class Circle(val radius: Double) : Shape()
    data class Rectangle(val width: Double, val height: Double) : Shape()
    data class Triangle(val base: Double, val height: Double) : Shape()
}

// No visitor interface needed — when is exhaustive
fun area(shape: Shape): Double = when (shape) {
    is Shape.Circle    -> Math.PI * shape.radius * shape.radius
    is Shape.Rectangle -> shape.width * shape.height
    is Shape.Triangle  -> 0.5 * shape.base * shape.height
}

fun render(shape: Shape): String = when (shape) {
    is Shape.Circle    -> "<circle r='${shape.radius}'/>"
    is Shape.Rectangle -> "<rect w='${shape.width}' h='${shape.height}'/>"
    is Shape.Triangle  -> "<polygon .../>"
}
```

Same exhaustive dispatch, zero double-dispatch ceremony.

### In the wild

**Kotlin compiler's PSI/IR**: the frontend (parsing → type checking → code generation) traverses the AST using `KtVisitor`. Every lint rule in **Detekt** implements a visitor over AST nodes.

**KSP (Kotlin Symbol Processing)**: annotation processors implement `KSVisitorVoid` to inspect Kotlin symbols without modifying the compiler.

`javax.lang.model.element.ElementVisitor` in the Java annotation processing API is the same pattern — used by every annotation processor in the JVM ecosystem.

---

## Interpreter

### What problem does it solve?

You have a simple language (expressions, queries, formulas) and need to parse and evaluate sentences in that language. Interpreter defines a grammar using a class hierarchy — each grammar rule is a class, and evaluation is a recursive `interpret()` call.

> **Analogy:** A calculator that evaluates `3 + 4 * 2`. The expression is a sentence in a mini-language. The calculator interprets it by parsing it into an expression tree and recursively evaluating nodes.

### When to use it

- You need to interpret sentences in a simple, well-defined language.
- The grammar is small and unlikely to grow significantly.
- Users write expressions that need runtime evaluation (rules engines, formula parsers).

### When NOT to use it

- When the language is complex — Interpreter does not scale. Use a real parser (ANTLR, parser combinators) instead.
- **If callers are developers**, a Kotlin DSL is strictly better: type-safe, IDE support, no runtime parsing, no grammar classes.
- Don't implement Interpreter to parse config files — use JSON/YAML/TOML with off-the-shelf parsers.

### Kotlin implementation

A simple boolean expression evaluator:

```kotlin
// Abstract expression
interface Expression {
    fun interpret(context: Map<String, Boolean>): Boolean
}

// Terminal expressions
class Variable(private val name: String) : Expression {
    override fun interpret(context: Map<String, Boolean>) =
        context[name] ?: throw IllegalArgumentException("Undefined variable: $name")
}

class Literal(private val value: Boolean) : Expression {
    override fun interpret(context: Map<String, Boolean>) = value
}

// Non-terminal expressions
class AndExpression(private val left: Expression, private val right: Expression) : Expression {
    override fun interpret(context: Map<String, Boolean>) =
        left.interpret(context) && right.interpret(context)
}

class OrExpression(private val left: Expression, private val right: Expression) : Expression {
    override fun interpret(context: Map<String, Boolean>) =
        left.interpret(context) || right.interpret(context)
}

class NotExpression(private val expr: Expression) : Expression {
    override fun interpret(context: Map<String, Boolean>) = !expr.interpret(context)
}

// Evaluating: (isAdmin OR isOwner) AND NOT isDeleted
val rule: Expression = AndExpression(
    OrExpression(Variable("isAdmin"), Variable("isOwner")),
    NotExpression(Variable("isDeleted"))
)

val context = mapOf("isAdmin" to false, "isOwner" to true, "isDeleted" to false)
println(rule.interpret(context))  // true
```

**Kotlin DSL alternative** — when callers are developers, skip the Interpreter entirely:

```kotlin
// Type-safe DSL — no parsing, no runtime grammar
class Permission(private val checks: List<() -> Boolean>) {
    fun evaluate() = checks.all { it() }
}

fun permission(block: PermissionBuilder.() -> Unit): Permission {
    val builder = PermissionBuilder()
    builder.block()
    return builder.build()
}

class PermissionBuilder {
    private val checks = mutableListOf<() -> Boolean>()
    fun require(check: () -> Boolean) { checks.add(check) }
    fun build() = Permission(checks)
}

val canEdit = permission {
    require { user.isAdmin || user.isOwner }
    require { !user.isDeleted }
}

println(canEdit.evaluate())  // no parsing, full IDE support, compile-time safety
```

### In the wild

**Spring Expression Language (SpEL)**: every `@Value("#{systemProperties['user.home']}")` annotation is parsed and interpreted at runtime using Interpreter. `ExpressionParser` builds the expression tree; `Expression.getValue()` interprets it.

**`java.util.regex.Pattern`**: regex syntax is a mini-language. `Pattern.compile("\\d+")` builds the expression tree; `Matcher.find()` interprets it against input.

**Hibernate JPQL / Spring Data `@Query`**: query strings are parsed into an AST and interpreted to generate SQL at runtime.

---

## Wrapping up: All 23 patterns at a glance

### Creational — who creates the object?

| Pattern | Core intent |
|---|---|
| Singleton | One instance globally |
| Factory Method | Subclass decides the type |
| Abstract Factory | Families of related objects |
| Builder | Step-by-step construction |
| Prototype | Clone from an existing instance |

### Structural — how do objects fit together?

| Pattern | Core intent |
|---|---|
| Adapter | Translate incompatible interfaces |
| Bridge | Separate abstraction from implementation |
| Composite | Tree of uniform leaf/composite nodes |
| Decorator | Add behavior at runtime via wrapping |
| Facade | Simple interface over a complex subsystem |
| Flyweight | Share immutable intrinsic state |
| Proxy | Transparent access control |

### Behavioral — how do objects communicate?

| Pattern | Core intent |
|---|---|
| Chain of Responsibility | Pass request along a handler chain |
| Command | Encapsulate a request as an object |
| Iterator | Sequential access without exposing internals |
| Mediator | Central coordinator for decoupled components |
| Memento | Capture and restore object state |
| Observer | Notify dependents of state changes |
| State | Change behavior based on internal state |
| Strategy | Swap interchangeable algorithms |
| Template Method | Fixed skeleton, variable steps |
| Visitor | Add operations to a stable hierarchy |
| Interpreter | Evaluate sentences in a mini-language |

---

The 23 patterns are not a checklist to apply mechanically. They're a shared vocabulary — a way to name what's happening in code so that teams can discuss design with precision. The real skill is recognizing them in frameworks you already use, and knowing when the simplicity of a Kotlin lambda or sealed class makes the named pattern unnecessary.
