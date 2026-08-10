# Operations & deploy

**AUDITED:** 2026-08-10 · Registry: [`00-README.md`](./00-README.md) · [`OPERATIONS_RUNBOOK.md`](../OPERATIONS_RUNBOOK.md)

---

## DONE

| ID | Seam / evidence |
|----|-----------------|
| OPS-S02 | `check-worker-origin.mjs` OK |
| OPS-S03 | apex `GET /api/categories/` JSON |
| OPS-S06 | pnpm 11.20.0 + frozen lockfile |
| OPS-S07 | apex `/ooplanner/` has `x-oando-proxy: cloudflare-worker` |
| OPS-S08 | apex catalog asset HEAD 200 |
| OPS-S09 | Apex `X-Robots-Tag: noindex` stripped by Worker — F4 FIXED 2026-08-09 |
| **OPS-S04** | Apex static CSS **200** (2026-08-10): `curl -I https://oando.co.in/_next/static/css/03c4fe70ee4fba69.css` → 200, `cf-cache-status: HIT` |

---

## OPEN / PARTIAL

| ID | Pri | Seam | Status | Evidence |
|----|-----|------|--------|----------|
| **OPS-S01** | P0 | `docs.oando.co.in` (**F3**) | **PARTIAL** | DNS resolves (CF anycast). HTTPS **525** origin SSL. Need live tech-docs origin + valid cert → 200. |
| **OPS-S05** | P1 | Vercel token lifecycle | OPEN | revoke exposed token; vault only |

### OPS-S01 note (2026-08-10)

NXDOMAIN claim is **obsolete**. `docs.oando.co.in` resolves. Remaining: Cloudflare **525** (origin SSL handshake). Deploy tech-docs static SPA to origin, CF SSL mode Full (strict), then `curl -I https://docs.oando.co.in/` → 200 and drop F3.

### OPS-S09 — Apex noindex via Worker Host rewrite (DONE 2026-08-09)

**Fixed:** Worker strips origin `x-robots-tag` and re-applies `X-Robots-Tag: all` for public apex. GSC/Bing sitemap resubmit still recommended.

---

## Paths

`workers/oando-worker-proxy/` · `vercel.json` · `pnpm run build:site` · `pnpm run ops list`

---

## Env: main site vs tech-docs

| Surface | Env file | Cloudflare / host vars |
|---------|----------|------------------------|
| **Main site** (Next :3000 / apex) | root + `site/.env.local` | R2 + `NEXT_PUBLIC_TECH_DOCS_URL` |
| **Tech-docs** (Vite :3001 / `docs.*`) | public admin Supabase only | **No** R2/service-role. Prod = **OPS-S01** origin SSL |

Sync: `pnpm run ops env:sync` · validate: `pnpm run ops launch:env`
