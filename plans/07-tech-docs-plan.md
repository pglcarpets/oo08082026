# Tech-docs plan — AUDITED 2026-08-08

**Status:** PARTIAL — tech-docs Vitest lane green (195 tests) and package gate green; snapshot seam included in lane; production host blocked by F3 DNS.
**Owner / when to use:** Anyone changing `tech-docs-generator/`, snapshot data, or docs deployment.
**Related:** [`Failures.md`](../Failures.md) (F3) · [03-ops-deploy-plan.md](./03-ops-deploy-plan.md) · [04-database-plan.md](./04-database-plan.md) · [`HANDOVER.md`](../HANDOVER.md) · `tech-docs-generator/00-README.md` · `docs/architecture/tech-docs-link.md`

**App:** `tech-docs-generator/` · **Prod target:** `docs.oando.co.in` (currently NXDOMAIN — F3)

---

## Goal

Internal tech stack documentation stays source-backed: generated inventory from lockfile, live database table summaries, and **active blockers** mirrored from [`Failures.md`](../Failures.md). "Done" means `pnpm --filter oando-tech-docs gate` green and snapshot tests passing with artifacts in `results/tech-docs/`.

---

## Who does what

| Role | Responsibility |
|------|----------------|
| Docs maintainer | Snapshot seam (C1), tech-docs Vitest lane |
| Infra owner | F3 DNS + docs deploy ([03-ops-deploy-plan.md](./03-ops-deploy-plan.md)) |
| Any developer | Update `activeBlockers.ts` when F-rows change |

---

## Current state

| Item | Evidence | Verdict |
|------|----------|---------|
| C1 snapshot validation | `tech-docs-generator/src/data/snapshot.ts` throws on bad JSON | **CODE EXISTS — not re-proven 2026-08-08** |
| `techStack.ts` consumes validated data | Wired to snapshot module | **ASSUMED — needs test run** |
| `snapshot.test.ts` (~17 tests) | Included in tech-docs lane; `results/tests/vitest-tech-docs-results.json` shows 195 passed | **GREEN — verified 2026-08-08** |
| `oando-tech-docs gate` | Included in root `pnpm run test` tech-docs lane; 195 tests passed | **GREEN — verified 2026-08-08** |
| Tech Stack → Database boundaries | Admin vs Products IDs documented | **DOC UPDATE 2026-08-08** |
| Tech Stack → Active blockers | Mirrors `Failures.md` via `activeBlockers.ts` | **WIRED — verify on F3 change** |
| `docs.oando.co.in` | F3 NXDOMAIN | **BLOCKED — [03-ops-deploy-plan.md](./03-ops-deploy-plan.md)** |

---

## Step-by-step instructions

1. **Snapshot unit tests**
   ```powershell
   pnpm exec vitest run --config tests/vitest.tech-docs.config.ts `
     tests/tech-docs-generator/snapshot.test.ts
   ```
   **Expect:** ~17 passed, exit 0. **If fail:** fix `tech-docs-generator/src/data/snapshot.ts` or snapshot JSON source; tests must throw on invalid data.

2. **Tech-docs package gate**
   ```powershell
   pnpm --filter oando-tech-docs gate
   ```
   **Expect:** exit 0 (lint, typecheck, tests for package). **If fail:** read package `package.json` scripts for exact chain.

3. **Full repo tech-docs lane** (included in root `pnpm run test`)
   ```powershell
   pnpm run test
   ```
   **Expect:** tech-docs lane summary in `results/tests/summary.json` with `failed: 0`. See [02-testing-plan.md](./02-testing-plan.md).

4. **Verify blocker mirror** — when editing [`Failures.md`](../Failures.md):
   - Update `tech-docs-generator/src/data/activeBlockers.ts` to match.
   - Re-run snapshot tests.

5. **Local preview** (before DNS)
   ```powershell
   pnpm --filter oando-tech-docs dev
   ```
   Open the URL printed in terminal; confirm Database page shows two-project table and Active blockers section.

6. **Production deploy** (after F3 closed)
   - Follow `docs/architecture/tech-docs-link.md`.
   ```powershell
   curl.exe -sI https://docs.oando.co.in
   ```
   **Expect:** 200. Remove F3 only with DNS proof.

Save artifacts: `results/tech-docs/snapshot-test.log`, gate output on same commit as code.

---

## Verification checklist

- [ ] `snapshot.test.ts` — all pass under `vitest.tech-docs.config.ts`
- [ ] `pnpm --filter oando-tech-docs gate` — exit 0
- [ ] Tech-docs lane in `pnpm run test` — `failed: 0`
- [ ] Database boundaries page — Admin `rxzpznmxbaoxpikowmfc` vs Products `erpweaiypimorcunaimz`
- [ ] Active blockers match [`Failures.md`](../Failures.md)
- [ ] `docs.oando.co.in` — 200 after F3 DNS (production)
- [ ] Dated `results/tech-docs/*` before marking COMPLETE

---

## Open items

1. **P0:** F3 — docs DNS ([03-ops-deploy-plan.md](./03-ops-deploy-plan.md)).
2. **P1:** Re-run `snapshot.test.ts` in isolation with dedicated artifact under `results/tech-docs/` (lane green, but isolate artifact for completeness).
3. **P2:** Ship docs host separately per `docs/architecture/tech-docs-link.md` after DNS.

---

## Key paths & commands

| Item | Path / command |
|------|----------------|
| Generator app | `tech-docs-generator/` |
| Snapshot loader | `tech-docs-generator/src/data/snapshot.ts` |
| Tech stack data | `tech-docs-generator/src/data/techStack.ts` |
| Active blockers | `tech-docs-generator/src/data/activeBlockers.ts` |
| Snapshot tests | `tests/tech-docs-generator/snapshot.test.ts` |
| Vitest config | `tests/vitest.tech-docs.config.ts` |
| Package gate | `pnpm --filter oando-tech-docs gate` |
| Package dev | `pnpm --filter oando-tech-docs dev` |
| Docs deploy doc | `docs/architecture/tech-docs-link.md` |

*Blockers: [`Failures.md`](../Failures.md) only. Do not claim COMPLETE without dated `results/tech-docs/` on `main`.*
