/**
 * Coverage policy — correct files + achievable numbers (2026-07-09).
 *
 * NEVER hardcode absolute statement totals from old runs.
 *
 * TWO PROFILES
 * ------------
 * 1) **Gate** (`pnpm run test:coverage` → vitest.config.ts)
 *    **Include-first allowlist** (not “everything minus excludes”)
 *    Files: pure open3d catalog/model/lib + shared boq/export (+ planner/lib)
 *    Short exclude only carves svg/ + GlbExport *inside* that allowlist
 *    Thresholds: 95/95/95/95 (statements/branches/functions/lines)
 *
 * 2) **Inventory** (`pnpm run test:coverage:inventory`)
 *    Broad include, no thresholds — dark-product meter only.
 *
 * 3) **Site** (`pnpm run test:coverage:site`)
 *    Scoped marketing/catalog logic; thresholds 95/95/95/95.
 *
 * 4) **Admin** (`pnpm run test:coverage:admin`)
 *    Full `features/admin/**` tree; thresholds 95/95/95/95.
 *
 * SVG / scripts / public assets are NOT in the gate denominator.
 * Source of include globs: vitest.shared.ts (VITEST_PLANNER_GATE_*).
 */

/** Planner ship gate — matches vitest.config.ts / vitest.shared GATE allowlist */
export const COVERAGE_GATE_PLANNER = {
  statements: 95,
  branches: 95,
  functions: 95,
  lines: 95,
  profile: "planner-gate",
  meaning:
    "95% floor on forked allowlist: lib/Planner + lib/Studio + server/* + browserApi + withAuth + proxy. Expand suite before lowering.",
};

/** Admin ship gate — matches vitest.admin.coverage.config.ts */
export const COVERAGE_GATE_ADMIN = {
  statements: 95,
  branches: 95,
  functions: 95,
  lines: 95,
  profile: "admin",
  meaning: "95% floor on features/admin tree — grow tests, do not lower gate",
};

/** Site ship gate — matches vitest.site.config.ts */
export const COVERAGE_GATE_SITE = {
  statements: 95,
  branches: 95,
  functions: 95,
  lines: 95,
  profile: "site",
  meaning: "95% floor on scoped site logic — not planner UI, not SVG pipeline, not scripts",
};

/** @deprecated alias — prefer COVERAGE_GATE_PLANNER or COVERAGE_GATE_SITE */
export const COVERAGE_GATE = COVERAGE_GATE_SITE;

/** Inventory aspiration — broad meter, not a hard ship gate */
export const COVERAGE_INVENTORY_ASPIRATION = {
  statements: 95,
  branches: 95,
  functions: 95,
  lines: 95,
  profile: "planner-inventory",
  meaning:
    "Align inventory aspiration with 95% quality bar; inventory profile still has no hard fail threshold.",
};

export function fileStatusVsGate(pct, metric = "lines", profile = "site") {
  const gate =
    profile === "planner"
      ? (COVERAGE_GATE_PLANNER[metric] ?? COVERAGE_GATE_PLANNER.lines)
      : profile === "admin"
        ? (COVERAGE_GATE_ADMIN[metric] ?? COVERAGE_GATE_ADMIN.lines)
        : (COVERAGE_GATE_SITE[metric] ?? COVERAGE_GATE_SITE.lines);
  if (pct >= gate) return `PASS (>= ${gate}% ${profile} gate)`;
  if (pct > 0 && pct >= gate * 0.5) return `PARTIAL (< ${gate}% ${profile} gate)`;
  if (pct > 0) return `LOW (< ${Math.round(gate * 0.5)}%)`;
  return "FAIL (0%)";
}

export function isHighMassFile(stmtTotal, universeTotal, share = 0.01) {
  if (!universeTotal || universeTotal <= 0) return false;
  return stmtTotal / universeTotal >= share;
}

export function isLargeBucket(stmtTotal, universeTotal, share = 0.05) {
  if (!universeTotal || universeTotal <= 0) return false;
  return stmtTotal / universeTotal >= share;
}

export function coverageReadmeForAgents() {
  return [
    "Gate files = pure open3d catalog/model/lib + shared boq/export (see vitest.shared GATE include).",
    "Exclude _archive, svg pipeline, scripts, public SVG, giant UI shells from gate denominator.",
    "Planner/site/admin ship gates: 95/95/95/95. Inventory profile has no hard threshold.",
    "Expand tests to meet the 95% floor; do not lower gates.",
  ].join(" ");
}
