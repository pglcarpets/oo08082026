# Site — marketing & member suite

**AUDITED:** 2026-08-09 · Browser: `http://localhost:3000` only  
Registry: [`00-README.md`](./00-README.md) · Marketing e2e suite: **TST-S19**

---

## DONE

SITE-S01–S07 (hydration/console) · SITE-S11 (theme API) · SITE-S14 (verify:focss)

**Removed dup:** SITE-S13→TST-S19

---

## OPEN

| ID | Pri | Seam | Red → green | Deps |
|----|-----|------|-------------|------|
| **SITE-S08** | P1 | Assistant launcher @390px | FOCSS / UnifiedAssistant | S12 |
| **SITE-S09** | P1 | Assistant header overflow @390px | header CSS | S08 |
| **SITE-S10** | P1 | `/trusted-by` navigation abort | route/redirect | — |
| **SITE-S12** | P1 | responsive-audit **site/marketing** routes | FOCSS per fail | CHK-S05 |
| **SITE-S15** | P1 | i18n locale switch e2e | locale switcher UI | — |
| **SITE-S16** | P1 | enquiry → staff notification | API/service wire | DB-S06 |
| **SITE-S17** | P2 | empty homepage headings | i18n/CMS keys | — |
| **SITE-S18** | P2 | lazy images never load on scroll | image component | S01 |

---

## Paths

`site/app/(site)/` · `site/focss/site/` · `results/console-audit/errors.json` · `agent-reports/marketing-ledger.md`
