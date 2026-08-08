---
name: code-reviewer
description: Conduct comprehensive code reviews covering quality, performance, security, type safety, and lint compliance. Trigger when reviewing code, checking pull requests, or analyzing codebase safety.
---

# Code Reviewer Skill Instructions

When performing code reviews or evaluating code quality, adhere to the following checklist and principles:

## 1. Type Safety & Correctness
- Ensure strict TypeScript typing without standard `any` assertions unless strictly necessary.
- Verify null checks, optional chaining (`?.`), and default values for uninitialized properties.
- Check that function argument signatures match exact caller requirements across all invocation sites.

## 2. Error Handling & Robustness
- Trace failure boundaries and prevent silent exception swallowing.
- Ensure promises and async operations handle rejections gracefully with clear diagnostic messages.
- Verify API handlers fail fast and return accurate HTTP status codes and structured errors.

## 3. Performance & Memory
- Audit loops and heavy computations for unnecessary recalculations or nested lookups.
- Avoid memory leaks by ensuring event listeners, subscriptions, and timers are properly cleaned up.
- Check for unnecessary re-renders in component trees by leveraging state colocation.

## 4. Security & Best Practices
- Verify inputs are properly validated before processing or persisting to database layers.
- Check that secrets and confidential tokens are isolated in `.env.local` files and never committed.
- Verify Row Level Security (RLS) or permission checks guard sensitive data access points.
