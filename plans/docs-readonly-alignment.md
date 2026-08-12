# Documentation read-only alignment — remaining work

**Scope:** Root `*.md`, `Agents/*.md`, `docs/**/*.md`  
**Authority:** `AGENTS.md` §5  
**Date:** 2026-08-12  
**Status:** 20 items executed, 11 open (see §2)  
**Placement:** `plans/*.md` (flat)

---

## 1. Genuinely weak documents — still open

### 1.1 `docs/governance/rules.md` — Authority claim with a binding gap
It states *"This document is the only place programme rules live; a programme rule stated anywhere else and not here is not binding."* The read-only filesystem rule is in `AGENTS.md` and `charter.md` but **nowhere in `rules.md`**. Per its own logic, it is not binding.

**Fix:** Add an explicit programme rule: "Production filesystem is read-only. All runtime writes must route through mode-aware wrappers. Raw disk helpers and dual-write are forbidden in production paths."

### 1.2 `docs/database/schema.md` — Dual-listed migrated tables
`furniture_catalog` and `block_descriptors` appear in both Products DB and Admin DB tables. The parenthetical "listed here while the legacy Products copy exists" buries the authority question.

**Fix:** In the Products DB table, mark both as **LEGACY MIRROR — Admin DB is sole write target**.

---

## 2. Remaining open changes

### `docs/architecture/stack.md`
- Fix path prefix: `platform/shared/data/furniture/` → `site/platform/shared/data/furniture/`
- Add read-only filesystem note in §5

### `docs/architecture/routes.md`
- Add mutating-routes warning in §Notes

### `docs/architecture/css.md`
- Add read-only note about generated output (`results/` is evidence only)

### `docs/database/ops.md`
- Fix path prefixes in §Persistence modes table
- Add "What happens if you get this wrong" section explaining quiet EROFS failure mode

### `docs/database/schema.md`
- Clarify migrated tables authority (see §1.2 above)
- Add read-only filesystem note near top

### `docs/governance/rules.md`
- Add explicit read-only persistence programme rule (see §1.1 above)

### `docs/governance/charter.md`
- Add staleness banner to Task 0 (historical baseline marker)

### `docs/governance/benchmarks.md`
- Move §6 "Changes this document requires" to a plan file (violates DOC-MAP placement)

### `docs/governance/focss-stop-drift.md`
- Add cross-reference to read-only filesystem in §2 Scope

---

## 3. Structural suggestions (all open)

- Standardize the `DEV_AUTH_BYPASS=1` / non-prod / read-only table across all files
- Embed live verification commands in every doc that mentions persistence
- Hyperlink every remaining selector mention to source
- Add a "New Route Handler Checklist" to `Agents/01-standard.md`
