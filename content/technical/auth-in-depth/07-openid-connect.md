---
title: "OpenID Connect — The Identity Layer on Top of OAuth 2.0"
tags: ["Security", "OIDC", "OAuth2", "Authentication", "SystemDesign"]
description: "How OpenID Connect extends OAuth 2.0 to solve identity — ID tokens, claims, authentication flows, and advanced features like discovery and session management."
date: "2026-04-28"
order: 7
draft: false
---

## I. Core Concept and Purpose

*   **Definition:** OpenID Connect (OIDC) is an interoperable identity and authentication protocol built as a layer on top of the OAuth 2.0 authorization framework.
*   **Authentication vs. Authorization:** While OAuth 2.0 strictly focuses on authorization (granting third-party applications access to protected resources), it does not natively provide information about the user's identity. OIDC bridges this gap by providing authentication capabilities, allowing applications to verify exactly who the user is.

## II. Key OIDC Roles

OIDC translates standard OAuth 2.0 roles into specific authentication-focused entities:

*   **End-User:** The human participant or resource owner whose identity is being verified.
*   **Relying Party (RP):** The OAuth 2.0 client application that relies on the provider for End-User authentication and requests user identity claims.
*   **OpenID Provider (OP):** The OAuth 2.0 Authorization Server that is capable of securely authenticating the End-User and issuing identity claims to the Relying Party.

## III. The ID Token & Claims

*   **The ID Token:** The primary extension that OIDC introduces to OAuth 2.0. It is a secure JSON Web Token (JWT) that serves as digital proof that the user has been authenticated by the OpenID Provider. 
*   **Core Claims:** The ID Token contains assertions (claims) about the authentication event. Standard required claims include the issuer (`iss`), the subject identifier (`sub`), the audience (`aud`), the expiration time (`exp`), and the issued-at time (`iat`).
*   **The UserInfo Endpoint:** A protected OAuth 2.0 REST endpoint. Once the Relying Party receives an Access Token, it can query this endpoint to retrieve additional profile claims about the End-User, such as their `name`, `email`, and `picture`.

## IV. OIDC Authentication Flows

OIDC defines specific flows (based on the `response_type` parameter) to dictate how ID tokens and access tokens are delivered to the Relying Party:

*   **Authorization Code Flow:** The recommended and most secure flow for server-side applications. The Relying Party receives an authorization code via the browser, which is then securely exchanged directly between servers for an ID Token and Access Token.
*   **Implicit Flow:** Designed for single-page applications running in the browser, this flow returns the ID Token and Access Token directly in the URL fragment without a server-to-server exchange. This flow is now widely discouraged due to severe security risks like token exposure in browser history and referrer headers.
*   **Hybrid Flow:** Combines elements of the two above. It returns some tokens (such as the ID Token) immediately via the front-channel, while allowing the authorization code to be securely exchanged for an Access Token on the back-channel.

## V. Advanced Features & Extensibility

*   **Discovery:** A mechanism that allows clients to dynamically discover an OpenID Provider's metadata, such as endpoint URLs, supported scopes, and public keys, by querying a standardized URL like `/.well-known/openid-configuration`.
*   **Dynamic Client Registration:** A protocol allowing Relying Parties to dynamically register themselves with an OpenID Provider to automatically obtain a client ID and secret.
*   **Authentication Requirements (ACR & AMR):** OIDC allows Relying Parties to specify strict authentication conditions. Using the `acr` (Authentication Context Class Reference) and `amr` (Authentication Method Reference) claims, an application can mandate specific security measures, such as requiring Multi-Factor Authentication (MFA) or a specific login module.
*   **Session Management & Logout:** Extensions that allow the Relying Party to continuously monitor the End-User's login status at the OpenID Provider via hidden iframes, and to securely initiate single log-out requests.
