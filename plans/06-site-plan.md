# Site — marketing & member suite

**AUDITED:** 2026-08-10 · Browser: `http://localhost:3000` only  
Registry: [`00-README.md`](./00-README.md) · Marketing e2e suite: **TST-S19**

---

## DONE

SITE-S01–S07 (hydration/console) · **SITE-S08** · **SITE-S09** · **SITE-S10** · SITE-S11 (theme API) · SITE-S14 (verify:focss)

**SITE-S10 (2026-08-10):** Route is live (`app/(site)/trusted-by/page.tsx` → 200). Intermittent `net::ERR_ABORTED` came from slashless `/trusted-by` 308 → `/trusted-by/` under `trailingSlash: true`. Canonicalized hrefs; e2e click→hero green.

**SITE-S08 / SITE-S09 (2026-08-10):** UnifiedAssistant at **390×844**.  
- **S08:** Mobile FAB anchors (bottom / raised / panel) clamped into safe area for ≤639.98px; assistant FAB forced to 3rem icon hit target so padding cannot expand past the edge.  
- **S09:** Sheet header is a flex row with gap, `brand`/`brand-text` `min-w-0 flex-1`, title/subtitle ellipsis, close `shrink-0`; overlay/sheet `max-width: 100%` + safe-area.  
Evidence: `pnpm exec playwright test … tests/e2e/site-assistant-shell.spec.ts` **3 passed** (includes `@390` launcher + header asserts). Integration `UnifiedAssistant.test.tsx` green.

**Removed dup:** SITE-S13→TST-S19

---

## OPEN

| ID | Pri | Seam | Red → green | Deps |
|----|-----|------|-------------|------|
| **SITE-S12** | P1 | responsive-audit **site/marketing** routes | FOCSS per fail | CHK-S05 |
| **SITE-S15** | P1 | i18n locale switch e2e | locale switcher UI | — |
| **SITE-S16** | P1 | enquiry → staff notification | API/service wire | DB-S06 |
| **SITE-S17** | P2 | empty homepage headings | i18n/CMS keys | — |
| **SITE-S18** | P2 | lazy images never load on scroll | image component | S01 |

---

## Paths

`site/app/(site)/` · `site/focss/site/` · `site/features/site/assistant/UnifiedAssistant.tsx` · `results/console-audit/errors.json` · `agent-reports/marketing-ledger.md`
