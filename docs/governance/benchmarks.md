# Benchmarks and Standards

**The world-class bar, made measurable.** Every number the programme must hit, where it
comes from, and the command that produces it.

Parent: [`rules.md`](./rules.md) · Revised: 2026-07-28 · truth note 2026-08-01: instruments
that assume Admin Product Studio / FlexLayout must be re-mapped to live
`/oostudio` + `/ooplanner` + residual admin before they can gate this checkout.
`site/proxy.ts` **is** present (Next 16 edge entry) — do not re-map that one away.

> **Staleness banner (2026-08-06):** status cells below are frozen at
> 2026-07-26/28 and must not be read as current. Blocker IDs **B1–B4 no longer
> exist** — `Failures.md` now tracks only F1–F3 (deploy blockers). The full gate
> has NOT been re-run since; treat every "exit 0" here as historical.

Instruments that measure persistence must run with `DEV_AUTH_BYPASS` unset;
local dev uses the disk mode, which is not the production path.

---

## 0. The rule

A bar in this programme is one of exactly two things:

1. **Adopted** — a published external standard, cited, with its own authority; or
2. **Derived** — a number this programme sets, with a written rationale and an instrument.

Anything else is an opinion and cannot gate a release. In particular:

> **No vendor performance figures appear in this document.** Figma, Illustrator, AutoCAD
> and Canva do not publish verifiable latency, frame-budget or memory numbers, so quoting
> any would be fabrication dressed as a benchmark. Class-leading products are used for
> **capability parity** (§2) — a checkable question — and every performance bar comes from
> §1 instead, where the authority is public and citable.

That constraint is what makes "meets or exceeds global standards" a claim this programme
can actually defend.

---

## 1. Adopted external standards

| Standard | Authority | Governs | Our bar | Position |
|---|---|---|---|---|
| **WCAG 2.2 Level AA** | W3C Recommendation, 2023-10-05 | Accessibility | Full AA conformance, 0 unreviewed axe violations | **Meets** |
| WCAG 2.2 SC 2.5.5 *Target Size (Enhanced)* | W3C, Level **AAA** | Touch target size | 44 × 44 CSS px | **Exceeds AA** — AA (SC 2.5.8) requires only 24 × 24 |
| WCAG 2.2 SC 1.4.11 *Non-text Contrast* | W3C, Level AA | UI component contrast | ≥ 3:1 for every control boundary and state | Meets |
| WCAG 2.2 SC 2.4.11 *Focus Not Obscured (Min)* | W3C, Level AA | Focus visibility | Focused control never fully hidden by toolbar, sheet or docked panel | Meets |
| **EN 301 549 v3.2.1** | ETSI / EU procurement | ICT accessibility | Clause 9 references WCAG 2.1 AA; we target 2.2 AA | **Exceeds** |
| **Section 508 (refreshed)** | US Access Board | Federal ICT | Incorporates WCAG 2.0 AA; we target 2.2 AA | **Exceeds** |
| **Core Web Vitals — good thresholds** | Google, measured at p75 | Field performance | LCP ≤ 2.5 s · INP ≤ 200 ms · CLS ≤ 0.1 | Meets |
| **RAIL** | Google performance model | Interaction budget | Pointer→visual response ≤ 100 ms · frame ≤ 16.7 ms (≈10 ms app work at 60 fps) · idle work in ≤ 50 ms chunks | Meets |
| **ISO/IEC 25010** | ISO/IEC | Product quality taxonomy | Goals G1–G8 map to functional suitability, performance efficiency, usability, reliability, security, maintainability | Adopted as taxonomy |
| **ISO 9241-11:2018** | ISO | Usability definition | Effectiveness, efficiency and satisfaction measured in context of use — the owner journey, not a component demo | Adopted as method |
| **ISO 9241-110:2020** | ISO | Interaction principles | Controllability and use-error robustness are the two this programme is repeatedly weakest on — see §2 undo/conflict rows | Adopted as review lens |
| **OWASP ASVS 4.0, Level 2** | OWASP | Application security | Admin configuration APIs: authenticated, CSRF-protected, rate-limited, revision-checked, audited | Meets |

**Reduced motion, forced colors and virtual keyboard** are treated as hard contracts, not
progressive enhancement: `prefers-reduced-motion`, `forced-colors: active`, and the
on-screen keyboard must each leave every required action reachable.

---

## 2. Capability parity — bounded 2D vector symbol editor

The reference class is what a professional 2D vector editor is expected to do. Each row is
a **capability question with a yes/no answer**, verifiable by reading source or driving the
UI. The right column is this programme's bar, not a vendor's.

| # | Capability | Reference class expects | Our bar | Owner |
|---|---|---|---|---|
| C1 | Undo / redo across every mutation | Yes, deep | ≥ 100 transactions, one transaction per user action | `0002` T2 |
| C2 | Marquee and additive multi-select | Yes | Reliable at ≥ 2 shapes — **currently unreliable** | `0002` T5 |
| C3 | Align (6 modes) and distribute (2 axes) | Yes | Millimetre-exact, one transaction per command | `0002` T5 |
| C4 | Rulers, draggable persistent guides, snap | Yes | One snap resolver with documented priority | `0004` T5 |
| C5 | Group / ungroup | Yes, nested | **Flat groups only** — nested is a permanent exclusion (R20) | `0004` T4 |
| C6 | Exact numeric transform (x, y, w, h, rotation) | Yes | All five fields, labelled, keyboard-reachable | `0004` T4 |
| C7 | Layers: rename, lock, hide, reorder, search | Yes | All five | `0002` T4 |
| C8 | Cut / copy / paste / duplicate | Yes | Stable ID remapping on paste | `0002` T3 |
| C9 | Reusable templates or components | Yes | Create, insert, rename, tag, archive, restore — fresh IDs on insert | `0004` T6 |
| C10 | Complete keyboard operation | Yes | Every enabled action reachable without a pointer | `0002` T8, `0007` T2 |
| C11 | Text with controlled fonts | Yes | Versioned local allowlist — no external font fetch (R20) | `0004` T2 |
| C12 | Linear dimensions | CAD-class only | Computed, millimetre-exact | `0004` T2 |
| C13 | Import / export | Yes | Sanitized path import; canonical V2 JSON export | `0004` T3, T7 |
| C14 | Version comparison | Partial in class | Draft vs released, structured change summary | `0004` T7 |
| C15 | Deterministic export | Rare in class | **Byte-identical PNG for identical input** | `0004` T8 |

C15 is where this programme deliberately **exceeds** the reference class: general-purpose
editors do not guarantee byte-identical raster output, and this product's release identity
depends on it.

Rows C5 and the R20 exclusion list are deliberate *non-parity*. Product Studio is a bounded
symbol editor, not an illustration tool: no connectors, no nested groups, no scripts, no
remote assets, no `foreignObject`, no filters, no infinite canvas. Narrower scope, higher
guarantee.

---

## 3. Derived bars

Numbers this programme sets. Each carries its rationale.

| ID | Bar | Value | Rationale |
|---|---|---|---|
| DB1 | Canvas share of shell | ≥ 60 % at every viewport | The canvas is the product. Below 60 % the chrome is the product |
| DB2 | Chrome overhead | ≤ 40 % of shell | Complement of DB1 |
| DB3 | Composite ergonomics score | **≥ 8.5 / 10** | Historical admin probe (deleted 2026-08-02) used ≥ 6 as a pre-v1 bar. 6/10 is not world-class; 8.5 leaves headroom for a genuinely bad viewport without letting a mediocre one through |
| DB4 | Compose canvas minimum height | 480 px | Below this the drawing surface stops being usable. Held honestly at 455 px rather than lowered — see `README` §10 |
| DB5 | Workspace page-level scroll | 0 | A workspace that scrolls its own shell has lost layout control |
| DB6 | Data caps under budget | 500 entities / 2 000 items | Fixed cap so G4 is reproducible; performance claimed only at this cap |
| DB7 | Publish-chain branch coverage | > 90 % | Release identity depends on this chain; already achieved once |
| DB8 | Test integrity | 0 hollow tests, 0 gate skips, 0 unjustified `eslint-disable` | A green suite that asserts nothing is worse than a red one |
| DB9 | Locale key parity | 100 % en/hi, millimetres stored locale-neutral | A missing key is a broken screen, not a cosmetic gap |
| DB10 | Registry liveness | 0 declared-but-dead tools | A rail button that does nothing is a lie the UI tells |
| DB11 | Persistence purity | 0 bytes of raw React Flow / FlexLayout / Zustand JSON | Package JSON as product truth makes every upgrade a migration |
| DB12 | Price honesty | 0 invented prices | A quote with a guessed number is a commercial defect, not a UI one |

---

## 4. Instruments

| Bar | Command | Exists? |
|---|---|---|
| WCAG AA, axe | `pnpm run test:a11y` | Yes |
| Product Studio axe at 390/1440/1920 | `pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/admin-product-studio-accessibility.spec.ts` | **No — spec does not exist** (verified 2026-08-06) |
| Phone shell | `pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/admin-product-studio-phone.spec.ts` | **No — spec does not exist** (verified 2026-08-06) |
| Layout floors (DB4) | `pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/admin-product-studio-layout.spec.ts` | **No — spec does not exist** (verified 2026-08-06) |
| DB1–DB3, DB5 | Layout / a11y Playwright (`admin-product-studio-layout.spec.ts`, related e2e) | Partial — dedicated admin ergonomics probe script **removed** 2026-08-02; re-bind when a gated instrument exists |
| G4 / RAIL / CWV at DB6 | `pnpm run test:e2e:planner-performance` | **No — `0007` T7 builds it** |
| G1 determinism (C15) | 20-fixture render comparison | **No — `0004` T8 builds it** |
| G2 / DB10 | Registry liveness assertion | **No — `0006` T2 S6 builds it** |
| DB7 | `pnpm run ops test:coverage:admin` | Yes |
| DB8 | `pnpm run test:audit:hollow` · `test:audit:gate-skips` · `test:audit:eslint-disable` | Yes |
| DB9 | `pnpm run ops check:i18n:parity` | Yes |
| DB11 | Persistence assertions in `0003` T5 S4, `0005` T4 | Partial |
| ASVS L2 on admin APIs | `pnpm run test:audit:api-routes` | Yes |
| Icon and style truth | `pnpm run ops check:product-icons` · `pnpm run ops check:composer-styles` | Yes |
| Whole gate | `pnpm run gate` | Yes |
| NVDA + Chromium journeys | Manual, scripted, evidence stored | Manual |

Five instruments do not exist yet. Building them is programme work, not overhead — a bar
with no instrument is decoration.

---

## 5. Gap table

Honest current state. **"Not measured" is a state, not a failure** — but it is never
"probably fine".

| Bar | Target | Current | Gap |
|---|---|---|---|
| WCAG 2.2 AA — Product Studio | 0 violations | Not measured | B2 blocks the run |
| WCAG 2.2 AA — Planner | 0 violations | Not measured | `0007` not started |
| Target size | 44 × 44 | Not measured | Assert in `0011` T8 |
| DB3 composite | ≥ 8.5 | **7.9** (2026-07-26, predates `0011`) | Re-run; stored JSON was pruned |
| DB4 canvas height | 480 px | **455 px** | B4 — two named fixes |
| DB5 page scroll | 0 | 390 px shell cannot scroll at all | `0003` T5/T6 |
| G1 determinism | 20/20 identical | Suite absent | `0004` T8 |
| G2 / DB10 liveness | 0 dead tools | **0** (2026-08-06: 15 Planner toolbar items, all handler-wired; no Text item) | — |
| G4 all | CWV + RAIL | Not measured | `0007` T7 |
| G6 / DB11 | Storage live, 0 raw JSON | Storage live — `oando_plans`, `furniture_catalog`, `block_descriptors` exist on the Admin DB (2026-08-06; supersedes "tables absent") | Re-measure raw-JSON count |
| G7 `typecheck:tests` | exit 0 | Not re-run 2026-08-06 (old "Fails, 12 files" tied to retired blocker B3) | Run `pnpm run typecheck:tests` |
| G7 `gate` | exit 0 | Historical only (2026-07-26) — full gate unexecuted since | Run `pnpm run gate` |
| DB7 coverage | > 90 % | > 90 % on named modules (2026-07-26) | Hold |
| DB12 price honesty | 0 invented | Not started | `0006` T5 |

---

## 6. Changes this document requires

Adopting these bars changes three things in the repository. They are Stage 0 work.

1. **Rebuild the ergonomics instrument.** The admin ergonomics probe / `probe:w1.5-benchmark-admin`
   alias was removed (2026-08-02). Until a gated replacement exists, treat DB1–DB3 / DB5 as
   **uninstrumented** for ship claims. Target bar remains `overall >= 8.5` per DB3 with a
   per-viewport floor so one strong viewport cannot carry a weak one.
2. **Add the missing instruments.** The five marked *No* in §4 (plus the removed probe slot).
3. **Bind bars to gates.** `README` §7 requires "every goal the plan claims to move has a
   fresh measured value". Each numbered plan's exit criteria must name the specific bars
   from this file that it moves.

---

## 7. What this programme does not claim

Stated so no reader infers more than the evidence supports:

- No claim about **field** Core Web Vitals. G4 is measured in a controlled probe at the
  DB6 caps. Real-user p75 needs field telemetry this programme does not install.
- No claim of **WCAG AAA conformance**. Two AAA success criteria are adopted deliberately
  (target size, and enhanced focus where it is free); the conformance target is AA.
- No claim that manual NVDA evidence covers **every** assistive technology. It covers NVDA
  on Chromium at both critical desktop widths, which is what R26 requires.
- No claim of parity with class-leading editors **outside** the C1–C15 rows. The R20
  exclusions are permanent and intentional.
