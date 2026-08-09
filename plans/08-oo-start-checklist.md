# OO start checklist

**AUDITED:** 2026-08-09 · cwd: repo root only · Registry: [`00-README.md`](./00-README.md)

Session-start only (CHK-S* stay OPEN until you check them).

| ID | Do | Expect |
|----|-----|--------|
| **CHK-S01** | `e:\oo08082026` + `.env.local` (Admin+Products) + node 24+ / pnpm 11.20+ | paths exist |
| **CHK-S02** | `pnpm install` from root only | `check:layout` OK; no `site/node_modules` |
| **CHK-S03** | `check:layout` · `verify:focss` · `typecheck` · `p0:unit` | all green; p0 → 23/146 |
| **CHK-S04** | Read [`Failures.md`](../Failures.md) + [`01-handover.md`](./01-handover.md) | F3 active; pick OPEN slice |
| **CHK-S05** | `pnpm dev` → **localhost:3000** (not 127.0.0.1) | `/`, `/ooplanner`, `/oostudio` load |
| **CHK-S06** | `pnpm run scan:boundaries` | 0 Studio↔Planner edges |
| **CHK-S07** | Know Admin vs Products project IDs | see AGENTS.md § Databases |
| **CHK-S08** | `pnpm run test` = two lanes | both summaries green |
| **CHK-S09** | `check:docs-all` / purity before commit | exit 0 |
| **CHK-S10** | Pick one OPEN id from registry | start red/green |

Auth cookies are host-bound — always **`http://localhost:3000`**.
