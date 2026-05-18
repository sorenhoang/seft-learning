---
title: "Structural Patterns — Adapter, Bridge, Composite, Decorator"
order: 2
tags: ["design-patterns", "kotlin", "structural-patterns"]
date: "2026-05-18"
draft: false
lang: "en"
---

Structural patterns are about composition — how classes and objects are combined to form larger structures. They answer the question: *how do these pieces fit together without creating a tangled mess?*

This chapter covers four of the seven GoF structural patterns. The common thread: all four exist to connect things that weren't originally designed to work together, or to add behavior without changing the original.

---

## Adapter

### What problem does it solve?

Two things need to work together but have incompatible interfaces. The Adapter wraps one of them to translate calls between them — like a power plug adapter between a US device and a European socket.

> **Analogy:** A translator at a business meeting. The two parties speak different languages; the translator converts on the fly so both sides can proceed without either changing how they communicate.

### When to use it

- Integrating a third-party library whose interface doesn't match your codebase's expectations.
- Making existing code work with a new interface without touching the original.
- Creating a uniform interface over multiple disparate implementations (payment gateways, storage providers).

### When NOT to use it

- If you own both sides of the interface, redesign them to be compatible instead of adding an adapter.
- When the incompatibility is so deep that the adapter becomes a leaky abstraction — callers start knowing about both layers.

### Kotlin implementation

```kotlin
// Your codebase expects this interface
interface MediaPlayer {
    fun play(fileName: String)
}

// Third-party library with a different interface
class LegacyAudioPlayer {
    fun playMp3(file: String) = println("Playing MP3: $file")
    fun playWav(file: String) = println("Playing WAV: $file")
}

// Adapter — wraps LegacyAudioPlayer, exposes MediaPlayer
class AudioPlayerAdapter(
    private val legacy: LegacyAudioPlayer
) : MediaPlayer {
    override fun play(fileName: String) {
        when {
            fileName.endsWith(".mp3") -> legacy.playMp3(fileName)
            fileName.endsWith(".wav") -> legacy.playWav(fileName)
            else -> throw IllegalArgumentException("Unsupported format: $fileName")
        }
    }
}

// Client code — only knows MediaPlayer
val player: MediaPlayer = AudioPlayerAdapter(LegacyAudioPlayer())
player.play("song.mp3")
player.play("effect.wav")
```

**Kotlin delegation shortcut** — when the adapter mostly forwards calls with minor changes, `by` reduces boilerplate:

```kotlin
class LoggingMediaPlayer(
    private val delegate: MediaPlayer
) : MediaPlayer by delegate {
    // Override only the methods that need wrapping
    override fun play(fileName: String) {
        println("Playing: $fileName")
        delegate.play(fileName)
    }
}
```

### In the wild

`RecyclerView.Adapter` is named directly after this pattern. Your data is a `List<User>`; `RecyclerView` expects `ViewHolder` items with specific lifecycle callbacks. The adapter translates between them — `getItemCount()`, `onCreateViewHolder()`, `onBindViewHolder()` are the translation layer.

Retrofit's `Converter.Factory` adapts any serialization format (Gson, Moshi, Kotlinx Serialization) to the `RequestBody` / `ResponseBody` interface OkHttp expects.

---

## Bridge

### What problem does it solve?

When a class can vary in two independent dimensions, naive inheritance causes a combinatorial explosion. Bridge separates these two dimensions into independent class hierarchies, linked by composition.

> **Analogy:** A TV remote (abstraction) and a TV (implementation). You can design any remote shape without caring which TV brand it controls. You can sell any TV without caring which remote the customer buys. The connection is a simple interface.

### When to use it

- A class varies in two orthogonal dimensions (e.g., shape + rendering engine, notification + delivery channel).
- You need to switch implementations at runtime.
- You want to extend both dimensions independently without a class hierarchy that multiplies.

### When NOT to use it

- When there's really only one dimension of variation — you've added an abstraction layer for nothing.
- Don't apply it speculatively. Wait until you feel the subclass explosion.
- When cohesion is high (the two "dimensions" are naturally intertwined), splitting them makes the code harder to follow.

### Kotlin implementation

Suppose you're building a drawing app. Shapes can be circles or rectangles. Renderers can be SVG or Canvas. Without Bridge: `SvgCircle`, `SvgRectangle`, `CanvasCircle`, `CanvasRectangle` — 4 classes for 2×2. Add one more of either, and it doubles again.

```kotlin
// Implementation hierarchy — rendering engines
interface Renderer {
    fun renderCircle(radius: Float)
    fun renderRectangle(width: Float, height: Float)
}

class SvgRenderer : Renderer {
    override fun renderCircle(radius: Float) =
        println("<circle r='$radius'/>")
    override fun renderRectangle(width: Float, height: Float) =
        println("<rect width='$width' height='$height'/>")
}

class CanvasRenderer : Renderer {
    override fun renderCircle(radius: Float) =
        println("Canvas.drawCircle(radius=$radius)")
    override fun renderRectangle(width: Float, height: Float) =
        println("Canvas.drawRect(width=$width, height=$height)")
}

// Abstraction hierarchy — shapes
abstract class Shape(protected val renderer: Renderer) {
    abstract fun draw()
}

class Circle(radius: Float, renderer: Renderer) : Shape(renderer) {
    private val r = radius
    override fun draw() = renderer.renderCircle(r)
}

class Rectangle(width: Float, height: Float, renderer: Renderer) : Shape(renderer) {
    private val w = width
    private val h = height
    override fun draw() = renderer.renderRectangle(w, h)
}

// Mix and match at runtime — no new classes needed
val svgCircle = Circle(5f, SvgRenderer())
val canvasRect = Rectangle(10f, 20f, CanvasRenderer())
svgCircle.draw()    // <circle r='5.0'/>
canvasRect.draw()   // Canvas.drawRect(width=10.0, height=20.0)
```

### In the wild

JDBC is the canonical Java example. `java.sql.Connection` is the abstraction. MySQL Connector, PostgreSQL JDBC, and H2 are concrete implementations. Your application code never changes when you swap the database driver — only the implementation beneath the bridge changes.

AWT uses the same structure: `java.awt.Component` is the abstraction; platform-specific `ComponentPeer` implementations handle the OS-level rendering.

---

## Composite

### What problem does it solve?

You have a tree structure where individual items and groups of items need to be treated uniformly. Composite lets clients ignore whether they're dealing with a single leaf or a complex subtree.

> **Analogy:** A file system. A file has a size. A folder has a size — which is the sum of its contents, which may themselves be files or folders. The code that calculates "total size" doesn't need to know which it's dealing with.

### When to use it

- You're working with recursive, tree-shaped data (file systems, UI component trees, organizational charts, menus, HTML/XML DOMs).
- Client code should treat leaf nodes and composite nodes identically.

### When NOT to use it

- When the tree is shallow and fixed — a plain data class with a list is simpler.
- When type differences between leaves and composites matter to clients — the uniform interface is a liability if callers need to distinguish.

### Kotlin implementation

```kotlin
// Component — common interface for leaves and composites
interface FileSystemNode {
    val name: String
    fun size(): Long
    fun print(indent: String = "")
}

// Leaf — no children
class File(
    override val name: String,
    private val bytes: Long
) : FileSystemNode {
    override fun size() = bytes
    override fun print(indent: String) = println("${indent}📄 $name ($bytes bytes)")
}

// Composite — contains children, delegates size() to them
class Directory(override val name: String) : FileSystemNode {
    private val children = mutableListOf<FileSystemNode>()

    fun add(node: FileSystemNode) = children.add(node)

    override fun size(): Long = children.sumOf { it.size() }

    override fun print(indent: String) {
        println("${indent}📁 $name (${size()} bytes)")
        children.forEach { it.print("$indent  ") }
    }
}

// Client code — treats File and Directory identically
val root = Directory("project").apply {
    add(File("README.md", 1_024))
    add(Directory("src").apply {
        add(File("Main.kt", 4_096))
        add(File("Utils.kt", 2_048))
    })
    add(Directory("test").apply {
        add(File("MainTest.kt", 3_072))
    })
}

root.print()
println("Total: ${root.size()} bytes")
```

### In the wild

Jetpack Compose is built on Composite. Every `@Composable` function is either a leaf (a `Text` or `Icon` that renders directly) or a composite (`Column`, `Row`, `Box` that layout and render their children). The framework walks this tree at draw time without caring which nodes are leaves — that's Composite.

The Android View hierarchy before Compose uses the same structure: `View` is the component interface, `ViewGroup` is the composite, individual `TextView` and `Button` are leaves.

---

## Decorator

### What problem does it solve?

You want to add behavior to an object without subclassing — and without modifying the original class. Decorator wraps the original object and intercepts calls, adding behavior before or after delegating.

> **Analogy:** A coffee order. A plain espresso is your base object. Add milk: Decorator wraps it. Add sugar: another Decorator wraps that. The customer interface is always "coffee"; each wrapper adds a layer of behavior at runtime.

### When to use it

- You need to add responsibilities to objects at runtime, not at compile time.
- Subclassing would lead to an explosion of classes for every combination of features.
- You want to compose behaviors from small, focused pieces.

### When NOT to use it

- When the wrapping order matters in non-obvious ways — Decorator chains can be hard to debug.
- When Kotlin extension functions or higher-order functions solve the same problem more cleanly (see below).
- Don't use Decorator to work around a poor class design — fix the design.

### Kotlin implementation

```kotlin
// Component interface
interface DataSource {
    fun writeData(data: String)
    fun readData(): String
}

// Concrete component
class FileDataSource(private val fileName: String) : DataSource {
    private var data: String = ""
    override fun writeData(data: String) { this.data = data }
    override fun readData(): String = data
}

// Base Decorator — delegates everything by default
abstract class DataSourceDecorator(
    private val wrappee: DataSource
) : DataSource by wrappee

// Concrete Decorators — add behavior selectively
class EncryptionDecorator(private val wrappee: DataSource) : DataSource by wrappee {
    override fun writeData(data: String) {
        val encrypted = data.reversed()  // simplified
        wrappee.writeData(encrypted)
    }
    override fun readData(): String = wrappee.readData().reversed()
}

class CompressionDecorator(private val wrappee: DataSource) : DataSource by wrappee {
    override fun writeData(data: String) {
        val compressed = "[compressed:$data]"  // simplified
        wrappee.writeData(compressed)
    }
}

// Compose behaviors at runtime
val source: DataSource = CompressionDecorator(
    EncryptionDecorator(
        FileDataSource("data.txt")
    )
)
source.writeData("Hello, World!")
```

**Kotlin extension functions vs. Decorator:** Extension functions add methods syntactically but are statically dispatched at compile time. They can't be composed at runtime and don't wrap instance state. Use extension functions for utility methods; use Decorator when behavior needs to be composable at runtime.

### In the wild

OkHttp's `Interceptor` chain is the most common Decorator in the Kotlin/Android ecosystem. Each interceptor wraps the next:

```kotlin
val client = OkHttpClient.Builder()
    .addInterceptor(LoggingInterceptor())    // Decorator 1: logs request/response
    .addInterceptor(AuthInterceptor(token))  // Decorator 2: adds auth header
    .addInterceptor(RetryInterceptor(3))     // Decorator 3: retries on failure
    .build()
```

Each interceptor receives a `Chain`, calls `chain.proceed(request)` to delegate to the next, and can modify the request before or the response after. That's Decorator, applied three times to the same base.

Jetpack Compose's `Modifier` is also a Decorator chain: `Modifier.padding(16.dp).background(Color.Red).clickable { }` wraps the composable with successive behaviors.

---

## Wrapping up

| Pattern | Core question it answers | Key signal to reach for it |
|---|---|---|
| Adapter | "These two things need to work together but can't." | Integrating a third-party or legacy interface |
| Bridge | "This class is varying in two independent directions." | You see N×M subclass combinations forming |
| Composite | "I need to treat one and many identically." | Tree-shaped data structures |
| Decorator | "I need to add behavior at runtime without subclassing." | You want composable feature combinations |

Next: [Structural Patterns Part 2 →](/technical/design-patterns/03-structural-part2) — Facade, Flyweight, and Proxy.
