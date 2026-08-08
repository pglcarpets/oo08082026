---
applyTo: "tests/**/*.{ts,tsx}"
description: "Testing conventions for Vitest and Playwright - applies when editing test files"
---

# Testing Conventions

## Test Structure

- **Unit/Integration**: `tests/unit/` and `tests/integration/` using Vitest
- **E2E**: `tests/e2e/` using Playwright
- **Two test lanes**: default config + tech-docs config (both run with `pnpm run test`)

## Critical Rules

### Persistence Mode in Tests

Vitest sets `DEV_AUTH_BYPASS: "true"` (not `"1"`), so:
- `withAuth` gates run for real
- Both persistence selectors resolve to **Supabase** (not disk)
- Route tests that mock only disk helpers will reach the network
- Disk-path contract tests must pin mode with `vi.mock` on:
  - `plannerPersistenceMode`
  - `furnitureCatalogMode`

### DOM Environment

- Unit tests use **happy-dom** (not jsdom)
- Secret API keys must use `@vitest-environment node` or mocks
- Never hit production secrets in unit tests

### Test Commands

```bash
# Unit/integration (specific test)
pnpm exec vitest run --config tests/vitest.config.ts path/to/test.ts

# Full suite (both lanes)
pnpm run test

# Tech-docs lane only
pnpm exec vitest run --config tests/vitest.tech-docs.config.ts

# E2E (Playwright)
pnpm exec playwright test -c config/build/playwright.config.ts

# Fast gate
pnpm run gate
```

## Evidence Rules

- `pnpm run test` prints **two** lane summaries - read both
- Calling a failure pre-existing requires a baseline run at prior commit
- No hollow tests (tests that pass without exercising real behavior)
- Live-DB smoke suites (`*.db.smoke.test.ts`) skip silently without service env

## File Naming

- Unit: `*.test.ts` or `*.test.tsx`
- E2E: `*.spec.ts`
- DB smoke: `*.db.smoke.test.ts`

## References

- Testing handbook: [`Testing-handbook.md`](../../Testing-handbook.md)
- Agent testing guide: [`Agents/02-testing.md`](../../Agents/02-testing.md)
- Browser/E2E: [`Agents/03-browser.md`](../../Agents/03-browser.md)
