# Operations & deploy

**AUDITED:** 2026-08-12 · Registry: [`00-README.md`](./00-README.md) · [`OPERATIONS_RUNBOOK.md`](../OPERATIONS_RUNBOOK.md) · Audit: [`.archive/audit/00-audit-summary.md`](../.archive/audit/00-audit-summary.md)

---

## DONE

| ID | Seam / evidence |
|----|-----------------|
| **OPS-S01** | `docs.oando.co.in` HTTPS **200** (2026-08-10) — `server: Vercel`; F3 closed |
| OPS-S02 | `check-worker-origin.mjs` OK |
| OPS-S03 | apex `GET /api/categories/` JSON |
| **OPS-S04** | Apex static CSS **200** |
| OPS-S06 | pnpm 11.20.0 + frozen lockfile |
| OPS-S07 | apex `/ooplanner/` has `x-oando-proxy: cloudflare-worker` |
| OPS-S08 | apex catalog asset HEAD 200 |
| OPS-S09 | Apex `X-Robots-Tag` fixed via Worker — F4 FIXED |

---

## OPEN

| ID | Pri | Seam | Status | Evidence |
|----|-----|------|--------|----------|
| **OPS-S05** | P1 | Vercel token lifecycle | OPEN | revoke exposed token; vault only |
| **OPS-S10** | P2 | P2-9: `/ooplanner/projects/` 401s in bypass mode | OPEN | verify dev-bypass identity reaches client `/api/Planner/projects` fetch; confirm list loads |
| **OPS-S11** | P2 | P2-10: sitemap lists 308-redirected `/planner/features/3d-view/` | OPEN | drop path from `PLANNER_MARKETING_SITEMAP_PATHS`; regenerate sitemap |
| **OPS-S12** | P3 | P3-seo: duplicate `og:locale:alternate` + `og:image:alt` `&amp;` | OPEN | dedupe alternates in `buildSiteMetadata`; fix entity |

### OPS-S01 closed (2026-08-10)

Path was NXDOMAIN → DNS up + **525** origin SSL → origin/deploy fixed → **`curl -I https://docs.oando.co.in/` → 200**.

---

## Paths

`workers/oando-worker-proxy/` · `vercel.json` · `pnpm run build:site` · `pnpm run ops list`

---

## Env: main site vs tech-docs

| Surface | Env file | Notes |
|---------|----------|--------|
| **Main site** | root + `site/.env.local` | R2 + `NEXT_PUBLIC_TECH_DOCS_URL=https://docs.oando.co.in` |
| **Tech-docs** | public admin Supabase only | No R2/service-role |

Sync: `pnpm run ops env:sync` · validate: `pnpm run ops launch:env`
