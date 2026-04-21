---
title: "JWT & Token-Based Auth — Scaling with Statelessness"
tags: ["security", "jwt", "api-design", "system-design"]
date: "2026-04-22"
order: 4
draft: false
---

## I. The Shift to Statelessness

In the previous chapter, we explored **Session-Based Auth**, where the server acts as a meticulous record-keeper. But what happens when your product scales to millions of users across multiple microservices? This is where **Token-Based Authentication** shines.

Instead of the server "remembering" you, it gives you a **Self-Contained Token**. You carry your own proof of identity, freeing the server from the burden of state. 



---

## II. Anatomy of a JSON Web Token (JWT)

A JWT (RFC 7519) is like a digital passport. It is compact, URL-safe, and most importantly, it can be verified without a database lookup. A JWT is composed of three Base64-URL encoded parts:

1.  **Header:** Metadata about the token (Algorithm used, Type).
2.  **Payload:** The core claims (User ID, Roles, Expiration). **Warning:** JWTs are signed, not encrypted. Anyone can decode them. Never put PII (Personally Identifiable Information) here.
3.  **Signature:** The cryptographic seal that ensures the token hasn't been tampered with.



---

## III. The Dynamic Duo: Access vs. Refresh Tokens

To balance security and user experience, we use a two-token system:

* **Access Tokens:** Short-lived (e.g., 15 minutes). They are sent with every request. If stolen, the damage is limited by the short expiration.
* **Refresh Tokens:** Long-lived (e.g., 7 days). They are stored securely (httpOnly cookies) and used only to fetch a new access token. This keeps the user logged in without the risks of a long-lived access token.

---

## IV. Security & Signing: RS256 vs. HS256

As a **Senior Product Builder**, you must choose your algorithms wisely:

* **HS256 (Symmetric):** Uses a single secret key. If one service is compromised, the whole system is at risk.
* **RS256 (Asymmetric):** The gold standard. It uses a **Private Key** to sign and a **Public Key** to verify. This allows internal services to verify tokens without ever knowing the secret key used to create them.

---

## V. The Storage Battle: Where to keep your tokens?

Where you store tokens on the Frontend determines your vulnerability to XSS and CSRF:

| Storage Location | XSS Risk | CSRF Risk | Verdict |
| :--- | :--- | :--- | :--- |
| **LocalStorage** | High (Critical) | None | **Avoid** for sensitive tokens. |
| **HttpOnly Cookie** | None | High | **Good**, but requires CSRF protection. |
| **Memory (Variable)** | Lowest | None | **Best for Access Tokens** (lost on refresh). |

**Recommended Pattern:** Store the **Access Token** in memory and the **Refresh Token** in an `httpOnly`, `Secure`, `SameSite=Lax` cookie.

---

## VI. The Revocation Dilemma

The greatest strength of JWT is its greatest weakness: **It cannot be easily revoked.** Once a JWT is issued, it is valid until it expires.

### How to "Kill" a Stateless Token?
Since we can't delete a JWT from the user's "pocket," we use these strategies:
1.  **Short Lifespans:** Minimize the window of opportunity for an attacker.
2.  **Blacklisting (JTI):** Storing revoked IDs in a fast cache like Redis (Note: This makes the check stateful again).
3.  **Rotating Secrets:** Change the signing key to invalidate all tokens (The "Nuclear" option).
4.  **Refresh Token Revocation:** Delete the refresh token in the DB so the user can't get a new access token.

---

## VII. When NOT to use JWT

A common junior mistake is using JWT for everything. As a **Senior**, follow these rules:

* ❌ **Don't use JWT for standard web sessions.** Cookies/Sessions are more battle-tested and easier to revoke.
* ❌ **Don't use JWT for sensitive data.** The payload is public.
* ✅ **DO use JWT for stateless RESTful APIs.**
* ✅ **DO use JWT for single-use authorization** (e.g., a 5-minute token to download a specific file).

## Conclusion

JWT is a powerful tool for modern, distributed architectures, but it requires a high level of **Discernment**. Understand the trade-offs, protect your keys, and always prioritize secure storage.
