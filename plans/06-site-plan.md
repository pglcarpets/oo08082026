# Site — marketing & member suite

**AUDITED:** 2026-08-12 · Browser: `http://localhost:3000` only  
Registry: [`00-README.md`](./00-README.md) · Audit: [`.archive/audit/00-audit-summary.md`](../.archive/audit/00-audit-summary.md) · Marketing e2e suite: **TST-S19**

---

## DONE

SITE-S01–S07 · **SITE-S08** · **SITE-S09** · **SITE-S10** · SITE-S11 · **SITE-S12** · **SITE-S14** · **SITE-S15** · **SITE-S16** · **SITE-S17** · **SITE-S18**

**SITE-S15 (2026-08-10):** Existing footer locale switcher E2E selects supported Hindi, verifies translated visible copy after reload, URL stability, and no page crash. `tests/e2e/site-locale-switch.spec.ts` — **2 passed**. `typecheck` + `typecheck:tests` green.

**SITE-S16 (2026-08-10):** Existing contact/enquiry path inserts `customer_queries` then invokes the existing Resend staff notifier; notification failure remains non-fatal after commit. Focused contact/action/notifier tests plus live Admin-key DB smoke — **19 passed**. Evidence: `tests/unit/features/site/contact/`, `tests/unit/lib/email/sendStaffQueryNotification.test.ts`, `tests/unit/features/site/contact/createCustomerQuery.db.smoke.test.ts`.

**SITE-S12 (2026-08-10):** Responsive audit marketing/site only (`--scope=marketing`). First pass 46/48 OK; offenders: `/offline/` (intentional no chrome — audit exempted) and PDP chips/labels at **10px** (`pdp-chip`, `pdp-card-label`, catalog pills). FOCSS → `--type-tiny-size` (11px). Residual recheck: offline + `/products/seating/arvo/` **OK**. Evidence: `results/site/responsive-audit-marketing.txt`. typecheck + `verify:focss` green.

**SITE-S10 / S08–S09 / S17 / S18:** closed earlier this day (see prior notes + `results/site-slice-close-evidence.txt` / marquee eager load).

**Removed dup:** SITE-S13→TST-S19

---

## OPEN

| ID | Pri | Seam | Red → green | Deps |
|----|-----|------|-------------|------|
| **SITE-S19** | P2 | LH-3: `/oostudio/` CLS=0.30 (>0.1) + raw `<img>` no dims in Planner islands | add explicit width/height to `PlannerAutoArrangeDialog.tsx:158`, `PlannerProjectsList.tsx:81`; fix Studio late-layout | WRK-S15 |
| **SITE-S20** | P2 | 8.3: `LanguageSwitcher` `NEXT_LOCALE` cookie lacks `Secure` | **DONE** 2026-08-12 — `; Secure` added on HTTPS |
| **SITE-S21** | P3 | 3.2: duplicate `og:locale:alternate` + `og:image:alt` `&amp;` entity | dedupe alternates in `buildSiteMetadata`; fix entity in OG image alt | — |
| **SITE-S22** | P2 | LH-4: `/products/` + `/ooplanner/` Lighthouse time out (no metrics) | investigate client fetch + HMR keeping network busy; re-measure in prod | — |

---

## Paths

`site/app/(site)/` · `site/focss/site/` · `scripts/responsive-audit.mjs` · `results/site/responsive-audit-marketing.txt`
