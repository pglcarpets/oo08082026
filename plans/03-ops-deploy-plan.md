# Operations & deploy

**AUDITED:** 2026-08-09 · Registry: [`00-README.md`](./00-README.md) · [`OPERATIONS_RUNBOOK.md`](../OPERATIONS_RUNBOOK.md)

---

## DONE

| ID | Seam / evidence |
|----|-----------------|
| OPS-S02 | `check-worker-origin.mjs` OK |
| OPS-S03 | apex `GET /api/categories/` JSON |
| OPS-S06 | pnpm 11.20.0 + frozen lockfile |
| OPS-S07 | apex `/ooplanner/` has `x-oando-proxy: cloudflare-worker` |
| OPS-S08 | apex catalog asset HEAD 200 |

---

## OPEN

| ID | Pri | Seam | Red → green | Evidence |
|----|-----|------|-------------|----------|
| **OPS-S01** | P0 | `docs.oando.co.in` DNS (**F3**) | NXDOMAIN → CF CNAME + 200 | `results/deploy/docs-dns.txt`; drop F3 |
| **OPS-S04** | P0 | `vercel deploy --prod --prebuilt` + static CSS | 404 CSS → build + prebuilt + 200 | `results/deploy/vercel-static.txt` |
| **OPS-S05** | P1 | Vercel token lifecycle | exposed token risk → revoke; vault only | `results/deploy/token-rotation.txt` |
| **OPS-S09** | **P0** | Apex indexing: strip Vercel `X-Robots-Tag: noindex` on public hosts | deploy Worker fix | `results/deploy/indexing-blocker-x-robots.txt` |

### OPS-S09 — Apex noindex via Worker Host rewrite (P0)

**Live (2026-08-09):** `curl -sI https://oando.co.in/` → `x-robots-tag: noindex, nofollow`  
**Cause:** Worker sets `Host: *.vercel.app`; `vercel.json` noindexes preview hosts.  
**Code fix in repo:** `workers/oando-worker-proxy/src/index.js` deletes `x-robots-tag` for `oando.co.in` / `www`.  
**You must deploy:** `cd workers/oando-worker-proxy && pnpm deploy`  
**Then:** GSC + Bing → submit `https://oando.co.in/sitemap.xml`

---

## Paths

`workers/oando-worker-proxy/` · `vercel.json` · `pnpm run build:site` · `pnpm run ops list`

---

## Env: main site vs tech-docs (after SEO green)

**SEO gate (2026-08-09):** `test:priority-8` + `check:site-ui` green → `results/site/seo-100-check.txt`

| Surface | Env file | Cloudflare / host vars |
|---------|----------|------------------------|
| **Main site** (Next :3000 / apex) | root + `site/.env.local` | R2: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_S3_URL`, `CLOUDFLARE_R2_*`, `R2_CATALOG_BUCKET`, `NEXT_PUBLIC_ASSET_BASE_URL`; API: `CLOUDFLARE_API_TOKEN`; link: `NEXT_PUBLIC_TECH_DOCS_URL` |
| **Tech-docs** (Vite :3001 / `docs.*`) | same root env for local Vite load | **Public only:** `NEXT_ADMIN_SUPABASE_URL`, `NEXT_ADMIN_SUPABASE_ANON_KEY`. **No** R2/service-role. Prod DNS = **OPS-S01** |

Sync: `pnpm run ops env:sync` · validate: `pnpm run ops launch:env`
