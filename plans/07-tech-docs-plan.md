# Tech-docs

**AUDITED:** 2026-08-12 · App: `tech-docs-generator/` · Prod: `docs.oando.co.in` **live**  
Registry: [`00-README.md`](./00-README.md) · Audit: [`agent-reports/audit/00-audit-summary.md`](../agent-reports/audit/00-audit-summary.md) · [`docs/architecture/tech-docs-link.md`](../docs/architecture/tech-docs-link.md)

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
| **TECH-S07** | P2 | VR-3/P2-8: tech-docs vitest lane JSON stale (2026-08-10, suites=1/tests=0) — two-lane misread risk | re-run tech-docs lane cleanly; ensure `pnpm run test` overwrites `vitest-tech-docs-results.json`; never read one lane as the suite |
| **TECH-S08** | P2 | VR-2/P2-6: default lane 17 red tests (13 `resolvePdpPlanSvgThumb.server` + 2 `sitePackageRoot` + 1 docs links + 2 dev-tools/lighthouse) | triage disk-catalog/path-resolution cluster; regenerate types/paths |

```powershell
pnpm exec vitest run --config tests/vitest.tech-docs.config.ts tests/tech-docs-generator/snapshot.test.ts
pnpm --filter oando-tech-docs dev
pnpm --filter oando-tech-docs gate
```
