/**
 * One-off analyzer for results/COVERAGE-REPORT.md — reads coverage-final.json
 * without re-running Vitest. Handles Windows absolute paths.
 */
import fs from "node:fs";
import path from "node:path";
import { dualRollupFromFinal, fileCounts, pct } from "./coverage-metrics.mjs";
import {
  COVERAGE_GATE_PLANNER,
  COVERAGE_GATE_SITE,
  isHighMassFile,
  isLargeBucket,
} from "./coverage-policy.mjs";

const repoRoot = process.cwd();
const workspaceRoot = path.basename(repoRoot) === "site" ? path.resolve(repoRoot, "..") : repoRoot;

function relPath(filePath) {
  const n = filePath.replace(/\\/g, "/").toLowerCase();
  const markers = [
    "features/planner/",
    "features/",
    "features/site/data/",
    "lib/catalog/",
    "lib/configurator/",
    "data/",
  ];
  for (const m of markers) {
    const i = n.indexOf(m);
    if (i >= 0) return n.slice(i);
  }
  return n;
}

function fileMetrics(cov) {
  const c = fileCounts(cov);
  return {
    ...c,
    stmtPct: pct(c.stmtCovered, c.stmtTotal),
    fnPct: pct(c.fnCovered, c.fnTotal),
    brPct: pct(c.brCovered, c.brTotal),
    linePct: pct(c.lineCovered, c.lineTotal),
  };
}

function emptyBucket() {
  return {
    statements: { covered: 0, total: 0, pct: 0 },
    functions: { covered: 0, total: 0, pct: 0 },
    branches: { covered: 0, total: 0, pct: 0 },
    lines: { covered: 0, total: 0, pct: 0 },
    files: 0,
    zeroStmtFiles: 0,
  };
}

function addToBucket(bucket, m) {
  bucket.statements.covered += m.stmtCovered;
  bucket.statements.total += m.stmtTotal;
  bucket.functions.covered += m.fnCovered;
  bucket.functions.total += m.fnTotal;
  bucket.branches.covered += m.brCovered;
  bucket.branches.total += m.brTotal;
  bucket.lines.covered += m.lineCovered;
  bucket.lines.total += m.lineTotal;
  bucket.files++;
  if (m.stmtTotal > 0 && m.stmtCovered === 0) bucket.zeroStmtFiles++;
}

function finalizeBucket(bucket) {
  for (const key of ["statements", "functions", "branches", "lines"]) {
    const m = bucket[key];
    m.pct = pct(m.covered, m.total);
  }
  return bucket;
}

function analyze(jsonPath, bucketFn) {
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const buckets = {};
  const total = emptyBucket();
  const files = [];

  for (const [filePath, cov] of Object.entries(data)) {
    const rel = relPath(filePath);
    const m = fileMetrics(cov);
    const bk = bucketFn(rel);
    if (!buckets[bk]) buckets[bk] = emptyBucket();
    addToBucket(buckets[bk], m);
    addToBucket(total, m);
    files.push({ rel, ...m });
  }

  for (const b of Object.values(buckets)) finalizeBucket(b);
  finalizeBucket(total);
  files.sort((a, b) => b.stmtTotal - a.stmtTotal);
  return { buckets, total, files, fileCount: Object.keys(data).length };
}

/** Display order for known planner top-level dirs (unknown dirs still appear, sorted after). */
const PLANNER_BUCKETS = [
  "open3d",
  "editor",
  "asset-engine",
  "catalog",
  "model",
  "store",
  "hooks",
  "ui",
  "3d",
  "canvas",
  "export",
  "import",
  "sync",
  "api",
  "admin",
  "persistence",
  "shared",
  "lib",
  "components",
  "pages",
  "planner-root",
];

function plannerBucket(rel) {
  const m = rel.match(/^features\/planner\/([^/]+)/);
  return m ? m[1] : "planner-root";
}

const SITE_RULES = [
  ["features/site/data", /^features\/site\/data/],
  ["lib/catalog", /^lib\/catalog/],
  ["lib/configurator", /^lib\/configurator/],
  ["lib/catalog/site", /^features\/catalog/],
  ["features/shared", /^features\/shared/],
  ["features/site/assistant", /^features\/site\/assistant/],
  ["features/ops", /^features\/ops/],
  ["features/site/advisor", /^features\/site\/advisor\/aiadvisor/],
];

function siteBucket(rel) {
  for (const [name, re] of SITE_RULES) {
    if (re.test(rel)) return name;
  }
  return "unscoped";
}

function remarkForColumn(col, scope, m, target) {
  const gap = target - m.pct;
  const remarks = {
    statements: {
      low: `Only ${m.pct}% of executable statements run in tests; ${m.total - m.covered} statements never executed. Primary lever for raising overall %.`,
      mid: `${m.pct}% — meaningful execution but ${gap.toFixed(1)} pts below ${target}% target; expand happy-path + error-path tests.`,
      high: `${m.pct}% — near or above target; maintain on new code.`,
    },
    functions: {
      low: `${m.pct}% of functions invoked; many exported handlers/helpers never called — often UI callbacks or store actions.`,
      mid: `${m.pct}% — aligns with statements; add tests that call untested exports directly.`,
      high: `${m.pct}% — good function reach; watch thin wrappers re-exporting untested deps.`,
    },
    branches: {
      low: `${m.pct}% branch arms taken — conditionals, ternaries, &&/|| short-circuit largely untested; usually lags statements.`,
      mid: `${m.pct}% — add cases for if/else both sides, switch defaults, and error branches.`,
      high: `${m.pct}% — strong branch coverage; keep edge-case tables in tests.`,
    },
    lines: {
      low: `${m.pct}% of source lines hit — derived from statementMap (Vitest v8 omits \`l\` in coverage-final.json).`,
      mid: `${m.pct}% line reach — usually within ~2 pts of statements; blank/import-only lines excluded.`,
      high: `${m.pct}% — aligns with Vitest \`lines\` CI threshold; keep new code on green paths.`,
    },
  };
  const tier = m.pct < target * 0.5 ? "low" : m.pct < target * 0.85 ? "mid" : "high";
  const base = remarks[col][tier];
  if (scope.zeroStmtFiles > 0 && col === "statements") {
    return `${base} ${scope.zeroStmtFiles} file(s) at 0% statements in this bucket.`;
  }
  if (col === "branches" && m.pct < m.statements?.pct - 5) {
    return `${base} Branches trail statements by ${(m.statements.pct - m.pct).toFixed(1)} pts — typical for UI/conditional-heavy code.`;
  }
  return base;
}

function bucketRemark(name, b, target, universeStmts = 0) {
  const parts = [];
  if (b.zeroStmtFiles === b.files) {
    parts.push("Entire bucket untested — high ROI if in critical path.");
  } else if (b.zeroStmtFiles > b.files * 0.5) {
    parts.push(`Majority of files (${b.zeroStmtFiles}/${b.files}) at 0% — slice tests here for fast gains.`);
  } else if (b.statements.pct >= target * 0.85) {
    parts.push("Near target — protect with threshold ratchet.");
  } else if (isLargeBucket(b.statements.total, universeStmts)) {
    const share = universeStmts
      ? ((100 * b.statements.total) / universeStmts).toFixed(1)
      : "?";
    parts.push(
      `Large share of this run (${share}% of stmts) — prioritize domain/hooks over presentational TSX.`,
    );
  } else if (b.statements.pct > target * 0.45) {
    parts.push("Already partially covered — extend existing test files.");
  } else {
    parts.push("Early slice candidate — grow tests against live gaps, not frozen plans.");
  }
  return parts.join(" ");
}

function mdTableRow(cells) {
  return `| ${cells.join(" | ")} |`;
}

function formatMetric(m) {
  return `${m.pct}% (${m.covered}/${m.total})`;
}

function buildScopeSection(title, analysis, target, bucketOrder) {
  const t = analysis.total;
  const universeStmts = t.statements.total;
  const lines = [];
  lines.push(`## ${title}`);
  lines.push("");
  lines.push(
    `**Files in scope:** ${analysis.fileCount} · **Zero-statement files:** ${t.zeroStmtFiles} · **Stmts (this run):** ${universeStmts}`,
  );
  lines.push("");
  lines.push("### Rollup by metric");
  lines.push("");
  lines.push(mdTableRow(["Metric", "Covered / Total", "%", `Target`, "Remarks"]));
  lines.push(mdTableRow(["---", "---", "---", "---", "---"]));

  const cols = [
    ["Statements", t.statements, target],
    ["Functions", t.functions, target],
    ["Branches", t.branches, target],
    ["Lines", t.lines, target],
  ];

  for (const [label, m, tgt] of cols) {
    const colKey = label.toLowerCase();
    const scopeCtx = { zeroStmtFiles: t.zeroStmtFiles, statements: t.statements };
    const remark = remarkForColumn(colKey, scopeCtx, m, tgt);
    lines.push(
      mdTableRow([
        label,
        `${m.covered} / ${m.total}`,
        `${m.pct}%`,
        `${tgt}%`,
        remark,
      ]),
    );
  }

  lines.push("");
  lines.push(
    "**Lines source:** Counts above use `scripts/coverage-metrics.mjs` — reads `l` when present, otherwise derives from `statementMap` + `s` (same basis as Vitest's `lines` threshold).",
  );
  lines.push("");

  lines.push("### By subfolder");
  lines.push("");
  lines.push(
    mdTableRow([
      "Subfolder",
      "Statements",
      "Functions",
      "Branches",
      "Lines",
      "Files",
      "0% files",
      "Remarks",
    ]),
  );
  lines.push(
    mdTableRow(["---", "---", "---", "---", "---", "---", "---", "---"]),
  );

  const entries = Object.entries(analysis.buckets).sort(
    (a, b) => b[1].statements.total - a[1].statements.total,
  );

  const order = bucketOrder || entries.map(([k]) => k);
  const sorted = [
    ...order.filter((k) => analysis.buckets[k]).map((k) => [k, analysis.buckets[k]]),
    ...entries.filter(([k]) => !order.includes(k)),
  ];

  for (const [name, b] of sorted) {
    lines.push(
      mdTableRow([
        `\`${name}/\``,
        formatMetric(b.statements),
        formatMetric(b.functions),
        formatMetric(b.branches),
        formatMetric(b.lines),
        String(b.files),
        String(b.zeroStmtFiles),
        bucketRemark(name, b, target, universeStmts),
      ]),
    );
  }

  lines.push("");
  lines.push("### Largest untested files (by statement count)");
  lines.push("");
  const zeros = analysis.files
    .filter((f) => f.stmtTotal > 0 && f.stmtCovered === 0)
    .slice(0, 15);
  if (zeros.length === 0) {
    lines.push("_None — all files with statements have some coverage._");
  } else {
    lines.push(mdTableRow(["File", "Statements", "Share of run", "Remarks"]));
    lines.push(mdTableRow(["---", "---", "---", "---"]));
    for (const f of zeros) {
      const share = universeStmts
        ? `${((100 * f.stmtTotal) / universeStmts).toFixed(2)}%`
        : "—";
      lines.push(
        mdTableRow([
          `\`${f.rel}\``,
          String(f.stmtTotal),
          share,
          isHighMassFile(f.stmtTotal, universeStmts)
            ? "High mass *in this run* — single file test can move rollup %"
            : "Quick win — small isolated module *relative to this run*",
        ]),
      );
    }
  }
  lines.push("");
  return lines;
}

const summary = JSON.parse(
  fs.readFileSync(path.join(workspaceRoot, "results/coverage-summary.json"), "utf8"),
);
const planner = analyze(
  path.join(workspaceRoot, "results/coverage/coverage-final.json"),
  plannerBucket,
);
const site = analyze(
  path.join(workspaceRoot, "results/coverage-site/coverage-final.json"),
  siteBucket,
);

// Live policy only — no frozen "20/21/14/15" CI strings from old vitest floors
const gatePlanner = COVERAGE_GATE_PLANNER.statements;
const gateSite = COVERAGE_GATE_SITE.statements;
const threshPlanner = `${COVERAGE_GATE_PLANNER.statements}/${COVERAGE_GATE_PLANNER.functions}/${COVERAGE_GATE_PLANNER.branches}/${COVERAGE_GATE_PLANNER.lines} (stmt/fn/br/line)`;
const threshSite = `${COVERAGE_GATE_SITE.statements}/${COVERAGE_GATE_SITE.functions}/${COVERAGE_GATE_SITE.branches}/${COVERAGE_GATE_SITE.lines} (stmt/fn/br/line)`;

const plannerFinal = JSON.parse(
  fs.readFileSync(
    path.join(workspaceRoot, "results/coverage/coverage-final.json"),
    "utf8",
  ),
);
const dual = dualRollupFromFinal(plannerFinal);

const out = [];
out.push("# Coverage report (Vitest v8)");
out.push("");
out.push(
  `Regenerate: \`npm run docs:sync:coverage\` · Source: \`results/coverage-summary.json\` · **${summary.generatedAt}**`,
);
out.push("");
out.push("## Executive summary");
out.push("");
out.push(
  "**Policy (2026-07-09):** include-first **gate allowlist** for planner (not `features/planner/**`). See `coverage-policy.mjs` + `vitest.shared.ts`. Inventory profile has no threshold.",
);
out.push("");
out.push("### Dual rollup (this planner coverage-final)");
out.push("");
out.push(
  `| View | Statements | Lines | Files |`,
);
out.push("| --- | --- | --- | --- |");
out.push(
  `| FULL (gate include on disk) | ${dual.full.statements.pct}% (${dual.full.statements.covered}/${dual.full.statements.total}) | ${dual.full.lines.pct}% | ${dual.filesFull} |`,
);
out.push(
  `| TOUCHED only | ${dual.touched.statements.pct}% (${dual.touched.statements.covered}/${dual.touched.statements.total}) | ${dual.touched.lines.pct}% | ${dual.filesTouched} |`,
);
out.push("");
function trackStatus(actualPct, gatePct) {
  const gap = Math.round((gatePct - actualPct) * 10) / 10;
  if (actualPct >= gatePct) return `At or above gate (${gatePct}%)`;
  if (actualPct > 0) return `**${gap} pts** below ${gatePct}% gate`;
  return "No coverage data";
}

out.push(
  "| Track | Scope | Statements | Functions | Branches | Lines | Gate (policy) | Status |",
);
out.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
out.push(
  mdTableRow([
    "Planner gate",
    "allowlist (`vitest.shared` GATE include)",
    formatMetric(planner.total.statements),
    formatMetric(planner.total.functions),
    formatMetric(planner.total.branches),
    formatMetric(planner.total.lines),
    threshPlanner,
    trackStatus(planner.total.statements.pct, gatePlanner),
  ]),
);
out.push(
  mdTableRow([
    "Site gate",
    "scoped site include (`vitest.site.config.ts`)",
    formatMetric(site.total.statements),
    formatMetric(site.total.functions),
    formatMetric(site.total.branches),
    formatMetric(site.total.lines),
    threshSite,
    trackStatus(site.total.statements.pct, gateSite),
  ]),
);
out.push("");
out.push("### Cross-cutting remarks");
out.push("");
out.push(
  "1. **Statements** are the most reliable rollup column — each executable statement ran at least once.",
);
out.push(
  "2. **Functions** — re-export-only files can show 0 functions despite imports.",
);
out.push(
  "3. **Branches** often trail statements on UI/config-heavy code; gate bar is lower for branches.",
);
out.push(
  "4. **Lines** derived from `statementMap` when Vitest v8 omits `l`.",
);
out.push(
  `5. Gate denominator files: **${planner.fileCount}** planner-gate · **${site.fileCount}** site (0% files: ${planner.total.zeroStmtFiles} / ${site.total.zeroStmtFiles}).`,
);
out.push(
  "6. Do **not** chase 90% full-monorepo inventory. Expand allowlist only when tests own the file.",
);
out.push("");
out.push(...buildScopeSection("Planner track", planner, gatePlanner, PLANNER_BUCKETS));
out.push(...buildScopeSection("Site track", site, gateSite, SITE_RULES.map(([n]) => n)));

const outPath = path.join(workspaceRoot, "results/COVERAGE-REPORT.md");
fs.writeFileSync(outPath, out.join("\n") + "\n", "utf8");
console.log(`Wrote ${outPath}`);
console.log(`Planner: ${planner.total.statements.pct}% · buckets: ${Object.keys(planner.buckets).length}`);
console.log(`Site: ${site.total.statements.pct}% · buckets: ${Object.keys(site.buckets).length}`);
