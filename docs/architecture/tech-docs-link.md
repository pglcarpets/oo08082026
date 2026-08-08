# Admin → Architecture docs (tech-docs link)

**Live code:** `site/lib/admin/techDocsUrl.ts`, `site/features/admin/ui/adminNav.ts`, `AdminLayoutShell.tsx`  
**Generator package:** `tech-docs-generator/` (`oando-tech-docs`)  
**Not FOCSS:** styles stay in `tech-docs-generator/src/styles/` — see [`governance/focss-stop-drift.md`](../governance/focss-stop-drift.md).

> **Status 2026-08-02 (blocker note refreshed 2026-08-06):** Inventory SPA is
> optional to the product. Generate **writes directly** into
> `generated-documents/{docs,data}` (no `.tmp` staging swap for those surfaces).
> Vite writes `generated-documents/site` directly. Blockers: see root `Failures.md`
> for current deploy blockers (F3 is the docs-surface one: `docs.oando.co.in` DNS). The old tech-docs gate
> blocker is no longer tracked under any F-id; run `pnpm run tech-docs:gate`
> fresh for gate truth (unexecuted as of 2026-08-06). Product code wins if the
> SPA disagrees.

## Inventory (what the SPA shows)

| Layer | Source | Refresh |
|-------|--------|---------|
| **Package inventory** | `package.json` + `pnpm-lock.yaml` → `generated-documents/data/dependencies.json` | `pnpm run ops tech-docs:generate` |
| **Product surfaces** | Hand map `tech-docs-generator/src/data/productSurfaces.ts` (admin modules, planner, studio, marketing, APIs) | edit file + reload SPA |
| **Routes / other facts** | generator extract scripts → `generated-documents/data/*` | `pnpm run ops tech-docs:generate` |

Regenerate after large dep or route changes. Live product code still wins over inventory if they disagree.

## What it is

Admin **System → Architecture docs** is an **external link** (new tab) to the tech-docs SPA:

| Environment | Default URL | How it runs |
|-------------|-------------|-------------|
| **Development** | `http://localhost:3001` | Second process: `pnpm run tech-docs:dev` (Vite, **strict port 3001**, never :3000) |
| **Production** | `https://docs.oando.co.in` | Separate host/subdomain deploy of the tech-docs static build |
| **Override** | any | `NEXT_PUBLIC_TECH_DOCS_URL` (must be `http:` or `https:`) |

Product Next stays on **`http://localhost:3000`** only (browser/E2E rule).

## Dev workflow

```powershell
# Terminal 1 — product (admin, studio, planner)
pnpm run dev
# → http://localhost:3000

# Terminal 2 — architecture docs SPA
pnpm run tech-docs:dev
# → http://localhost:3001  (strictPort: true)
```

1. Open `http://localhost:3000/admin/` (dev auth bypass when `DEV_AUTH_BYPASS=1`).
2. Sidebar **System → Architecture docs** (or hub card) → opens **:3001** in a new tab.
3. If :3001 is down, the link still appears but the page will not load until tech-docs is started.

Optional local override (same as default in dev):

```env
# site/.env.local or root .env.local (Next loads from site/ when running next dev site)
NEXT_PUBLIC_TECH_DOCS_URL=http://localhost:3001
```

## Production / subdomain

1. DNS: `docs.oando.co.in` (or your host) → static/docs project.
2. Build tech-docs: `pnpm run build` (site + tech-docs package) or `pnpm run ops tech-docs:build` — generate writes docs/data; Vite writes `generated-documents/site`; `publish-all --surfaces=site` finalizes the site manifest.
3. Deploy that static SPA **separately** from the main Next app (`pnpm run build:site` / Vercel).
4. On the **docs** build host, set the same **admin** Supabase public env as the main app (anon key only — never service role):

```env
NEXT_ADMIN_SUPABASE_URL=…
NEXT_ADMIN_SUPABASE_ANON_KEY=…
```

Vite injects these at build time. The SPA shows an email/password sign-in and only renders docs for users with `app_metadata` admin (same gate as `/admin`).

5. On the **main** app, set:

```env
NEXT_PUBLIC_TECH_DOCS_URL=https://docs.oando.co.in
```

If unset in production, code defaults to `https://docs.oando.co.in`.

## Implementation map

| Piece | Path |
|-------|------|
| URL helper | `site/lib/admin/techDocsUrl.ts` — `getTechDocsPublicUrl`, `isExternalAdminHref` |
| Nav item | `ADMIN_NAV_GROUPS` → System → “Architecture docs”, `external: true` |
| Sidebar render | `AdminLayoutShell` — `<a target="_blank" rel="noopener noreferrer">` for external |
| Hub cards | `AdminHubLinkCard` + dashboard pass-through of `external` |
| Tests | `tests/unit/lib/admin/techDocsUrl.test.ts`, `tests/unit/features/admin/ui/adminNav.test.ts` |

## Ports contract

| App | Command | Port |
|-----|---------|------|
| Product (Next) | `pnpm run dev` | **3000** |
| Tech-docs (Vite) | `pnpm run tech-docs:dev` | **3001** (`strictPort`) |

Do not run tech-docs on 3000. Product UI and E2E always use **localhost:3000**.

## Out of scope (this integration)

- Embedding the Vite SPA inside Next (iframe / `public/admin-docs`) — future Option B.
- Native admin pages that re-render `generated-documents/data/*.json` — future Option C.
- Moving tech-docs CSS into `site/focss/`.
