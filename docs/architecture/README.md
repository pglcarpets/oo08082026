# Architecture

Where code lives, what runs it, and what serves each route.

| File | Answers |
|------|---------|
| [`product-map.md`](./product-map.md) | Where does this code go? Which domain owns it? How does Studio output reach the Planner? |
| [`source-map.md`](./source-map.md) | Where do I start reading for concern X? What is absent vs present on disk? |
| [`stack.md`](./stack.md) | What runs this — engines, runtime, package policy, persistence limits |
| [`css.md`](./css.md) | Which CSS system owns which surface |
| [`routes-pages.md`](./routes-pages.md) | Every live page route |
| [`routes-api.md`](./routes-api.md) | Every API route, with its auth role |
| [`tech-docs-link.md`](./tech-docs-link.md) | The admin → tech-docs SPA link |

## The two facts that shape everything

**The fork.** Studio (`/oostudio`) and Planner (`/ooplanner`) are separate trees
that never import each other; `pnpm run scan:boundaries` fails the build on any
edge between them. They meet only at a shared backing store — see the Studio →
Planner section of [`product-map.md`](./product-map.md).

**Exclusive-mode persistence.** Disk in dev, Supabase in production, never both.
Production's filesystem is read-only, so anything writing on a request path must go
through a mode-aware store wrapper. Detail in [`stack.md`](./stack.md) and
[`../database/overview.md`](../database/overview.md).

## This folder absorbed two others

`docs/site/` and `docs/api/` were folded in on 2026-08-01. Page routes, API routes
and the tech-docs link all answer "where does this live and what serves it," which
is architecture; two single-file folders made the map harder to read than the
content justified. Retired reading maps and index pages sit under `.archive/docs/`.

When the code and these docs disagree, the code wins — fix the doc.

## VS Code customizations

When editing forked Studio/Planner code, VS Code Copilot auto-loads
[`.github/instructions/boundaries.instructions.md`](../../.github/instructions/boundaries.instructions.md)
(fork isolation rules). For CSS under `site/focss/`, it loads
[`.github/instructions/focss.instructions.md`](../../.github/instructions/focss.instructions.md).
Full list: [`../../CONTENTS.md`](../../CONTENTS.md) § `.github/`.
