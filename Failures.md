# Active blockers

Plan direction: [`plans/`](./plans/) — handover: [`plans/01-handover.md`](./plans/01-handover.md).  
Browser for any claim: **`http://localhost:3000` only**.

Remove rows only after verified fix with evidence; add a row when a real ship blocker appears.

Also mirrored in tech-docs: **Tech Stack — Active blockers** (`tech-docs-generator/src/data/activeBlockers.ts`).

---

| ID | Priority | Blocker | Evidence | Owner action |
|----|----------|---------|----------|--------------|
| **F3** | P0 | `docs.oando.co.in` has **no public DNS** (NXDOMAIN). | `nslookup docs.oando.co.in` 2026-08-08 — no A record (SOA only). Separate from apex Worker. | Add CF DNS for `docs` → tech-docs host; ship docs separately per `docs/architecture/tech-docs-link.md`. |

**Not blockers for the reported 404s:** Page Rules / WAF inventing path 404s (unverified via API — token lacks zone DNS/rules read — but Worker is a transparent proxy and `CF-Cache-Status: DYNAMIC`; 404s carry `x-matched-path: /404` + `x-vercel-cache: HIT` from origin). Local Next routes for portal/dashboard/ooplanner **exist** under `site/app/`.

---

*Last updated: 2026-08-09 (session close — F3 still active; no new blockers)*
