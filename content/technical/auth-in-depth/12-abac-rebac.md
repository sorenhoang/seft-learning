---
title: "ABAC & ReBAC — Attribute and Relationship-Based Access Control"
tags: ["security", "authorization", "abac", "rebac", "access-control", "zanzibar"]
date: "2026-05-08"
order: 12
draft: false
---

## I. Attribute-Based Access Control (ABAC)

### A. Definition

ABAC is a fine-grained, dynamic access control model that grants or denies permissions by evaluating a set of rules against the characteristics (attributes) of the entities involved in an access request. It moves beyond static roles, computing an allow/deny decision based on environmental, user, and resource inputs.

### B. Key Attribute Categories

Access decisions in ABAC typically rely on four main types of attributes:

*   **Subject Attributes:** Details about the user requesting access, such as their job title, security clearance, department, or group memberships.
*   **Resource (Object) Attributes:** Details about the targeted object, such as the file's sensitivity, classification, owner, or creation date.
*   **Environmental (Contextual) Attributes:** Surrounding conditions at the time of the request, such as geolocation, time of day, network type (e.g., public vs. VPN), or device security posture.
*   **Action Attributes:** The specific operation being attempted, such as read, view, edit, or delete.

### C. System Architecture

A standard ABAC implementation uses several core components to evaluate attributes:

*   **Policy Decision Point (PDP):** The central "brain" or policy engine (like Open Policy Agent or Cedar) that evaluates the incoming request against defined policies to return a Permit/Deny decision.
*   **Policy Enforcement Point (PEP):** The gatekeeper component that intercepts the user's request and enforces the PDP's final decision.
*   **Policy Information Point (PIP):** The bridge that gathers the necessary metadata and attributes from external sources (like LDAP or databases) for the PDP to evaluate.

### D. Pros & Cons

*   **Pros:** ABAC is highly flexible and context-aware, making it ideal for large-scale, compliance-heavy, or highly regulated environments (e.g., HIPAA or GDPR). By relying on attributes, it avoids the "role explosion" problem common in RBAC architectures.
*   **Cons:** ABAC policies involve a steep learning curve and are complex to design, implement, and audit. It can also suffer from performance latency overhead due to the time it takes to fetch and evaluate complex attributes at runtime. Furthermore, ABAC struggles to answer open-ended questions like "Who has permission to access this specific document?".

---

## II. Relationship-Based Access Control (ReBAC)

### A. Definition

ReBAC determines access based on the direct and indirect relationships between subjects and objects. Rather than relying strictly on roles or attributes, ReBAC evaluates access by traversing a chain of connections, converting the authorization question into one of graph reachability (e.g., "Is there a chain of relationships starting from this resource that leads to this user?").

### B. The Zanzibar Model

ReBAC was heavily popularized by **Google Zanzibar**, the global authorization system behind Google Drive, YouTube, and Google Photos.

*   In a Zanzibar-style ReBAC system, authorization data is stored as a graph of **relationship tuples** (e.g., `user:carla` is the `owner` of `document:planning`).
*   By traversing these relationship graphs, ReBAC can seamlessly cascade permissions through deep hierarchies, such as granting a user access to a file because they are a member of a group that owns the folder where the file resides.

### C. Pros & Cons

*   **Pros:** ReBAC excels at modeling complex, real-world hierarchies, management relationships (e.g., allowing managers to edit their reports' files), and social network connections. Because of its bi-directional nature, it can easily answer reverse-index questions like "What files does this user have access to?" and "Who has access to this file?".
*   **Cons:** ReBAC can introduce significant operational overhead as an application scales. It often requires a dedicated, highly available external database and graph engine (like SpiceDB or OpenFGA) to evaluate relationships with low latency, representing a complex infrastructure dependency.

---

## III. ABAC vs. ReBAC: A Comparative Analysis

### A. Core Differences

*   **Data Model & Logic:** ReBAC is a graph-based model that infers permissions by walking relationship paths, whereas ABAC relies on evaluating explicit, "checklist-style" boolean rules against distinct entity attributes.
*   **Ideal Use Cases:** ABAC is best when access depends on contextual or environmental limits (e.g., "Only allow access during standard business hours over a VPN"). ReBAC is superior when access depends on structured data relationships (e.g., "Users can view all documents within projects they are assigned to").

### B. Hybrid Approaches

*   ABAC and ReBAC are not mutually exclusive and are often best used in tandem. ReBAC can be viewed as a flexible implementation of ABAC where relationships function as attributes.
*   A sophisticated authorization architecture might combine the two: using ReBAC to efficiently handle the hierarchical relationships (e.g., "Does the user manage the creator of this file?") and ABAC to enforce strict environmental boundaries (e.g., "...and is the user currently on the corporate network?").
