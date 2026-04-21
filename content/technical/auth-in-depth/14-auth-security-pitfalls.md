---
title: "Auth Security Pitfalls — CSRF, XSS, Token Leaking, and How to Prevent Them"
tags: ["security", "oauth2", "jwt", "csrf", "xss", "vulnerabilities", "authentication"]
date: "2026-05-12"
order: 14
draft: false
---

## I. OAuth 2.0 Implementation Pitfalls

*   **Choosing the wrong grant type:** Using flows inappropriately for the environment, such as using the Client Credentials grant for user authentication instead of machine-to-machine communication.
*   **Skipping PKCE for public clients:** Failing to use Proof Key for Code Exchange (PKCE) leaves public clients (like Single-Page Applications) vulnerable to authorization code interception.
*   **Redirect URI vulnerabilities:** Using overly permissive URIs (like broad domain patterns or wildcards) or misconfiguring callback paths, which allows attackers to redirect authorization codes to malicious endpoints.
*   **Incomplete token validation in APIs:** Skipping core property checks—such as the Issuer, Audience, Expiration, and Signature—allowing attackers to use expired, tampered, or mismatched tokens.
*   **Storing tokens insecurely:** Placing tokens in `localStorage` or `sessionStorage` in browser-based apps, exposing them to Cross-Site Scripting (XSS) attacks.
*   **Overly broad scopes:** Granting excessive permissions rather than task-specific ones, which increases the blast radius if a token is leaked.
*   **Using long-lived access tokens:** Increasing the opportunity for attackers to steal and reuse access tokens; best practices recommend pairing short-lived access tokens with refresh tokens instead.

## II. JSON Web Token (JWT) Vulnerabilities

*   **Weak signatures and insufficient validation:** Attackers can alter the token's header to use the "none" algorithm or change an asymmetric algorithm (e.g., RSA256) to a symmetric one (e.g., HS256) to bypass signature verification.
*   **Weak symmetric keys:** Using human-memorable passwords or low-entropy keys for MAC algorithms like "HS256" makes the token vulnerable to offline brute-force and dictionary attacks.
*   **Plaintext leakage:** Compressing data before encryption can reveal information about the plaintext through ciphertext length analysis.
*   **Substitution and cross-JWT confusion:** A JWT issued for one specific recipient or purpose being maliciously presented to a different, unintended application.
*   **Indirect attacks on the server:** Exploiting claims like the `kid` (key ID) for SQL/LDAP injection, or using headers like `jku` or `x5u` to execute server-side request forgery (SSRF) attacks.

## III. General Authentication & Multi-Factor Authentication (MFA) Failures

*   **Brute-force attacks:** Automated attacks manually guessing passwords or 2FA codes due to an absence of lockout systems or rate limiting.
*   **MFA bypass via response tampering:** Exploiting logical errors where server-side security checks are missing. Attackers intercept the HTTP response (e.g., a "400 Bad Request" for an incorrect OTP) and change it to "200 OK", bypassing the check entirely if the client-side code trusts the altered response.
*   **Mass assignment:** Attackers injecting additional, unapproved parameters into an authentication or registration request (e.g., adding `&cash=5000` to a registration form) to alter backend private properties.
*   **Password reset and session flaws:** Vulnerabilities arising from poorly implemented password reset URLs or failing to securely terminate user sessions.

## IV. Authorization (Access Control) Flaws

*   **Insecure Direct Object Reference (IDOR):** The application granting direct access to internal objects (like database records) based on unverified user input, allowing an attacker to guess IDs and view or modify other users' accounts.
*   **Broken Object Level Authorization (BOLA):** Functionally similar to IDOR but found in APIs, where attackers manipulate API requests to access or leak other users' profile data.

## V. Logic and Race Condition Vulnerabilities

*   **Time of Check to Time of Use (TOCTOU):** A race condition where a system checks a condition (like a password validity or file permission) and acts on it later, creating a micro-window for an attacker to alter the state.
*   **Authentication race conditions:** Flooding a web login system with parallel requests during moments of high latency. If the system is too slow to register a failed password check, multiple requests might slip through the check phase, inadvertently causing the system to issue valid authentication tokens for incorrect credentials.
