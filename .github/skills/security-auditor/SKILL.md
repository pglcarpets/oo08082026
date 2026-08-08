---
name: security-auditor
description: Security auditing, OWASP vulnerability prevention, input sanitization, safe header configurations, and secret isolation. Trigger when performing security reviews or guarding data inputs.
---

# Security Auditor Skill Instructions

When assessing web application security or designing data handling paths, strictly observe these safeguards:

## 1. Input Sanitization & XSS Prevention
- Sanitize and encode user-supplied inputs before rendering them into HTML contexts (`dangerouslySetInnerHTML` should be heavily audited or avoided).
- Validate all incoming API parameters, query strings, and payload schemas using strict validation libraries (e.g. Zod, Yup).
- Enforce strict Content Security Policy (CSP) headers to restrict unauthorized script execution and remote origin fetches.

## 2. Authentication, Cookies & Tokens
- Store authentication tokens in `HttpOnly`, `SameSite=Lax/Strict`, `Secure` cookies to defend against client-side script theft.
- Never log user credentials, auth tokens, or personally identifiable information (PII) to stdout or client debug logs.
- Protect state-changing HTTP endpoints against Cross-Site Request Forgery (CSRF).

## 3. Secret Management & Database Security
- Keep secret keys, database passwords, and API credentials strictly isolated in `.env.local` files; verify they are listed in `.gitignore`.
- Restrict SQL database access using parameterized queries or ORM abstraction layers to prevent SQL injection attacks.
- Verify backend authorization checks verify user ownership on every resource read or write call.
