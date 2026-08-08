# scripts/general — gate-critical scripts only

**Purpose:** Install, layout, release-gate, build/start env, and docs-sync generators that the product loop depends on. Keep day-to-day noise out of this folder.

**Not here:** one-shots (`scripts/AsNeeded/`), seed/db helpers, and bulk audits not on the gate path. Root `probe-*.mts` scripts were removed 2026-08-02.

**"Protected" meant gate-critical, not read-only.** These scripts are edited like any other; the bar is membership — only gate entrypoints belong here. Renamed from `scripts/PROTECTED/` on 2026-07-28 because the old name was read as "do not touch" and cost at least one checker fix.

Run from **repo root**:

```powershell
pnpm run ops <name> [-- args]
# examples:
pnpm run ops db:apply -- --dry
pnpm run ops list
```

## Inventory

### Install / layout / gate purity

| Basename | Why protected |
|----------|----------------|
| `guard-workspace-install.mjs` | `preinstall` — block npm/yarn inside workspace packages |
| `cleanup-nested-installs.mjs` | `postinstall` — strip nested installs/locks |
| `check-repo-layout.mjs` | `check:layout` + release gates — required/forbidden layout |
| `check-failures.mjs` | `check:failures` / `gate` — Failures.md purity |
| `check-agents-md.mjs` | `check:agents-md` / `gate` |
| `check-agents-folder.mjs` | `check:agents-folder` / `gate` |
| `check-active-docs.mjs` | `check:active-docs` / `gate` |
| `check-plans-purity.mjs` | `check:plans-purity` / `gate` |
| `check-docs-purity.mjs` | `check:docs-purity` / `gate` |
| `check-root-markdown-links.mjs` | `docs:check:root-links` |
| `check-test-layout.mjs` | `test:layout:check` — name-mirror layout |

### Build / start / env

| Basename | Why protected |
|----------|----------------|
| `check-sharp.js` | `check-sharp` / `build` — sharp resolve |
| `prepare-standalone.cjs` | `build` post-step — standalone static/public |
| `startStandalone.cjs` | `start` — standalone server |
| `loadEnvLocal.cjs` | Root/site `.env.local` loader (drizzle, seed, DB, Playwright, Next) |
| `validate-launch-env.mjs` | `launch:env` / `release:gate:fast` |

### Release audits (on release:gate / release:gate:fast)

| Basename | Why protected |
|----------|----------------|
| `audit-hollow-tests.mjs` | `test:audit:hollow` — all `tests/**` |
| `tech-docs-generator/scripts/fake-test-audit.mjs` | `test:audit:fake-test` + `tech-docs:gate` — tech-docs lane |
| `audit-gate-skips.mjs` | `test:audit:gate-skips` |
| `audit-eslint-disable.mjs` | `test:audit:eslint-disable` |
| `audit-api-route-safety.mjs` | `test:audit:api-routes` |
| `scan_secrets.mjs` | `scan:secrets` |
| `lint-ui-contract.mjs` | `lint:ui` / `lint:ui:strict` |
| `run-oxlint.mjs` | `lint` / `lint:fix` / `lint:type-aware` — folders sequentially: `site` → `tests` → `tech-docs-generator` → `scripts` → `config` |

### Docs generators (docs:sync*)

| Basename | Why protected |
|----------|----------------|
| `generate-docs.mjs` | `docs:sync`, `docs:sync:all`, `docs:check*` orchestrator |
| `generate-test-inventory.mjs` | Test inventory + migration map |
| `generate-route-index.mjs` | `docs:sync:routes` / API ROUTE-INDEX |

## Protected-by-policy but path-stable (left at `scripts/` root)

These stay at **`scripts/generate-svg.mjs`** and **`scripts/generate-svg/`** so product imports, tests, and publish pipelines do not need a massive rewire:

| Path | Why not moved |
|------|----------------|
| `scripts/generate-svg.mjs` | Product + tests import this path; publish authority entry |
| `scripts/generate-svg/pipelineCore.ts` | Imported by planner SVG compile stages |
| `scripts/generate-svg/svgo.config.cjs` | Server sanitizer config |
| `scripts/generate-svg/_fixtures/*` | `p0:svg` + unit goldens |
| `scripts/generate-svg/__goldens__/*` | Snapshot goldens |

Treat them as **gate/publish critical** even though they are not under `scripts/general/`.

## Rules

1. Only basenames listed above (or explicitly promoted by owner) live here.
2. Root `package.json` must reference `scripts/general/<basename>` for these files.
3. Shared helpers that are not gate entrypoints stay in `scripts/lib/` (e.g. `repoRoot.mjs`).
4. Do **not** put AsNeeded one-shots or seed/db bulk tools here. Root probe scripts are gone — do not reintroduce them under `scripts/general/`.
