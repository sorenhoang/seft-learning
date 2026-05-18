---
title: "Design Patterns in Kotlin: A Practical Guide"
description: "A complete 5-chapter series covering all 23 Gang of Four design patterns through a practical Kotlin lens — with real-world examples from Spring, OkHttp, Android, and Jetpack Compose."
tags: ["design-patterns", "kotlin", "oop", "software-engineering", "clean-code"]
date: "2026-05-18"
draft: false
---

## Overview

Every senior engineer eventually learns to *read* their framework. Why does Spring wrap every `@Transactional` method? What is OkHttp's `Interceptor` chain, really? Why does `RecyclerView.Adapter` have that name?

The answer is almost always a design pattern.

**Design Patterns in Kotlin** covers all 23 Gang of Four patterns — not as academic exercises, but as a reading skill. Each chapter shows where a pattern is already working invisibly in code you use every day, then demonstrates when and how you'd write it yourself in idiomatic Kotlin.

The lens throughout is practical: every pattern section answers three questions — *what problem does this solve, when should I reach for it, and when shouldn't I.*

---

## Series Structure

### Part I — Creational Patterns

| # | Chapter |
| :-- | :--- |
| 1 | Creational Patterns — Singleton, Factory Method, Abstract Factory, Builder, Prototype |

### Part II — Structural Patterns

| # | Chapter |
| :-- | :--- |
| 2 | Structural Patterns — Adapter, Bridge, Composite, Decorator |
| 3 | Structural Patterns — Facade, Flyweight, Proxy |

### Part III — Behavioral Patterns

| # | Chapter |
| :-- | :--- |
| 4 | Behavioral Patterns — Chain of Responsibility, Command, Iterator, Mediator, Memento |
| 5 | Behavioral Patterns — Observer, State, Strategy, Template Method, Visitor, Interpreter |

---

## Who This Is For

Junior-to-mid engineers who have heard of design patterns but struggle to recognize them in live codebases or judge when to reach for one. A working knowledge of Kotlin syntax is assumed; no prior pattern experience required.

---

*Start with Chapter 1: Creational Patterns — where object construction is never as simple as `MyClass()`.*
