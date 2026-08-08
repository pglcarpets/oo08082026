#!/usr/bin/env python3
"""Generate session docs: checklists, handovers, and implementation sub-plans.

Usage:
    python generate-session-docs.py --checklist > 08-oo-start-checklist.md
    python generate-session-docs.py --handover  > handover-YYYY-MM-DD.md
    python generate-session-docs.py --subplan testing > implementation_plan_sub_testing.md
"""

import argparse
from datetime import datetime

CHECKLIST = """# OO Start Checklist -- Pre-session Onboarding

**For:** Any developer or agent beginning work on the ooplanner-oostudio monorepo
**Location:** `e:\\oo08082026` (never `e:\\Websites\\oo05082026`)
**Authority:** user instruction > live code > `AGENTS.md` > `docs/`

---

## 1. Environment Verification

- [ ] Working directory is `e:\\oo08082026`
- [ ] `.env.local` exists at repo root with required Supabase keys (Admin + Products)
- [ ] `pnpm` is available: `pnpm --version` (expected: 11.20.0+)
- [ ] `node` is available: `node --version` (expected: v24+)

## 2. Install & Health

```cmd
pnpm install
```

- [ ] Install runs from **repo root only** -- never inside `site/` or `tech-docs-generator/`
- [ ] No nested `node_modules` inside `site/`

## 3. Fast Gate (5-minute smoke)

```cmd
pnpm run check:layout
pnpm run verify:focss
pnpm run typecheck
pnpm run p0:unit
```

- [ ] `check:layout` -> exit 0
- [ ] `verify:focss` -> 141+ stylesheets OK
- [ ] `typecheck` -> exit 0
- [ ] `p0:unit` -> 23 files / 146 tests pass

## 4. Blockers & Plans

- [ ] Read `Failures.md` -- know the active blockers
- [ ] Read `plans/01-handover.md` -- understand last session state
- [ ] Pick the relevant programme plan from `plans/`

## 5. Dev Server (if UI work)

```cmd
pnpm dev
```

- [ ] Server starts on `http://localhost:3000` (**never** `127.0.0.1`)
- [ ] Marketing `/` loads
- [ ] `/ooplanner` loads (guest mode with `DEV_AUTH_BYPASS=1`)
- [ ] `/oostudio` loads

## 6. Fork Isolation

```cmd
pnpm run scan:boundaries
```

- [ ] **0 cross-product edges**

## 7. Database Awareness

- [ ] Two Supabase projects: **Admin** and **Products**
- [ ] Every migration needs a `-- rollback` section
- [ ] Use mode-aware wrappers -- **never** raw `fs` in production API paths

## 8. Testing Awareness

- [ ] `pnpm run test` runs **two Vitest lanes**
- [ ] Playwright uses `http://localhost:3000` only

## 9. Before Committing

```cmd
node scripts/general/check-plans-purity.mjs
pnpm run check:docs-all
```

- [ ] Both exit 0

## 10. Common Mistakes

| Mistake | Why |
|---------|-----|
| `127.0.0.1` instead of `localhost` | Breaks auth cookies |
| `pnpm install` inside `site/` | Nested node_modules; breaks layout check |
| Raw `fs` in API routes | Fails in production (read-only Supabase FS) |
| No `-- rollback` in migrations | Fails `check:governance` |
| Studio <-> Planner imports | Violates fork isolation |
| Trusting one Vitest summary | Two lanes run; check both |
| `plans/` subfolders | `check-plans-purity` rejects |

---

*Generated: {date}*
"""

HANDOVER = """# Handover -- Session Close

**Date:** {date}
**Branch:** `main`
**Status:** [PARTIAL | COMPLETE | BLOCKED]

---

## 1. What Changed

| # | Change | Files | Evidence |
|---|--------|-------|----------|
| 1 | | | |

## 2. Verification

| Gate | Result |
|------|--------|
| Plans purity | |
| Docs all | |
| Typecheck | |
| P0 unit | |

## 3. Open Items

| Priority | Item | Owner | Plan |
|----------|------|-------|------|
| P0 | | | |

## 4. Artifacts

| What | Where |
|------|-------|
| Tests | `results/tests/` |
| Deploy | `results/deploy/` |

## 5. Quick Start for Next Session

1. Read this handover
2. Read `Failures.md`
3. Run Fast Gate from `08-oo-start-checklist.md`
4. Pick programme plan from `plans/README.md`

---

*Generated: {date}*
"""

SUBPLAN_TEMPLATE = """# Sub-plan: {target} Revisions

**Generated:** {date}
**Target:** `plans/{target}`

## Changes

[Describe each change: location, old text, new text, rationale]

---

*Sub-plan. Refer to `implementation_plan.md` for programme context.*
"""


def main():
    parser = argparse.ArgumentParser(description='Generate session docs')
    parser.add_argument('--checklist', action='store_true', help='Generate onboarding checklist')
    parser.add_argument('--handover', action='store_true', help='Generate handover template')
    parser.add_argument('--subplan', metavar='NAME', help='Generate sub-plan stub for NAME')
    args = parser.parse_args()

    date = datetime.now().strftime('%Y-%m-%d')

    if args.checklist:
        print(CHECKLIST.format(date=date))
    elif args.handover:
        print(HANDOVER.format(date=date))
    elif args.subplan:
        print(SUBPLAN_TEMPLATE.format(target=args.subplan, date=date))
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
