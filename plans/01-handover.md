# Handover — session close slices

**AUDITED:** 2026-08-08 · **Scope:** session-close only — no feature work.  
**Related:** [`00-README.md`](./00-README.md) slice registry · [`Failures.md`](../Failures.md).

---

## Session-close vertical slices

### HO-S01 — P0 unit evidence on close

| Field | Value |
|-------|-------|
| **Slice ID** | HO-S01 |
| **Seam** | `SEAM-GATE-P0UNIT` — `pnpm run p0:unit` exit code + `results/tests/vitest-p0-results.json` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Delete or rename `results/tests/vitest-p0-results.json`; run `pnpm run p0:unit` — expect non-zero exit or missing artifact |
| **Green** | Restore green run only if code broke; otherwise re-run: `pnpm run p0:unit` |
| **Evidence** | `pnpm run p0:unit` → `results/tests/vitest-p0-results.json` — **23 files / 146 tests passed** (2026-08-08) |
| **Depends on** | — |
| **Status** | DONE — `results/tests/vitest-p0-results.json` |

---

### HO-S02 — Failures.md row hygiene

| Field | Value |
|-------|-------|
| **Slice ID** | HO-S02 |
| **Seam** | [`Failures.md`](../Failures.md) table rows — evidence column must cite `results/` path |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Add a row with fake evidence path; run `node scripts/general/check-failures.mjs` (via `check:docs-all`) — expect fail if checker validates paths |
| **Green** | Remove row or fix evidence to real artifact |
| **Evidence** | `pnpm run check:docs-all` exit 0; **1 active row** in `Failures.md` (F3); resolved table documents P0-1, P1-2, P1-3, P1-4 |
| **Depends on** | — |
| **Status** | DONE — 2026-08-08 |

---

### HO-S03 — Plan AUDITED dates

| Field | Value |
|-------|-------|
| **Slice ID** | HO-S03 |
| **Seam** | `AUDITED YYYY-MM-DD` header in each `plans/*.md` programme file |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Set `AUDITED: 2020-01-01` in one plan; grep registry in `00-README.md` for stale date note |
| **Green** | Bump `AUDITED` to session close date on every touched programme plan |
| **Evidence** | `plans/00-README.md` **AUDITED: 2026-08-08** |
| **Depends on** | Programme slices landed in session |
| **Status** | DONE — 2026-08-08 rewrite |

---

### HO-S04 — Plans purity before close

| Field | Value |
|-------|-------|
| **Slice ID** | HO-S04 |
| **Seam** | `node scripts/general/check-plans-purity.mjs` exit code |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Add `plans/notes.md`; run checker — expect exit 1 |
| **Green** | Remove extra file; flat Markdown only |
| **Evidence** | `node scripts/general/check-plans-purity.mjs` → `check:plans-purity OK` (2026-08-08 rewrite + follow-up) |
| **Depends on** | — |
| **Status** | DONE |

---

### HO-S05 — Active blockers mirror (tech-docs)

| Field | Value |
|-------|-------|
| **Slice ID** | HO-S05 |
| **Seam** | `tech-docs-generator/src/data/activeBlockers.ts` ↔ `Failures.md` IDs |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Change F3 text in `Failures.md` only; run `pnpm exec vitest run --config tests/vitest.tech-docs.config.ts tests/tech-docs-generator/snapshot.test.ts` — expect fail if snapshot asserts blocker text |
| **Green** | Update `activeBlockers.ts` to match; re-run snapshot lane |
| **Evidence** | `activeBlockers.ts` mirrors F3 only; matches `Failures.md` 2026-08-08 |
| **Depends on** | HO-S02 |
| **Status** | DONE |

---

### HO-S06 — Handover status table

| Field | Value |
|-------|-------|
| **Slice ID** | HO-S06 |
| **Seam** | This file + `00-README.md` registry statuses agree |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Mark a DONE slice OPEN in registry without evidence |
| **Green** | Align registry with evidence refs only |
| **Evidence** | `plans/00-README.md` slice registry table |
| **Depends on** | HO-S01, HO-S03, HO-S04, HO-S05 |
| **Status** | PARTIAL — registry synced 2026-08-08; complete when HO-S01 closed |

---

## Blocker → slice map (from `Failures.md` 2026-08-08)

| Failures ID | Slice IDs | Notes |
|-------------|-----------|-------|
| F3 | OPS-S01, TECH-S05 | Active — DNS NXDOMAIN |
| P0-1 | SITE-S01, SITE-S02 | **PARTIAL** — `probeDisk` fix; console audit pending |
| P1-2 | SITE-S11 | **DONE** — preset theme API |
| P1-3 | TST-S20, TST-S21 | **DONE** |
| P1-4 | OPS-S06 | **DONE** |

---

## Quick start (next session)

1. Run [`08-oo-start-checklist.md`](./08-oo-start-checklist.md) (`CHK-S01`–`CHK-S03`).
2. Pick one **OPEN** slice from [`00-README.md`](./00-README.md) registry.
3. Confirm seam checkbox → red → green → evidence in `results/`.
4. Close with `HO-S01`–`HO-S06`.

*Generated: 2026-08-08*
