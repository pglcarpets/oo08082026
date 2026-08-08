# Pinned Agent Skills Reference for oo05082026

This repo contains **16 pinned agent skills** under `.github/skills/`. The IDE assistant loads them automatically when matching tasks. This document maps each skill to the actual codebase so you know which ones matter here, which are dormant, and whether you need to install anything to use them.

Source of truth: `.github/skills/README.md` and the 16 `SKILL.md` files inside each skill folder.

---

## Quick Reference: All 16 Skills

| # | Skill | Status | Needs download? |
|---|---|---|---|
| 1 | **accessibility-a11y-expert** | ✅ Active | No |
| 2 | **ai-llm-integrator** | ✅ Active | Maybe (API keys) |
| 3 | **code-reviewer** | ✅ Active | No |
| 4 | **database-architect** | ✅ Active | Maybe (psql/Redis) |
| 5 | **docker-devops-engineer** | ⚠️ Optional | Yes, if used (Docker Desktop) |
| 6 | **git-workflow** | ✅ Active | Yes (Git CLI, usually present) |
| 7 | **micro-frontend-architect** | ❌ Not required | N/A |
| 8 | **mobile-react-native-expert** | ❌ Not required | N/A |
| 9 | **nextjs-expert** | ✅ Active | No |
| 10 | **performance-optimizer** | ✅ Active | No |
| 11 | **security-auditor** | ✅ Active | No |
| 12 | **seo-strategist** | ✅ Active | No |
| 13 | **state-management-expert** | ✅ Active | No |
| 14 | **supabase-expert** | ✅ Active | Yes (Supabase CLI) |
| 15 | **test-engineer** | ✅ Active | Yes (Playwright browsers) |
| 16 | **ui-css-architect** | ✅ Active | No |

---

## Legend

| Badge | Meaning |
|---|---|
| ✅ Active / Required | Used by the current stack; expect the agent to apply it |
| ⚠️ Optional / Contextual | Useful for some tasks but not core to the repo |
| ❌ Not Required | Technology is not present in this codebase |

---

## Active / Required Skills

| # | Skill | What it governs | Repo evidence |
|---|---|---|---|
| 1 | **accessibility-a11y-expert** | WCAG 2.1 AA, ARIA, keyboard focus, screen readers | `@axe-core/playwright`, `tests/e2e/accessibility.spec.ts`, `test:a11y` gate |
| 2 | **ai-llm-integrator** | Mastra agents, RAG, prompt engineering, streaming, embeddings | `@mastra/core`, `@mastra/memory`, `@mastra/rag`, `@orama/orama` |
| 3 | **code-reviewer** | TypeScript strictness, error handling, no `any`, lint compliance | `typescript@7`, `oxlint`, `typecheck` scripts |
| 4 | **database-architect** | PostgreSQL schema design, indexing, transactions, EXPLAIN plans, Redis caching | Supabase Postgres, `drizzle-orm`, `postgres` driver, Redis mentioned for hot reads |
| 6 | **git-workflow** | Conventional commits, clean history, commit only when asked | Git repo, release scripts |
| 9 | **nextjs-expert** | App Router, Server/Client components, `next/navigation`, Server Actions, `localhost:3000` auth cookies | `next@16.3.0-preview.10`, `site/app/` routes, dev script `next dev site --webpack` |
| 10 | **performance-optimizer** | LCP/CLS/INP, code splitting, image optimization, caching | `@vercel/analytics`, `@vercel/speed-insights`, `sharp`, build optimization scripts |
| 11 | **security-auditor** | OWASP, input validation, CSP, secret isolation, RLS ownership checks | `zod`, `next-safe-action`, `.env.local` rules, secret scanning scripts |
| 12 | **seo-strategist** | Metadata, OpenGraph, JSON-LD, sitemaps, canonical tags | Marketing routes in `site/app/(site)/`, `next-intl` |
| 13 | **state-management-expert** | Zustand stores, React Query server cache, colocating state | `zustand@5.0.14`, `@tanstack/react-query@5.101.4` |
| 14 | **supabase-expert** | Migrations, RLS policies, grants, rollback sections, service-role vs anon keys | `@supabase/ssr`, `@supabase/supabase-js`, `site/platform/supabase/migrations/`, `lib/catalog/furnitureCatalogMode.ts` |
| 15 | **test-engineer** | Vitest unit tests, Playwright E2E, accessible selectors, multi-lane awareness | `vitest`, `@playwright/test`, `tests/`, `pnpm run test` runs two lanes |
| 16 | **ui-css-architect** | Tailwind/FOCSS tokens, responsive layouts, glassmorphism, animations | `site/focss/`, `tailwindcss@4.3.3`, `@tailwindcss/postcss`, `gsap`, `framer-motion` |

---

## Optional / Contextual Skills

| # | Skill | Why it is optional here | Notes |
|---|---|---|---|
| 5 | **docker-devops-engineer** | No `Dockerfile`, `docker-compose.yml`, or containerized deployment in this repo. CI/CD is present via GitHub Actions but not Docker-based. | Useful only if the project later adds containers. Otherwise skip. |

> Note: `docker-devops-engineer` is the only skill that falls in a gray area — the repo has GitHub Actions and deployment concerns, but no Docker artifacts. It is **not required** for the current scope.

---

## Not Required (Technology Not Present)

| # | Skill | Why it is not needed |
|---|---|---|
| 7 | **micro-frontend-architect** | No Webpack Module Federation, no remote entries, no independently-deployed micro-frontends. Studio and Planner are forked *code* trees, not runtime micro-frontends. |
| 8 | **mobile-react-native-expert** | No React Native, Expo, `expo-router`, `react-native-safe-area-context`, or mobile native code. This is a web-only Next.js application. |

---

## Download / Install Cheat Sheet

Only a few skills need something beyond `pnpm install`:

| Skill | What to install | Command / Location |
|---|---|---|
| **supabase-expert** | Supabase CLI | `pnpm add -g supabase` or `npx supabase` |
| **test-engineer** | Playwright browser binaries | `pnpm exec playwright install` |
| **docker-devops-engineer** | Docker Desktop / CLI | Only if you start containerizing |
| **database-architect** | `psql` (optional) | PostgreSQL client from postgresql.org |
| **database-architect** | Redis (optional, only if using caching) | redis.io download or Docker if added later |
| **ai-llm-integrator** | Model provider API keys | Add to `site/.env.local` or root `.env.local` |
| **git-workflow** | Git | git-scm.com (usually already installed) |

Everything else is already declared in `package.json` and pulled by `pnpm install`.

---

## How the Agent Uses These Skills

The skills are loaded by VS Code Copilot / the IDE assistant when file patterns match. For example:

- Edit a file in `site/focss/**/*.css` → `.github/instructions/focss.instructions.md` + **ui-css-architect**
- Edit a file in `tests/**/*.{ts,tsx}` → `.github/instructions/testing.instructions.md` + **test-engineer**
- Edit a Studio/Planner file → `.github/instructions/boundaries.instructions.md` + relevant fork skill
- Edit a migration → `.github/instructions/migrations.instructions.md` + **supabase-expert**

There are **no slash commands** like `/gate` or `/new-test`; skills are applied automatically based on context.

---

## Summary

- **Must know for this repo:** `accessibility-a11y-expert`, `ai-llm-integrator`, `code-reviewer`, `database-architect`, `git-workflow`, `nextjs-expert`, `performance-optimizer`, `security-auditor`, `seo-strategist`, `state-management-expert`, `supabase-expert`, `test-engineer`, `ui-css-architect`.
- **Optional:** `docker-devops-engineer`.
- **Not required:** `micro-frontend-architect`, `mobile-react-native-expert`.
- **Likely needs a download:** Supabase CLI and Playwright browsers for local development/testing.
