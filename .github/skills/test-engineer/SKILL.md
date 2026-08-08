---
name: test-engineer
description: Design and execute unit, integration, and E2E test suites using Vitest and Playwright. Trigger when writing tests, debugging test failures, or adding test coverage.
---

# Test Engineer Skill Instructions

When writing or debugging test suites (unit, integration, or browser E2E), follow these testing standards:

## 1. Test Architecture & Clean Isolation
- Write self-contained tests that establish explicit setup and cleanup steps without depending on execution order.
- Mock external APIs, database connections, and file system operations using controlled test fixtures.
- Keep assertions targeted and single-purpose per test block for actionable failure logs.

## 2. Vitest & Unit/Integration Testing
- Ensure test files match designated naming conventions (`*.test.ts`, `*.spec.ts`).
- Verify mock implementations match exact function signatures and return promises when testing async calls.
- Inspect test logs directly upon failure before making changes; do not swallow errors or skip broken assertions.

## 3. Playwright & E2E Testing
- Target elements using accessible selectors (`getByRole`, `getByText`, `getByTestId`) rather than brittle CSS paths.
- Ensure page load conditions and animations settle before executing interaction triggers.
- For host-bound authentication or cookies, run against `http://localhost:3000`.

## 4. Verification Workflow
- Always run the relevant test runner command (`pnpm run test` or `vitest`) to verify fixes before finalizing code updates.
- Check all output lanes in multi-suite setups to confirm overall test suite status.
