# Active blockers

Plan direction: [`plans/`](./plans/) — handover: [`plans/01-handover.md`](./plans/01-handover.md).  
Browser for any claim: **`http://localhost:3000` only**.

Remove rows only after verified fix with evidence; add a row when a real ship blocker appears.

Also mirrored in tech-docs: **Tech Stack — Active blockers** (`tech-docs-generator/src/data/activeBlockers.ts`).

---

| ID | Priority | Blocker | Evidence | Owner action |
|----|----------|---------|----------|--------------|
| **F3** | P0 | `docs.oando.co.in` **DNS resolves** but HTTPS returns **525** (Cloudflare origin SSL handshake failed). Not NXDOMAIN. | 2026-08-10: `getent hosts docs.oando.co.in` → CF anycast; `curl -I https://docs.oando.co.in/` → **525**. Apex `https://oando.co.in/` → **200**; static CSS → **200**. | Point `docs` origin at a live tech-docs deploy (valid cert or CF Full strict with correct origin). Confirm `curl -I https://docs.oando.co.in/` → **200**. Then drop F3. |

**Not blockers:** Apex static CSS 404 (checked 2026-08-10 — `/_next/static/css/*.css` → **200**). Local Next routes for portal/dashboard/ooplanner exist under `site/app/`.

---

*Last updated: 2026-08-10 — F3 reframed NXDOMAIN → origin SSL 525; OPS-S04 CSS 200 verified on apex*
