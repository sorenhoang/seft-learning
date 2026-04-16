---
title: "OAuth 2.0 — Delegating Access to Third Parties the Right Way"
tags: ["Security", "OAuth2", "API-Design", "SystemDesign", "BestPractices"]
description: "A comprehensive guide to OAuth 2.0: roles, grant types, modern security enhancements like PKCE and DPoP, and the common vulnerabilities every engineer must know."
date: "2026-04-26"
order: 6
draft: false
---

## I. Core Concept and Purpose

*   **Definition:** OAuth 2.0 is an authorization framework that enables third-party applications to obtain limited access to a user's protected resources (like an HTTP service or API) without requiring the user to expose their login credentials. 
*   **Authorization, Not Authentication:** OAuth 2.0 focuses strictly on authorization (granting access). It provides no identity or authentication information about the user on its own. To add authentication and user identity features, the **OpenID Connect (OIDC)** protocol is layered on top of OAuth 2.0.

## II. The Four OAuth Roles

An OAuth 2.0 flow is defined by the interaction between four distinct entities:

1.  **Resource Owner:** The entity (typically an end-user) capable of granting access to a protected resource.
2.  **Client Application:** The third-party application making requests to protected resources on behalf of the resource owner. Clients are categorized as either **confidential** (capable of securely keeping a client secret, like a backend server) or **public** (incapable of securing a secret, like single-page applications or mobile apps).
3.  **Authorization Server:** The server that authenticates the resource owner, obtains their authorization, and issues access tokens to the client.
4.  **Resource Server:** The server hosting the protected resources/APIs, which accepts and responds to requests using valid access tokens.

## III. Authorization Grant Types

OAuth defines different "flows" or grant types to accommodate various client types and use cases:

*   **Authorization Code Grant:** The recommended flow for most web and mobile applications. The client redirects the user to the authorization server. After the user approves access, the client receives a short-lived "authorization code," which is then exchanged securely for an access token via server-to-server communication.
*   **Client Credentials Grant:** Designed for Machine-to-Machine (M2M) or server-to-server communication where no human user is involved. 
*   **Device Code Grant:** Designed for input-constrained devices, such as smart TVs, allowing the user to authenticate on a secondary device (like a smartphone).
*   **Deprecated/Discouraged Grants:**
    *   **Implicit Grant:** Once popular for Single-Page Applications (SPAs), this flow skips the code exchange and returns the access token directly in the browser's URL fragment. Due to high risks of token leakage via browser history or referer headers, it is now formally deprecated in modern best practices (like OAuth 2.1).
    *   **Resource Owner Password Credentials Grant:** Involves the user giving their username and password directly to the client app. This maintains the password anti-pattern OAuth sought to eliminate and is now highly discouraged.

## IV. Key Security Enhancements & Best Practices (RFC 9700 & OAuth 2.1)

Due to evolving threats, the OAuth framework has been expanded with several strict security recommendations:

*   **Proof Key for Code Exchange (PKCE):** An extension initially designed for public native apps but now recommended for *all* clients. It requires the client to send a cryptographically hashed "code challenge" during the authorization request and a "code verifier" during the token exchange. This prevents attackers from injecting or redeeming stolen authorization codes.
*   **Exact Redirect URI Matching:** To prevent authorization codes and tokens from leaking via open redirectors, authorization servers must use exact string matching for pre-registered redirect URIs (wildcards and pattern matching are discouraged).
*   **Pushed Authorization Requests (PAR):** A mechanism where the client sends the authorization request parameters directly to the authorization server via a secure POST request rather than passing them through the user's browser (the front-channel). This significantly improves request integrity and confidentiality.
*   **Rich Authorization Requests (RAR):** A feature that allows clients to request highly granular, structured authorization details (such as a specific payment amount to a specific bank account in Open Banking) instead of relying on broad, ambiguous scopes.
*   **Backend-for-Frontend (BFF):** A recommended pattern where frontend applications (like SPAs) rely on a backend component to manage OAuth interactions and store tokens. The frontend only uses secure session cookies, keeping tokens completely hidden from the browser.

## V. Token Protection & Management

*   **Audience-Restricted Tokens:** Access tokens should be specifically restricted (via the `aud` claim or resource indicators) to the specific resource server they are intended for, preventing an attacker from using a stolen token across different APIs.
*   **Sender-Constrained Tokens:** Traditional bearer tokens can be used by anyone who possesses them. Best practices now recommend tying tokens cryptographically to the client that requested them. Mechanisms like **DPoP (Demonstrating Proof of Possession)** or **Mutual TLS (mTLS)** ensure that even if an attacker steals a token, they cannot use it without the client's underlying private key.

## VI. Common Vulnerabilities & Threats

*   **Cross-Site Request Forgery (CSRF):** Attackers might inject requests into the OAuth flow. This is mitigated by using a `state` parameter bound to the user's session, a `nonce`, or inherently via PKCE.
*   **Mix-Up Attacks:** In scenarios where a client talks to multiple authorization servers, an attacker can trick the client into sending credentials (like the authorization code) to an attacker-controlled server. Defenses include using unique redirect URIs per server or having the server return its exact issuer identifier (`iss`) in the response.
*   **Credential Leakage:** Authorization codes or access tokens can inadvertently leak through HTTP Referer headers, proxy logs, or browser histories if passed via URLs. Using short-lived codes, the `form_post` response mode, and strict Referrer Policies mitigates this.
