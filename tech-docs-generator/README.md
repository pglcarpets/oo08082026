# Tech docs generator

Optional Vite inventory SPA. **Not** product runtime (`site/` does not import it).
Still required for monorepo `pnpm run build` / ship paths that run `build:tech-docs`
(see stack §1) — it does not replace root [`Failures.md`](../Failures.md).

Aligned with [`docs/architecture/stack.md`](../docs/architecture/stack.md) §1–2 and
[`docs/architecture/product-map.md`](../docs/architecture/product-map.md) § Tech-docs.

> Inventory SPA only. Generate wipes `generated-documents/{docs,data}` each run.
> Blockers: root [`Failures.md`](../Failures.md) only. Gate truth: fresh
> `pnpm run tech-docs:gate`.

## Generated output is disposable

Every `generate` / gate run:

1. **deletes** all of `generated-documents/` (docs, data, site)
2. **writes fresh** docs + data (no `.tmp` staging for those trees)
3. fails non-zero if generation fails
4. Vite rebuilds `generated-documents/site` (`emptyOutDir`)

No “keep last good tree.” Coverage / cache: `results/tooling/tech-docs/`.

Gate order: **generate** → validate → guards → typecheck → **build site** → coverage.

## Commands (repo root)

Install only from monorepo root — never inside this package.

| Need | Command |
|------|---------|
| Dev SPA | `pnpm run tech-docs:dev` → http://localhost:3001/tech-stack |
| CI gate | `pnpm run tech-docs:gate` |
| Regenerate | `pnpm run ops tech-docs:generate` |
| Package tests | `pnpm --filter oando-tech-docs test` |
| Root vitest lane | `pnpm run ops test:tech-docs` |
| Standalone check | `pnpm run ops tech-docs:check` |

| App | Command | Port |
|-----|---------|------|
| Product (Next) | `pnpm run dev` | **3000** |
| Tech-docs (Vite) | `pnpm run tech-docs:dev` | **3001** (strict; never fall back to 3000) |

Admin **System → Architecture docs** is an external link via
`site/lib/admin/techDocsUrl.ts` (`NEXT_PUBLIC_TECH_DOCS_URL` in prod).

Root `pnpm run build` runs `build:site` **and** `build:tech-docs` (stack §1).

## Tests

Specs: `tests/tech-docs-generator/` — second lane of `pnpm run test`. Check both
lane summaries (or `results/tests/vitest-tech-docs-results.json`).

```bash
pnpm exec vitest run --config tests/vitest.tech-docs.config.ts
```

`tech-docs:gate` is stricter than the dual-lane root `test` alone.

## CSS

`src/styles/` (imported by `src/index.css`). **Not** FOCSS — do not move into
`site/focss/`. See [`docs/governance/focss-stop-drift.md`](../docs/governance/focss-stop-drift.md).
