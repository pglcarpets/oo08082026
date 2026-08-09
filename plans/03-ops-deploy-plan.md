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

---

## Paths

`workers/oando-worker-proxy/` · `vercel.json` · `pnpm run build:site` · `pnpm run ops list`
