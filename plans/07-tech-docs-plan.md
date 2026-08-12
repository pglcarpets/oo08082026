# Tech-docs

**AUDITED:** 2026-08-10 · App: `tech-docs-generator/` · Prod: `docs.oando.co.in` **live**  
Registry: [`00-README.md`](./00-README.md) · [`docs/architecture/tech-docs-link.md`](../docs/architecture/tech-docs-link.md)

---

## DONE

| ID | Note |
|----|------|
| TECH-S02 | `pnpm --filter oando-tech-docs gate` |
| TECH-S03 | root `pnpm run test` tech-docs lane green |
| TECH-S04 | `activeBlockers.ts` cleared when F3 closed |
| **TECH-S05** | prod `https://docs.oando.co.in/` → **200** (2026-08-10, `server: Vercel`) |
| TECH-S06 | Admin vs Products DB boundaries in docs |
| **TECH-S01** | `snapshot.test.ts` isolated Node lane — **17/17 passed**; evidence: `results/tech-docs/snapshot-test.log` |

---

## PARTIAL / OPEN

| ID | Pri | Seam | Remaining |
|----|-----|------|-----------|

```powershell
pnpm exec vitest run --config tests/vitest.tech-docs.config.ts tests/tech-docs-generator/snapshot.test.ts
pnpm --filter oando-tech-docs dev
pnpm --filter oando-tech-docs gate
```
