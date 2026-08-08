# Tech-docs plan — vertical slices

**AUDITED:** 2026-08-08 · **App:** `tech-docs-generator/` · **Prod:** `docs.oando.co.in` (F3 blocked).  
**Related:** [`docs/architecture/tech-docs-link.md`](../docs/architecture/tech-docs-link.md) · [`07-tech-docs-plan.md`](./07-tech-docs-plan.md).

---

## DONE slices

### TECH-S02 — Package gate

| Field | Value |
|-------|-------|
| **Slice ID** | TECH-S02 |
| **Seam** | `pnpm --filter oando-tech-docs gate` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | _(completed)_ |
| **Green** | _(completed)_ |
| **Evidence** | Included in tech-docs Vitest lane; exit 0 (2026-08-08) |
| **Depends on** | — |
| **Status** | DONE |

### TECH-S03 — Root test lane includes tech-docs

| Field | Value |
|-------|-------|
| **Slice ID** | TECH-S03 |
| **Seam** | `pnpm run test` → `results/tests/summary.json` lane `tech-docs` `failed:0` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | _(completed)_ |
| **Green** | _(completed)_ |
| **Evidence** | **195 tests passed** in `vitest-tech-docs-results.json` |
| **Depends on** | — |
| **Status** | DONE |

### TECH-S06 — Database boundaries page

| Field | Value |
|-------|-------|
| **Slice ID** | TECH-S06 |
| **Seam** | Tech-docs UI shows Admin `rxzpznmxbaoxpikowmfc` vs Products `erpweaiypimorcunaimz` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | _(completed)_ |
| **Green** | _(completed)_ |
| **Evidence** | Doc update 2026-08-08 in architecture docs |
| **Depends on** | — |
| **Status** | DONE |

---

## PARTIAL slices

### TECH-S01 — Snapshot test isolate artifact (P1)

| Field | Value |
|-------|-------|
| **Slice ID** | TECH-S01 |
| **Seam** | `SEAM-TECH-SNAPSHOT` — `tests/tech-docs-generator/snapshot.test.ts` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Break `tech-docs-generator/src/data/snapshot.ts` validation — tests fail |
| **Green** | Fix snapshot loader throw on bad JSON |
| **Evidence** | Lane green; **dedicated** `results/tech-docs/snapshot-test.log` still missing |
| **Depends on** | — |
| **Status** | PARTIAL — lane GREEN; isolate artifact OPEN |

---

## OPEN slices

### TECH-S04 — activeBlockers mirror Failures.md

| Field | Value |
|-------|-------|
| **Slice ID** | TECH-S04 |
| **Seam** | `tech-docs-generator/src/data/activeBlockers.ts` IDs match `Failures.md` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | Stale multi-row mirror vs single F3 row |
| **Green** | Sync `activeBlockers.ts` to `Failures.md` (F3 only) |
| **Evidence** | `activeBlockers.ts` + `Failures.md` aligned 2026-08-08; HO-S05 |
| **Depends on** | HO-S02 |
| **Status** | DONE |

### TECH-S05 — Production docs host after F3 (P0)

| Field | Value |
|-------|-------|
| **Slice ID** | TECH-S05 |
| **Seam** | `curl.exe -sI https://docs.oando.co.in` → 200 |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | NXDOMAIN / non-200 |
| **Green** | Complete OPS-S01; deploy per `tech-docs-link.md` |
| **Evidence** | `results/tech-docs/prod-curl.txt` |
| **Depends on** | OPS-S01 |
| **Status** | OPEN — `Failures.md` F3 |

---

## Key commands

| Command | Purpose |
|---------|---------|
| `pnpm exec vitest run --config tests/vitest.tech-docs.config.ts tests/tech-docs-generator/snapshot.test.ts` | Snapshot seam |
| `pnpm --filter oando-tech-docs dev` | Local preview (:3001 typical) |
| `pnpm --filter oando-tech-docs gate` | Package gate |

*Blockers: [`Failures.md`](../Failures.md) only.*
