# Site — marketing & member suite

**AUDITED:** 2026-08-10 · Browser: `http://localhost:3000` only  
Registry: [`00-README.md`](./00-README.md) · Marketing e2e suite: **TST-S19**

---

## DONE

SITE-S01–S07 · **SITE-S08** · **SITE-S09** · **SITE-S10** · SITE-S11 · **SITE-S12** · SITE-S14 · **SITE-S17** · **SITE-S18**

**SITE-S12 (2026-08-10):** Responsive audit marketing/site only (`--scope=marketing`). First pass 46/48 OK; offenders: `/offline/` (intentional no chrome — audit exempted) and PDP chips/labels at **10px** (`pdp-chip`, `pdp-card-label`, catalog pills). FOCSS → `--type-tiny-size` (11px). Residual recheck: offline + `/products/seating/arvo/` **OK**. Evidence: `results/site/responsive-audit-marketing.txt`. typecheck + `verify:focss` green.

**SITE-S10 / S08–S09 / S17 / S18:** closed earlier this day (see prior notes + `results/site-slice-close-evidence.txt` / marquee eager load).

**Removed dup:** SITE-S13→TST-S19

---

## OPEN

| ID | Pri | Seam | Red → green | Deps |
|----|-----|------|-------------|------|
| **SITE-S15** | P1 | i18n locale switch e2e | locale switcher UI | — |
| **SITE-S16** | P1 | enquiry → staff notification | API/service wire | DB-S06 |

---

## Paths

`site/app/(site)/` · `site/focss/site/` · `scripts/responsive-audit.mjs` · `results/site/responsive-audit-marketing.txt`
