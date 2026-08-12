# 03 — SEO Audit

## Overview

- **Track:** 03 — Search Engine Optimization (robots, sitemap, per-route metadata, canonicals, hreflang, OG/Twitter, on-page h1)
- **Scope:** Marketing surface only (`site/app/(site)/*`, `robots.ts`, `sitemap.ts`, `seo.ts`, `routeMetadata.ts`, `routeClassification.ts`, `proxy.ts` matcher, `config/build/next.config.js` redirects). Forked apps (`/oostudio`, `/ooplanner`) and admin are out of scope except where they surface in robots/sitemap.
- **Date:** 2026-08-12
- **Auditor:** Agent B (Phase A). Audit only — no source files edited.
- **Dev server:** verified live at `http://localhost:3000/` (HEAD 200). Note: the running server reports `bypassEnabled:false` (`/api/dev/auth-bypass-status`), i.e. `DEV_AUTH_BYPASS` flag is set but not to `"1"`, so persistence is in Supabase mode and auth gates run for real (see 04/09). This does not affect SEO probes.

## Method

### Source files inspected (file:line)

- `site/app/robots.ts` — `robots()` emits `ROBOTS_DISALLOW_PREFIXES` + `host`/`sitemap` from `SITE_URL` (lines 8–26).
- `site/app/sitemap.ts` — `STATIC_SITEMAP_PATHS` union of `PUBLIC_INDEXABLE_STATIC_PATHS` + `PLANNER_MARKETING_SITEMAP_PATHS` + `SOLUTION_CATEGORY_SITEMAP_PATHS`; `SITEMAP_EPOCH` cold-start stamp; `isSafeSitemapSegment` (lines 47–51); catalog expansion via `buildRequestedCategoryCatalog` (lines 120–160).
- `site/lib/siteUrl.ts` — `isUnusableSiteUrl` guards `.vercel.app`, `localhost`, `127.0.0.1`, `0.0.0.0`, non-http schemes → falls back to `PRODUCTION_SITE_URL = "https://oando.co.in"` (lines 1–56).
- `site/features/site/data/seo.ts` — `sanitizeCanonicalPath` open-redirect defense (lines 96–149); `buildCanonicalUrl` same-origin enforced (lines 151–172); `LOCALE_HREFLANG` en→en-IN, hi→hi-IN, fr→fr-FR, de→de-DE, es→es-ES (lines 53–58); `buildLocaleAlternates` honors `routing.localePrefix === "never"` → same URL per locale (lines 60–90); `buildPageMetadata` (lines 412–470).
- `site/features/site/data/routeClassification.ts` — `ROBOTS_DISALLOW_PREFIXES` incl. `/oostudio/`, `/ooplanner/` (lines ~280); `PUBLIC_INDEXABLE_STATIC_PATHS`, `PLANNER_MARKETING_SITEMAP_PATHS` (incl. `/planner/features/3d-view`), `SOLUTION_CATEGORY_SITEMAP_PATHS` (~lines 270–279).
- `site/proxy.ts` — matcher excludes `_next|_vercel|api|favicon.ico|sitemap.xml|robots.txt|.*\.(static assets)$` (lines 440–453); locales never prefixed.
- `config/build/next.config.js` — `trailingSlash:true` (line 80); 60+ 308 redirects incl. `/catalog→/downloads/` (84), `/templates→/products/` (90), `/portal/svg-catalog→/products/` (124), `/admin/svg-editor→/oostudio/` (114), `/crm→/admin/crm/` (265), `/ops→/admin/customer-queries/` (267), `/planner/features/3d-view→/planner/features/export/` (111).

### Commands run (evidence under `results/audit/seo/`)

1. `Invoke-WebRequest http://localhost:3000/robots.txt` → 200; saved `robots.txt`.
2. `Invoke-WebRequest http://localhost:3000/sitemap.xml` → 200 (32489 bytes); saved `sitemap.xml`.
3. Per-route HEAD/GET for 14 routes (`/`, `/about/`, `/products/`, `/products/seating/`, `/solutions/`, `/showrooms/`, `/contact/`, `/planner/`, `/planner/features/measure/`, `/privacy/`, `/terms/`, `/refund-and-return-policy/`, `/sustainability/`, `/clients/`) → all 200; `<head>` saved per route under `heads/`; full HTML saved for 5 routes (`full_root.html`, etc.). Summary in `head-summary-detail.txt`.
4. `curl.exe -D - http://localhost:3000/planner/features/3d-view/` → 308, `location: /planner/features/export/`.
5. `grep` sitemap for `admin|/api/|dashboard|portal|login|access` → **no matches** (no private routes in sitemap).

## Findings

### [P2] 3.1 — Sitemap emits a permanently-redirected URL (`/planner/features/3d-view/`)

`site/app/sitemap.ts` derives its planner-feature entries from `PLANNER_MARKETING_SITEMAP_PATHS` (`routeClassification.ts`), which includes `"/planner/features/3d-view"`. The live `sitemap.xml` therefore contains:

```
<loc>https://oando.co.in/planner/features/3d-view/</loc>     (line 142)
<loc>https://oando.co.in/planner/features/export/</loc>      (line 154)
```

But `config/build/next.config.js` (lines 111–112) issues a permanent 308 from `/planner/features/3d-view` → `/planner/features/export/`. Verified at runtime:

```
curl http://localhost:3000/planner/features/3d-view/  →  HTTP/1.1 308 Permanent Redirect  location: /planner/features/export/
```

Effect: the sitemap lists a URL that is not the canonical destination, and the real destination (`/export/`) is *also* listed → a self-competing duplicate. Google will follow the 308 but the `<lastmod>`/`<priority>` signal on the redirected entry is wasted and the two entries compete.

**Evidence:** `results/audit/seo/sitemap.xml` lines 142 & 154; `config/build/next.config.js:111`; curl 308 above.
**Owner action:** Drop `"/planner/features/3d-view"` from `PLANNER_MARKETING_SITEMAP_PATHS` in `routeClassification.ts` (keep `"/planner/features/export"`); regenerate sitemap.

### [P3] 3.2 — Duplicate `og:locale:alternate` meta tags on the homepage

`buildSiteMetadata` (`seo.ts` ~line 437) and `buildPageMetadata` (`seo.ts` ~line 458) both set `openGraph.alternateLocale`. Next.js metadata merging emits **both** sets, so the homepage renders each alternate locale twice:

```
og:locale = en_IN
og:locale:alternate = hi_IN   (×2)
og:locale:alternate = fr_FR    (×2)
og:locale:alternate = de_DE    (×2)
og:locale:alternate = es_ES    (×2)
```

Verified by regex on `results/audit/seo/full_root.html`. Harmless to rendering but noisy/duplicate metadata; some scrapers flag duplicates.

**Evidence:** `results/audit/seo/full_root.html` (grep `og:locale`); `site/features/site/data/seo.ts` `buildSiteMetadata` + `buildPageMetadata`.
**Owner action:** Omit `alternateLocale` from one of the two builders (root vs page) so the merged output is de-duplicated.

### [P3] 3.3 — `<html lang>` is hardcoded `"en"` and never reflects the negotiated locale

`site/app/layout.tsx` (line 16) renders `<html lang="en" …>`. `site/app/(site)/layout.tsx` calls `getSiteLayoutContext()` but destructures only `{ messages, locale }` — the `lang` field it returns is dropped (cross-ref 08-i18n finding 8.1). Verified on the live homepage: `<html lang="en">` regardless of any `NEXT_LOCALE` cookie. With `localePrefix:"never"` + cookie negotiation, a Hindi/French/German/Spanish visitor still gets `lang="en"` → document-language mismatch (SEO + a11y).

**Evidence:** `site/app/layout.tsx:16`; `site/app/(site)/layout.tsx` (destructure); `results/audit/seo/full_root.html` `<html lang="en"`.
**Owner action:** Wire `getHtmlLang(locale)` into the `<html lang>` attribute (and fix the fr/de/es mis-map first — see 08-i18n 8.2).

### [P3] 3.4 — `og:image:alt` carries an un-decoded `&amp;` entity

Across routes the `og:image:alt` (and several titles) contain the literal HTML entity `&amp;` rather than the decoded `&`. Example homepage:

```
<meta property="og:image:alt" content="One&amp;Only | One and Only Furniture | Premium Office Solutions India"/>
```

This is because titles/descriptions feed through `resolveDocumentTitle` and Next escapes `&` → `&amp;`, but the OG alt re-uses the already-entity-encoded string. Minor: social scrapers generally render `&amp;` as `&`, but the raw tag is not optimal.

**Evidence:** `results/audit/seo/head-summary-detail.txt` (titles show `One&amp;Only`); `results/audit/seo/full_root.html` `og:image:alt`.
**Owner action:** Decode entities before passing to `og:image:alt`, or source brand strings without `&`.

## Verified-correct (no finding)

- **Host safety PASS:** `robots.txt` `Host:` and `Sitemap:` both resolve to `https://oando.co.in` (never `vercel.app`/`localhost`). Canonicals on all 14 probed routes point at `https://oando.co.in/<path>/`. `site/lib/siteUrl.ts` `isUnusableSiteUrl` guard verified to reject preview/local hosts. Evidence: `results/audit/seo/robots.txt` lines 77–78; `head-summary-detail.txt`.
- **Sitemap exclusion PASS:** no `admin/api/dashboard/portal/login/access` entries in `sitemap.xml` (grep, 0 matches). App shells `/oostudio/`, `/ooplanner/` are in robots `Disallow` and absent from sitemap.
- **Per-route metadata PASS:** all 14 routes have a unique `<title>`, `<meta name="description">`, `<link rel="canonical">`, `robots` meta `index, follow`, `og:image` (1200×630 with `og:image:alt`), and `twitter:card=summary_large_image`. `/refund-and-return-policy/` and `/terms/` intentionally omit hreflang (`alternates:false` in `routeMetadata.ts`) — legal pages, by design.
- **h1 PASS:** each probed route has exactly one `<h1>` in the server-rendered HTML (counted in full HTML, not just `<head>`). No missing or duplicate h1.
- **Hreflang PASS:** indexable routes emit 6 `rel=alternate hrefLang` tags — `en-IN, hi-IN, fr-FR, de-DE, es-ES, x-default` — all on the production origin. `LOCALE_HREFLANG` (`seo.ts:53`) correctly maps fr→fr-FR, de→de-DE, es→es-ES (the htmlLang mis-map in 08-i18n does NOT leak into hreflang).
- **Redirects PASS:** sampled `/catalog`, `/products/category/seating`, `/planner/features/3d-view/` all return 308 to their documented destinations.
- **Canonical defense PASS:** `sanitizeCanonicalPath` rejects absolute schemes, protocol-relative `//`, backslashes, `%2f%2f`/`%5c`/`%00`, control chars, and `javascript:` smuggled after a forced slash; `buildCanonicalUrl` re-checks origin post-resolve. No open-redirect vector in canonical/sitemap builders.

## Deferred

- **OG image file existence/200** not verified (only the `og:image` URL tag, which points at `/assets/marketing/hero/...`). Follow-up: `Invoke-WebRequest` each `og:image` URL.
- **Product detail route SEO** (`/products/[category]/[product]`) head not captured (only the category `/products/seating/`). The product route uses `generateMetadata`; spot-check deferred.
- **`changeFrequency`/`priority` values** are structurally valid; Google largely ignores them — no finding, noted for completeness.
- **JSON-LD structured data** (`buildGlobalJsonLd`, `buildProductJsonLd`) validity not run through Schema.org validator — deferred.

## Changed files

None (audit only).

## Blockers (proposed `Failures.md` rows — not applied)

| id | priority | blocker | evidence | owner action |
|----|----------|---------|----------|-------------|
| SEO-1 | P2 | Sitemap lists 308-redirected `/planner/features/3d-view/` alongside its destination `/planner/features/export/` | `results/audit/seo/sitemap.xml:142,154`; `config/build/next.config.js:111`; curl 308 → `/planner/features/export/` | Remove `"/planner/features/3d-view"` from `PLANNER_MARKETING_SITEMAP_PATHS` (`routeClassification.ts`) |
| SEO-2 | P3 | Duplicate `og:locale:alternate` meta tags emitted (root + page metadata both set `alternateLocale`) | `results/audit/seo/full_root.html` (each alt locale ×2) | Drop `alternateLocale` from one builder in `seo.ts` |
| SEO-3 | P3 | `<html lang="en">` hardcoded; never reflects negotiated locale | `site/app/layout.tsx:16`; `site/app/(site)/layout.tsx` drops `lang` | Wire `getHtmlLang(locale)` (after fixing 08-i18n 8.2) |
| SEO-4 | P3 | `og:image:alt` contains literal `&amp;` entity | `results/audit/seo/full_root.html` | Decode entities before OG alt |
