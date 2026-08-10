# Site — marketing & member suite

**AUDITED:** 2026-08-10 · Browser: `http://localhost:3000` only  
Registry: [`00-README.md`](./00-README.md) · Marketing e2e suite: **TST-S19**

---

## DONE

SITE-S01–S07 (hydration/console) · **SITE-S08** · **SITE-S09** · **SITE-S10** · SITE-S11 (theme API) · SITE-S14 (verify:focss) · **SITE-S17** · **SITE-S18**

**SITE-S10 (2026-08-10, re-verified):** Direct `/trusted-by/` → **200**, h1 “Trusted by.”, `trusted-by-hero` visible, no soft 404. In-app glassProof (`href=/trusted-by/`) click lands same. No nav request failures. Evidence: `results/site-slice-close-evidence.txt`.

**SITE-S08 / SITE-S09 (2026-08-10, re-verified @390×844):** Launcher fully in viewport (48×48 @ x=8,y=776). Chat sheet header overflowX=0, close on-canvas, no brand/close overlap. Evidence: same + `tests/e2e/site-assistant-shell.spec.ts` @390.

**SITE-S17 (2026-08-10):** Homepage `h1`–`h3` scan: **20 headings, 0 empty** (hero, collections, tools, why, showcase, contact all have text). Trust strip is KPI-only (`aria-label`, no empty heading node). Showcase empty `label` fields unused (`item.name` only). Evidence: `results/site-slice-close-evidence.txt`.

**SITE-S17 (2026-08-10):** Homepage headings verified — no empty h1–h3; showcase uses `name` (empty `label` fields unused). Marked closed by owner.

**SITE-S18 (2026-08-10):** Footer logo marquee used Next/Image default `loading=lazy` inside a CSS `transform` track (`marquee-left`). Layout boxes never enter the viewport intersection, so logos stayed blank after scroll. Fix: `loading="eager"` + `fetchPriority="low"` on marquee images; `MarketingImage` accepts optional `loading` for the same pattern. Hero LCP stays `priority`. Evidence: after fix, 36/36 marquee logos `complete && naturalWidth>0`; main visible never-loaded = 0.

**Removed dup:** SITE-S13→TST-S19

---

## OPEN

| ID | Pri | Seam | Red → green | Deps |
|----|-----|------|-------------|------|
| **SITE-S12** | P1 | responsive-audit **site/marketing** routes | FOCSS per fail | CHK-S05 |
| **SITE-S15** | P1 | i18n locale switch e2e | locale switcher UI | — |
| **SITE-S16** | P1 | enquiry → staff notification | API/service wire | DB-S06 |

---

## Paths

`site/app/(site)/` · `site/focss/site/` · `site/features/site/assistant/UnifiedAssistant.tsx` · `results/console-audit/errors.json` · `agent-reports/marketing-ledger.md`
