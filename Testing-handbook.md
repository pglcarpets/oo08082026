# Testing handbook

`AGENTS.md` · `package.json`. Blockers → [`Failures.md`](./Failures.md).

## Rules

- Fresh output only. Old `results/` prove nothing. Unit ≠ browser.
- No hidden skips / forced clicks. Name timeout causes.
- Don’t mutate real catalog data; clean up always.
- `pnpm` from root. Output → `results/` only.

**Report:** command · cwd · scope · exit · not verified · blockers.  
**Browser +:** route · journey · console · failed requests · a11y · traces.

## Commands

| | `pnpm run …` |
|--|-------------|
| Layout / docs | `check:layout` · `check:docs-all` · `docs:check:root-links` |
| Types | `typecheck` · `typecheck:tests` |
| Tests / gates | `test` (**2 lanes**) · `p0:unit` · `gate` · `release:gate` |
| Fork / audits | `scan:boundaries` · `test:audit:hollow` · `fake-test` · `gate-skips` |
| Ops | `ops list` · `ops test:e2e:nav` · `ops scan:secrets` · `ops db:apply` |

Lint: `lint` (oxlint) · `lint:ui:strict`. DOM: **happy-dom**.  
PowerShell stderr ≠ fail — trust exit code.

### Two lanes

`pnpm run test` = default + tech-docs. Check **both** or:

```text
results/tests/vitest-results.json
results/tests/vitest-tech-docs-results.json
```

```powershell
pnpm exec vitest run --config tests/vitest.config.ts <file>
pnpm exec vitest run --config tests/vitest.tech-docs.config.ts
pnpm exec playwright test -c config/build/playwright.config.ts <spec> --reporter=list
pnpm --filter oando-tech-docs test
```

Vitest `root` = `site/` → `cwd` inside tests is under `site/`. Harness: `config/build/`.

## Live DB (skips if env missing)

| Suite | Env |
|-------|-----|
| `plannerHandoffsRlsPolicy` | `SUPABASE_AUTH_DATABASE_URL` |
| `serviceRoleOnlyTables.db` | + `PRODUCTS_DATABASE_URL` |
| `*.supabase.db.smoke` | `NEXT_ADMIN_SUPABASE_URL` + `SUPABASE_ADMIN_SERVICE_ROLE_KEY` |

## Persistence in tests

`DEV_AUTH_BYPASS=true` (not `"1"`) → modes = **supabase**. Disk tests mock:

```ts
vi.mock("@planner/lib/plannerPersistenceMode", () => ({
  getPlannerPersistenceMode: () => "disk",
  isPlannerPersistenceConfigured: () => true,
}));
```

Don’t assign `process.env.NODE_ENV` — pass env bags.
