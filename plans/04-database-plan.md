# Database & persistence

**AUDITED:** 2026-08-12 · Admin `rxzpznmxbaoxpikowmfc` · Products `erpweaiypimorcunaimz`  
Registry: [`00-README.md`](./00-README.md) · Schema: [`docs/database/schema.md`](../docs/database/schema.md) · Audit: [`.archive/audit/00-audit-summary.md`](../.archive/audit/00-audit-summary.md)

**Rules:** mode-aware wrappers only · never dual-write · migrations need `-- rollback`.

---

## DONE

| ID | Note |
|----|------|
| DB-S01 | dry-run: all migrations applied — `results/database/db-apply-admin-dry.txt` |
| DB-S02 | Admin client env + grants re-applied; `GET /api/features/` → `source=supabase+local` — `results/database/feature-flags-grants.txt` |
| DB-S03 | asset-cutover unit + smoke pass |
| DB-S09 | types write UTF-8 (no BOM) |

---

## PARTIAL

| ID | Pri | Seam | Remaining |
|----|-----|------|-----------|
| **DB-S06** | P1 | contact query DB smoke | re-run with Admin keys if needed |

---

## OPEN

| ID | Pri | Seam | Evidence |
|----|-----|------|----------|
| **DB-S04** | P1 | `ops db:types:admin` + typecheck | admin types diff |
| **DB-S05** | P1 | `ops db:types` (Products CLI link) | products types + typecheck |
| **DB-S07** | P1 | retire Products `furniture_catalog` | after OPS-S03 + S05 + S08 |
| **DB-S08** | P1 | Planner save → `oando_plans` (no bypass) | `results/database/planner-supabase-save.txt` |
| **DB-S10** | — | `ops db:test` | `results/database/db-test.txt` |
| **DB-S11** | P2 | DB-1: `POST /api/exports` + `GET /api/files/exports` disk-only; breaks on prod read-only FS | stream export bytes or move to Supabase Storage; no write under app dir on request path (partially addressed by TST-S22 prod 503 — revisit for real storage) |
| **DB-S12** | P3 | DB-2: `customer_queries` anon-insert POLICY but no anon GRANT | add `grant insert … to anon, authenticated` OR fix doc to "service-role insert" |
| **DB-S13** | P3 | DB-3: `docs/database/schema.md` omits `block_descriptors` from Products service-role-only set | add it to the docs list (test pins 4, docs say 3) |

---

## Map / commands

| Data | Dev | Prod |
|------|-----|------|
| Plans | `platform/Planner/data/projects/` | Admin `oando_plans` |
| Furniture | `platform/shared/data/furniture/` | Admin `furniture_catalog` |

`ops db:apply:admin -- --dry` · `ops db:types:admin` · `ops db:types` · `check:governance` (rollback baseline 42)
