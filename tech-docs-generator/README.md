# Tech docs generator

An **optional** Vite app that renders repository architecture and tooling data as
a browsable inventory. It is not part of the product: the Next application under
`site/` does not import from here, and nothing in this package can gate a
product change.

> **Status 2026-08-03** — Inventory SPA, not authority. Generate wipes and writes
> `generated-documents/{docs,data}` directly. Package lane: **29 test files**,
> **170 tests** via `pnpm --filter oando-tech-docs test`. Active blocker:
> fresh `pnpm run tech-docs:gate` exit 0 — [`Failures.md`](../Failures.md) F1.

## Generated output is disposable

Every `generate` / gate run:

1. **deletes** all of `generated-documents/` (docs, data, and site)
2. **writes fresh** docs + data directly into those trees (no `.tmp` staging copy)
3. exits non-zero if generation fails → the gate fails
4. Vite rebuilds `generated-documents/site` afterward (`emptyOutDir`)

There is no "keep last good tree": if step 2 fails, the live docs/data trees are
already gone.

Gate order: **generate** (wipe + write docs/data once) → validate → guards →
typecheck → **build site** → coverage tests. Coverage and test artifacts go under
`results/tooling/tech-docs/`.

`generated-documents/site` is written directly by Vite (`emptyOutDir`), then
`publish-all --surfaces=site` writes the manifest in place. Hand-edit neither tree.

`results/tooling/tech-docs/vite-cache` is the Vite/Vitest cache — not inventory.

## Commands (repo root)

Run from the **repository root** — never `pnpm install` inside this package.

| Need | Command |
|------|---------|
| Dev SPA | `pnpm run tech-docs:dev` → http://localhost:3001/tech-stack |
| CI gate | `pnpm run tech-docs:gate` |
| Regenerate inventory | `pnpm run ops tech-docs:generate` |
| Package unit tests | `pnpm --filter oando-tech-docs test` |
| Tech-docs vitest lane | `pnpm run ops test:tech-docs` |
| Standalone check | `pnpm run ops tech-docs:check` |

| App | Command | Port |
|-----|---------|------|
| Product site | `pnpm run dev` | **3000** |
| Tech-docs | `pnpm run tech-docs:dev` | **3001** — strict, will not fall back onto 3000 |

Admin links to this app rather than embedding it; URL resolver:
`site/lib/admin/techDocsUrl.ts`. Full note:
[`../docs/architecture/product-map.md`](../docs/architecture/product-map.md).

## Tests

Specs live at `tests/tech-docs-generator/` and run as the **second** vitest lane
of `pnpm run test`. Each lane prints its own summary — read both, or the JSON
reports under `results/tests/`.

```bash
pnpm exec vitest run --config tests/vitest.tech-docs.config.ts
pnpm exec vitest list --config tests/vitest.tech-docs.config.ts   # 29 files
```

`tech-docs:gate` runs generate, guards, typecheck, build, and coverage — stricter
than the root dual-lane `test` alone.

## CSS

Zone styles live in `src/styles/`, imported by `src/index.css`. **Not** under
`site/focss/`, and not subject to the FOCSS fence — see
[`../docs/governance/focss-stop-drift.md`](../docs/governance/focss-stop-drift.md).
Do not move these styles into the product tree.
