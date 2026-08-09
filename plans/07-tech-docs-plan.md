# Tech-docs

**AUDITED:** 2026-08-09 · App: `tech-docs-generator/` · Prod: `docs.oando.co.in` (**F3** blocks)  
Registry: [`00-README.md`](./00-README.md) · [`docs/architecture/tech-docs-link.md`](../docs/architecture/tech-docs-link.md)

---

## DONE

| ID | Note |
|----|------|
| TECH-S02 | `pnpm --filter oando-tech-docs gate` |
| TECH-S03 | root `pnpm run test` tech-docs lane green |
| TECH-S04 | `activeBlockers.ts` = F3 only |
| TECH-S06 | Admin vs Products DB boundaries in docs |

---

## PARTIAL / OPEN

| ID | Pri | Seam | Remaining |
|----|-----|------|-----------|
| **TECH-S01** | P1 | `snapshot.test.ts` | lane green; dedicated `results/tech-docs/snapshot-test.log` still missing |
| **TECH-S05** | P0 | prod `docs.oando.co.in` 200 | blocked on **OPS-S01** / F3 |

```powershell
pnpm exec vitest run --config tests/vitest.tech-docs.config.ts tests/tech-docs-generator/snapshot.test.ts
pnpm --filter oando-tech-docs dev
pnpm --filter oando-tech-docs gate
```
