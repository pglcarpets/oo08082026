# Testing

## Bar
- Root `AGENTS.md` + `Testing-handbook.md` win.
- Prefer focused tests during work; broad gates when shipping.
- No hollow tests. No inventing PASS from missing coverage.

## Commands (repo root)
- Unit/integration: `pnpm exec vitest run --config tests/vitest.config.ts …`
- tech-docs lane: `pnpm exec vitest run --config tests/vitest.tech-docs.config.ts` or `pnpm run ops test:tech-docs`
- Lint: `pnpm run lint` (oxlint: `site` → `tests` → `tech-docs-generator` → `scripts` → `config`)
- Fast gate: `pnpm run gate`
- Full ship gate: `pnpm run release:gate`
- Tech-docs CI gate: `pnpm run tech-docs:gate`
- Focused e2e / db / backup: `pnpm run ops list`

`pnpm run test` runs **both lanes**. Each prints its own summary and only the last
survives a `| tail` — read both, or the two JSON files under `results/tests/`.

## Rules
- Mock external systems; do not hit production secrets in unit tests.
- Secret API keys must not run under a browser test environment (use `@vitest-environment node` or mocks).
- E2E: Playwright under `tests/e2e/`; browser only `http://localhost:3000`.

## Persistence mode in tests

Vitest sets `DEV_AUTH_BYPASS: "true"` — not `"1"` — so `withAuth` gates run for
real **and** both persistence selectors resolve to `supabase`. A route test that
mocks only the disk helpers will reach the network. Disk-path contract tests must
pin the mode with `vi.mock` on `plannerPersistenceMode` / `furnitureCatalogMode`.

> **Why this matters:** Production uses a read-only filesystem — disk-mocked tests
> prove nothing about the live write path. Always verify the Supabase path for
> mutating routes.

Live-DB smoke suites (`*.db.smoke.test.ts`, `serviceRoleOnlyTables.db.test.ts`)
**skip silently** without service env — a green run may have proved less than it
looks. Detail: `Testing-handbook.md`.

## VS Code Customization

When editing files under `tests/`, VS Code Copilot automatically loads
[`.github/instructions/testing.instructions.md`](../.github/instructions/testing.instructions.md)
with test conventions, persistence-mode mocking, and two-lane awareness.

Scaffold new tests by copying the nearest existing neighbour under `tests/`;
run gates via `pnpm run gate` / `pnpm run release:gate` (no `/new-test` or
`/gate` commands exist).
