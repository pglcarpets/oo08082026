# Browser / E2E

## Bar
- UI truth: fresh browser at **`http://localhost:3000` only** (never `127.0.0.1`).
- Unit tests are not browser proof.
- Playwright config: `config/build/playwright.config.ts` (present).

## Surfaces
- Marketing: `/`
- Member suite: `/dashboard`, `/portal/*` (`PortalShell` + `shell-global-nav`)
- Studio: `/oostudio`
- Planner: `/ooplanner`
- Admin: `/admin/*` (auth / local bypass only when configured)

## UI audit scripts (not gated)

| Script | Output |
|--------|--------|
| `node scripts/ui-polish-pass1-audit.mjs` | `results/ui-polish/pass-1/` — 17 routes × 3 viewports |
| `node scripts/responsive-audit.mjs` | `results/responsive-audit/` — full route list, mobile + desktop screenshots |
| `scripts/tmp-*.mjs` | Session scratch — prefer `responsive-audit.mjs` for full pass |

Local dev often runs `DEV_AUTH_BYPASS=1`, which switches Planner projects and the
furniture catalog to **disk** and skips CSRF in `withAuth`. That does **not** prove
the production member path: set `DEV_AUTH_BYPASS=0` (or unset), sign in with a real
Supabase session, and use Planner load/save via `plannerApi` → `browserApiFetch`
(cookies + CSRF + trailingSlash).
