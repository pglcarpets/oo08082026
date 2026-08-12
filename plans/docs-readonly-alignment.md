# Documentation read-only alignment — remaining work

**Scope:** Root `*.md`, `Agents/*.md`, `docs/**/*.md`  
**Authority:** `AGENTS.md` §5  
**Date:** 2026-08-12  
**Status:** All items executed  
**Placement:** `plans/*.md` (flat)

---

## Executed changes summary

### Genuinely weak documents — fixed

- ✅ `docs/governance/rules.md` — Added **E5 — Read-only production** programme rule
- ✅ `docs/database/schema.md` — Marked `furniture_catalog` and `block_descriptors` as **LEGACY MIRROR — Admin DB is sole write target**; added read-only note

### All remaining changes executed

- ✅ `docs/architecture/stack.md` — Fixed path prefixes, added read-only note
- ✅ `docs/architecture/routes.md` — Added mutating-routes warning
- ✅ `docs/architecture/css.md` — Added read-only note about generated output
- ✅ `docs/database/ops.md` — Fixed path prefixes, added "What happens if you get this wrong" section
- ✅ `docs/governance/charter.md` — Added staleness banner to Task 0
- ✅ `docs/governance/benchmarks.md` — Moved §6 to `plans/benchmark-instruments.md`
- ✅ `docs/governance/focss-stop-drift.md` — Added read-only filesystem cross-reference in §2 Scope
- ✅ `scripts/general/check-plans-purity.mjs` — Added `benchmark-instruments.md` to allowed plan docs

### Structural suggestions — partially addressed

- Standardize environment table across files: **deferred** — high effort, low immediate value
- Embed live verification commands: **partially done** (added to `OPERATIONS_RUNBOOK.md`)
- Hyperlink remaining selector mentions: **deferred** — high touch, low value
- Add "New Route Handler Checklist" to `Agents/01-standard.md`: **deferred** — rule already stated clearly in `AGENTS.md` §5

---

**All critical fixes complete. Gates pass.**
