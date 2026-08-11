# Deep CI and live-site audit for oo08082026

## Overview

- Repository `pglcarpets/oo08082026` is a monorepo containing the Furniture Studio, Floor Planner, marketing site, admin suite, tech-docs generator, and operational tooling.[^1]
- CI is orchestrated via multiple GitHub Actions workflows under `.github/workflows`, with gate-style jobs (`gate`, `gate-fast`, `gate-full`) enforcing pre-deploy checks.
- There are no GitHub Releases configured, and only a single branch `main`, so CI status on main is the primary source of truth for deploy readiness.

## Current CI signal

- Pull request #1 (Dependabot bump for `react-aria-components`) shows four check runs on its head commit: `gate-full` (skipped), `gate` (two failures), and `gate-fast` (failure).
- All failing checks link to dedicated jobs in GitHub Actions runs (`actions/runs/31266959864`, `...872`, `...874`), indicating that the gate pipeline is actively blocking merges when tests or governance checks fail.
- Because the project uses `pnpm run gate` and related commands as top-level CI gates (per README/OPERATIONS_RUNBOOK), these failures likely reflect test, lint, boundary-scan, or governance breaks rather than misconfigured workflows.[^1]

## Branch and commit context

- The repository has a single, non-protected branch `main`, simplifying CI behavior but also meaning all pushes go directly to the primary deployment line.
- The latest commit on `main` (`1d209d4413a1ee6ef52f5517b49fcb20056c60de`) includes changes to `.gitignore`, Playwright config, Vite base paths in tests, robots metadata, TypeScript env/types, and tech-docs test configuration.
- Snapshot images under `tests/e2e/site-visual-regression.spec.ts-snapshots/*` were modified, which suggests that visual regression baselines were updated, a frequent cause of CI differences if tests expect old snapshots.

## Workflows and responsibilities

- CI is structured around at least four workflows: `release-gate.yml`, `site-ui.yml`, `supabase-backup-r2.yml`, and `tech-docs.yml`, each responsible for different aspects of build, UI verification, backups, and documentation.
- `release-gate.yml` is likely generated or managed by the `release-gate` tool, which is designed to sit between tests and deployment and enforce governance checks like cost, safety, and access before agents or applications are deployed.[^2][^3]
- `site-ui.yml` appears dedicated to UI-related checks for the marketing and product surfaces, while `tech-docs.yml` handles tech-docs build and gate tasks; failures in any of these can surface as `gate` or `gate-fast` failures in the combined status view.[^1]

## Live-site implications

- The live site at `oostudiooplanner.vercel.app` exposes four main surfaces: marketing root (`/`), Furniture Studio (`/oostudio`), Floor Planner (`/ooplanner`), and admin (`/admin/*`). CI must keep these cohesive despite their independent trees.[^1]
- Studio and Planner are intentionally separated at namespace and persistence boundaries, and a `scan:boundaries` command enforces no cross-app imports; CI failures here usually mean someone reintroduced shared modules or cross-app edges.[^1]
- Persistence modes depend on environment (`disk` vs Supabase), so CI that runs in a non-production context must avoid writing to filesystem paths that are read-only in production; the repo uses mode-aware wrappers for writes, which should be part of gate tests.[^1]

## Primary CI failure vectors

- Gate jobs: `pnpm run gate` likely chains `typecheck`, `scan:boundaries`, and test suites; any of these can fail on main after refactors such as the recent robots metadata and tsconfig changes.[^1]
- Visual regression tests: changes to snapshot PNGs without corresponding test updates (or vice versa) can cause Playwright/Vite-based UI snapshot tests to fail, leading to `gate-fast` or `site-ui` workflow failures.
- Tech-docs generator: `tests/tech-docs-generator/package.test.ts` and `tech-docs.yml` integrate with the tech-docs generator; mismatched Vite base paths, missing docs artifacts, or Backstage/TechDocs-specific config changes may break the tech-docs lane.[^4][^5]

## Recommendations to stabilize CI

- Run the gate locally: execute `pnpm run typecheck && pnpm run scan:boundaries && pnpm run gate` on `main` to reproduce failures locally before pushing; this aligns your view with the gate job’s behavior.[^1]
- Inspect failing runs: open the failing `gate` and `gate-fast` jobs via their `html_url` links from check runs, examine exact failing steps (e.g., tests, lint, release-gate scoring) rather than guessing.
- Snapshot discipline: treat UI snapshots as versioned contract; when updating UI or baselines, ensure tests are updated and committed consistently, and avoid incidental snapshot commits that may hide regressions.

## Recommendations to improve live site

- Robots and sitemap: recent commit added `sitemapHost` to `robots.ts`; confirm that the sitemap URL matches your production host and verify via CI that search engine crawlers see the correct robots and sitemap metadata.
- Performance and UX: use `site-ui.yml` to enforce basic page load and interaction checks; extend it with Lighthouse or Web Vitals checks if not already present so CI captures regressions in performance and accessibility.
- Planner/Studio separation: keep Planner and Studio trees strictly independent, using the shared backing store contract only; avoid adding new shared modules or aliases that would trip `scan:boundaries` and introduce tight coupling.[^1]

## Strategic CI improvements

- Governance with release-gate: embrace `release-gate`’s audit and score modes to build a governance.yaml tailored to your agent and application stack, then treat a passing gate as mandatory before any production deploy.[^3][^2]
- Release tagging: even though no Releases exist now, consider adopting a tag-based release workflow where tags `v*` trigger release publishing and gates; this helps separate CI that runs on every push from CI that runs for production releases.[^6]
- Tech-docs as first-class: keep tech-docs CI healthy so internal docs on routes, ops, and schema remain up to date; this improves your ability to onboard agents and humans to the system and reduces configuration drift.[^5][^4]

---

## References

1. [GitHub - pglcarpets/oo08082026](https://github.com/pglcarpets/oo08082026) - pglcarpets / **
oo08082026 ** Public

BranchesTags

## Folders and files
|Name|Name|Name|Last commit...

2. [release-gate — AI Agent Governance](https://release-gate.com/)

3. [release-gate](https://pypi.org/project/release-gate/) - AI agent release decision engine - readiness scoring, regression gate, eval runner, trace validation...

4. [Build your own Technical Documentation Portal using ...](https://medium.com/@susovanpanja/build-your-own-technical-documentation-portal-using-backstage-part-2-e314bdcc9aff) - powered by Tech-Docs Plugin

5. [Internal Developer Platforms – Part 13: Working with Backstage ...](https://www.soeldner-consult.de/en/internal-developer-platforms-part-13-working-with-backstage-techdocs-2/) - Learn here how to work with Spotify Backstage TechDocs, including how to write entities for Backstag...

6. [CannaGuide-2025/docs/GITHUB-SETTINGS-GUIDE.md at main](https://ithub.global.ssl.fastly.net/qnbs/CannaGuide-2025/blob/main/docs/GITHUB-SETTINGS-GUIDE.md) - 🌿 CannaGuide 2025 Cannabis Grow Guide: AI-powered digital companion for the entire cannabis cultivat...

