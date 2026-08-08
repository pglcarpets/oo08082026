# Testing Handbook

Root testing reference. Use together with `AGENTS.md`, `README.md`, and `package.json`.

## Core Rules
- Fresh command output wins.
- Old reports and old `results/` files prove nothing.
- Unit green is **not** browser proof.
- UI claims require browser proof.
- No hidden skips.
- No forced clicks.
- Do not raise timeouts without naming the cause.
- Tests must never mutate canonical catalog or real product data.
- Clean up test data even on failure.
- Use `pnpm` from repo root.
- Never install inside `site/` or `tech-docs-generator/`.
- Store raw output under root `results/`.
- Never write test output under `site/results/` or `site/test-results/`.

## Report Requirements
Always report:
- Command
- Working directory (cwd)
- Scope
- Exit code
- What was not verified
- Any blockers

For browser checks also report:
- Route
- Journey
- Console errors
- Failed requests
- Accessibility result
- Trace / screenshots

## Core Commands (run from repo root)

**Root scripts** — daily dev and gates. **Ops** — everything else (`pnpm run ops list`).

| Need              | Command                              |
|-------------------|--------------------------------------|
| Layout            | `pnpm run check:layout`              |
| Docs + handbooks  | `pnpm run check:docs-all`            |
| Root links        | `pnpm run docs:check:root-links`     |
| Typecheck         | `pnpm run typecheck`                 |
| Typecheck tests   | `pnpm run typecheck:tests`           |
| Unit tests        | `pnpm run test` (**two lanes** — see below) |
| P0 smoke          | `pnpm run p0:unit` / `pnpm run ops p0:svg` |
| Build             | `pnpm run build`                     |
| Fast gate         | `pnpm run gate`                      |
| Release gate      | `pnpm run release:gate`              |
| Secrets           | `pnpm run ops scan:secrets` / `pnpm run ops lint:secrets` |
| Boundaries (fork) | `pnpm run scan:boundaries`           |
| Hollow tests      | `pnpm run test:audit:hollow`         |
| Fake tests (tech-docs) | `pnpm run test:audit:fake-test` |
| Gate skips        | `pnpm run test:audit:gate-skips`     |
| Focused e2e       | `pnpm run ops test:e2e:nav` (see `ops list`) |
| Db / backup       | `pnpm run ops db:apply` · `pnpm run ops list` |

Root lint is **oxlint** via `pnpm run lint` (config `.oxlintrc.json`). The
runner lints `site`, then `tests`, then `tech-docs-generator`, then `scripts`,
then `config` one folder at a time (see `scripts/general/run-oxlint.mjs`;
ignores via `.oxlintrc.json`).
`pnpm run lint:ui:strict` enforces the UI package contract; type-aware lint:
`pnpm run ops lint:type-aware`.
DOM unit tests use **happy-dom** (not jsdom).

**PowerShell note:** Next/pnpm often write warnings to stderr (e.g. Edge runtime
deprecation, `$ node …` script echo). PowerShell may wrap those as
`NativeCommandError` even when the command exits 0. Trust the final exit code /
summary line, not the red stderr banner.

**next-intl / build:** plugin path is `./i18n/request.ts`. Real config lives in
`site/i18n/request.ts`; root `i18n/request.ts` is a one-line re-export so
validation works when `process.cwd()` is the monorepo root.

### `pnpm run test` runs two lanes

`scripts/run-full-vitest.mjs` spawns vitest twice: the **default** lane and the
**tech-docs** lane. Each prints its own summary, and only the last one survives a
`| tail`. Reading one summary and calling the suite green is a reporting error —
check both, or read the JSON:

```powershell
# results/tests/vitest-results.json            <- default lane
# results/tests/vitest-tech-docs-results.json  <- tech-docs lane
```

Current state: check both lane summaries (or the JSON reports under `results/tests/`).
Blockers: `Failures.md` — note P0-1–P0-3 and F3 are deploy blockers (Worker origin / apex
catalog / docs DNS) as of 2026-08-08, not test-lane blockers; `session.test.ts`
passed 10/10 on 2026-08-08.

Use the **smallest command** that proves the claim.  
Do not run broad gates for tiny changes.

## Focused Tests
```powershell
# Product package is the repo root (name: ooplanner-oostudio), not oando-site.
pnpm exec vitest run --config tests/vitest.config.ts <test-file>
pnpm exec vitest run --config tests/vitest.tech-docs.config.ts   # tech-docs lane only
pnpm exec playwright test -c config/build/playwright.config.ts <spec-file> --reporter=list
```

Vitest `root` is `site/`, so `process.cwd()` inside a test resolves under `site/`,
not the repo root.

Tech-docs package (optional):

```powershell
pnpm --filter oando-tech-docs test
pnpm run ops test:tech-docs
```

## Live-database tests

Some suites talk to the real Supabase projects and **skip silently** when the
matching env is absent, so a green local run may have proved less than it looks.

| Suite | Needs |
|-------|-------|
| `tests/unit/platform/plannerHandoffsRlsPolicy.test.ts` | `SUPABASE_AUTH_DATABASE_URL` |
| `tests/unit/platform/serviceRoleOnlyTables.db.test.ts` | `SUPABASE_AUTH_DATABASE_URL`, `PRODUCTS_DATABASE_URL` |
| `tests/unit/lib/Planner/projectsStore.supabase.db.smoke.test.ts` | `NEXT_ADMIN_SUPABASE_URL`, `SUPABASE_ADMIN_SERVICE_ROLE_KEY` |
| `tests/unit/lib/catalog/furnitureCatalogStore.supabase.db.smoke.test.ts` | `NEXT_ADMIN_SUPABASE_URL`, `SUPABASE_ADMIN_SERVICE_ROLE_KEY` |
| `tests/unit/lib/Planner/handoff/createPlannerHandoff.db.smoke.test.ts` | `NEXT_ADMIN_SUPABASE_URL`, `SUPABASE_ADMIN_SERVICE_ROLE_KEY` |

They create and delete their own rows. Never point them at a database whose
contents matter.

## Persistence mode in tests

Vitest sets `DEV_AUTH_BYPASS: "true"` — deliberately not `"1"`, so `withAuth`
gates run for real. A side effect: `getPlannerPersistenceMode()` and
`getFurnitureCatalogMode()` both resolve to **supabase**, and a route test that
mocks the disk helpers will reach the network instead.

Disk-path contract tests must pin the mode:

```ts
vi.mock("@planner/lib/plannerPersistenceMode", () => ({
  getPlannerPersistenceMode: () => "disk",
  isPlannerPersistenceConfigured: () => true,
}));
```

Prefer passing an explicit env bag to helpers that accept one — Next types
`NODE_ENV` read-only, so `process.env.NODE_ENV = …` fails `typecheck:tests`.

## Harness

- `config/build/` holds `playwright.config.ts`, `playwrightBaseURL.cjs`,
  `vitest-console-reporter.ts`, `next.config.js`, `postcss.config.mjs`,
  `tsconfig.json`, and the Playwright spec lists.
- Install first if `node_modules` is missing: `pnpm install` from root.
