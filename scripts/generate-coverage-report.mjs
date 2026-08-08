/**
 * Build human-readable coverage reports from Vitest Istanbul output.
 *
 * Raw Vitest data:  results/coverage/ | results/coverage-site/
 * Reports output:  results/coverage-reports/planner/ | results/coverage-reports/site/
 *
 * Usage:
 *   node scripts/generate-coverage-report.mjs planner
 *   node scripts/generate-coverage-report.mjs site
 *   node scripts/generate-coverage-report.mjs all
 */
import fs from "node:fs";
import path from "node:path";
import { fileStatusVsGate } from "./coverage-policy.mjs";

const PROFILES = {
  planner: {
    label: "Planner (full Vitest profile)",
    dataDir: "results/coverage",
    reportDir: "results/coverage-reports/planner",
  },
  site: {
    label: "Site (vitest.site.config)",
    dataDir: "results/coverage-site",
    reportDir: "results/coverage-reports/site",
  },
  admin: {
    label: "Admin (vitest.admin.coverage.config)",
    dataDir: "results/coverage-admin",
    reportDir: "results/coverage-reports/admin",
  },
};

function resolveWorkspaceRoot(repoRoot = process.cwd()) {
  return path.basename(repoRoot) === "site" ? path.resolve(repoRoot, "..") : repoRoot;
}

const METRIC_KEYS = ["lines", "statements", "functions", "branches"];

function metricKeysForStats(stats) {
  const keys = [...METRIC_KEYS];
  if (stats?.branchesTrue) keys.push("branchesTrue");
  return keys;
}

function escapeCsv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizePathKey(filePath) {
  return filePath.replace(/\\/g, "/").toLowerCase();
}

function toRepoRelative(repoRoot, filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  const root = repoRoot.replace(/\\/g, "/").toLowerCase();
  const lower = normalized.toLowerCase();
  if (lower.startsWith(`${root}/`)) {
    return normalized.slice(root.length + 1);
  }
  return normalized;
}

/** @param {Record<string, unknown>} finalEntry */
function uncoveredLineNumbers(finalEntry) {
  if (!finalEntry || typeof finalEntry !== "object") return [];

  const lineHits = finalEntry.l ?? {};
  const directKeys = Object.keys(lineHits);
  if (directKeys.length > 0) {
    const uncovered = [];
    for (const line of directKeys) {
      if (lineHits[line] === 0) uncovered.push(Number(line));
    }
    return uncovered.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  }

  const statementMap = finalEntry.statementMap ?? {};
  const hits = finalEntry.s ?? {};
  const uncovered = new Set();
  for (const [id, count] of Object.entries(hits)) {
    if (count !== 0) continue;
    const line = statementMap[id]?.start?.line;
    if (typeof line === "number") uncovered.add(line);
  }
  return [...uncovered].sort((a, b) => a - b);
}

function formatMetricCells(metric) {
  const m = metric ?? { total: 0, covered: 0, skipped: 0, pct: 0 };
  return [m.total ?? 0, m.covered ?? 0, m.skipped ?? 0, m.pct ?? 0];
}

function lineStatus(pct) {
  // Bands relative to gate policy — never a frozen absolute mass total
  return fileStatusVsGate(pct, "lines");
}

function buildCsvHeader(metricKeys = METRIC_KEYS) {
  const cols = ["directory", "file", "relative_path"];
  for (const key of metricKeys) {
    cols.push(
      `${key}_total`,
      `${key}_covered`,
      `${key}_skipped`,
      `${key}_pct`,
    );
  }
  cols.push("uncovered_line_numbers", "status");
  return cols;
}

function buildCsvRow(relativePath, stats, uncoveredLines, metricKeys = METRIC_KEYS) {
  const directory = path.dirname(relativePath).replace(/\\/g, "/");
  const file = path.basename(relativePath);
  const cells = [directory, file, relativePath];

  for (const key of metricKeys) {
    cells.push(...formatMetricCells(stats?.[key]));
  }

  const linePct = stats?.lines?.pct ?? 0;
  cells.push(
    uncoveredLines.length > 0 ? uncoveredLines.join(", ") : "",
    lineStatus(linePct),
  );
  return cells;
}

function writeCsv(outputPath, totalStats, fileRows, metricKeys) {
  const header = buildCsvHeader(metricKeys);
  const lines = [header.map(escapeCsv).join(",")];

  if (totalStats) {
    lines.push(
      buildCsvRow("TOTAL", totalStats, [], metricKeys)
        .map((cell, index) => (index < 3 ? escapeCsv(cell === "TOTAL" ? "TOTAL" : cell) : escapeCsv(cell)))
        .join(","),
    );
  }

  for (const row of fileRows) {
    lines.push(row.map(escapeCsv).join(","));
  }

  fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
}

function metricCardsHtml(label, metric) {
  const m = metric ?? { total: 0, covered: 0, skipped: 0, pct: 0 };
  return `<div class="metric-card">
  <h3>${escapeHtml(label)}</h3>
  <div class="metric-grid">
    <div><span>Total</span><strong>${m.total ?? 0}</strong></div>
    <div><span>Covered</span><strong>${m.covered ?? 0}</strong></div>
    <div><span>Skipped</span><strong>${m.skipped ?? 0}</strong></div>
    <div><span>Pct</span><strong>${m.pct ?? 0}%</strong></div>
  </div>
</div>`;
}

function writeHtml(outputPath, profile, totalStats, fileRows, generatedAt, metricKeys) {
  const totalCards = metricKeys.map((key) =>
    metricCardsHtml(key, totalStats?.[key]),
  ).join("\n");

  const metricHeader = metricKeys
    .flatMap((key) => [
      `${key} total`,
      `${key} covered`,
      `${key} skipped`,
      `${key} %`,
    ])
    .map((label) => `<th>${escapeHtml(label)}</th>`)
    .join("");

  const bodyRows = fileRows
    .map((row) => {
      const status = row[row.length - 1];
      const uncovered = row[row.length - 2];
      const metrics = row.slice(3, row.length - 2);
      const statusClass =
        String(status).startsWith("PASS")
          ? "pass"
          : String(status).startsWith("PARTIAL")
            ? "partial"
            : "fail";

      const metricCells = metrics
        .map((value, index) => {
          const isPct = (index + 1) % 4 === 0;
          return `<td>${escapeHtml(value)}${isPct ? "%" : ""}</td>`;
        })
        .join("");

      return `<tr class="${statusClass}">
  <td>${escapeHtml(row[0])}</td>
  <td>${escapeHtml(row[1])}</td>
  <td><code>${escapeHtml(row[2])}</code></td>
  ${metricCells}
  <td><pre>${escapeHtml(uncovered)}</pre></td>
  <td>${escapeHtml(status)}</td>
</tr>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Coverage Report — ${escapeHtml(profile.label)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; color: #111; }
    h1 { margin-bottom: 0.25rem; }
    .meta { color: #555; margin-bottom: 1.25rem; }
    .totals { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .metric-card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
    .metric-card h3 { margin: 0 0 8px; font-size: 14px; text-transform: capitalize; }
    .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; font-size: 13px; }
    .metric-grid span { color: #666; display: block; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 6px; vertical-align: top; text-align: left; }
    th { background: #f5f5f5; position: sticky; top: 0; }
    tr.pass td:last-child { color: #0a7a2f; font-weight: 600; }
    tr.partial td:last-child { color: #9a6700; font-weight: 600; }
    tr.fail td:last-child { color: #b42318; font-weight: 600; }
    pre { white-space: pre-wrap; margin: 0; font-family: ui-monospace, monospace; font-size: 11px; max-width: 280px; }
    code { font-size: 11px; }
  </style>
</head>
<body>
  <h1>Coverage Report</h1>
  <p class="meta">${escapeHtml(profile.label)} · Generated ${escapeHtml(generatedAt)}</p>
  <section class="totals">${totalCards}</section>
  <table>
    <thead>
      <tr>
        <th>Directory</th>
        <th>File</th>
        <th>Relative path</th>
        ${metricHeader}
        <th>Uncovered lines</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${bodyRows}
    </tbody>
  </table>
</body>
</html>`;

  fs.writeFileSync(outputPath, html, "utf8");
}

function loadCoverageData(repoRoot, dataDir) {
  const summaryPath = path.join(repoRoot, dataDir, "coverage-summary.json");
  const finalPath = path.join(repoRoot, dataDir, "coverage-final.json");

  if (!fs.existsSync(summaryPath)) {
    return null;
  }

  const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
  const finalCov = fs.existsSync(finalPath)
    ? JSON.parse(fs.readFileSync(finalPath, "utf8"))
    : {};

  /** @type {Map<string, string>} */
  const finalByNorm = new Map();
  for (const key of Object.keys(finalCov)) {
    finalByNorm.set(normalizePathKey(key), key);
  }

  const totalStats = summary.total ?? null;
  const metricKeys = metricKeysForStats(totalStats);
  const fileRows = [];

  for (const [fileKey, stats] of Object.entries(summary)) {
    if (fileKey === "total") continue;

    const relativePath = toRepoRelative(repoRoot, fileKey);
    const finalKey = finalByNorm.get(normalizePathKey(fileKey));
    const uncoveredLines = uncoveredLineNumbers(finalCov[finalKey]);

    fileRows.push(
      buildCsvRow(relativePath, stats, uncoveredLines, metricKeys),
    );
  }

  fileRows.sort((a, b) => {
    const dirCmp = String(a[0]).localeCompare(String(b[0]));
    if (dirCmp !== 0) return dirCmp;
    return String(a[1]).localeCompare(String(b[1]));
  });

  return { totalStats, fileRows, metricKeys };
}

export function generateCoverageReport(profileKey, repoRoot = resolveWorkspaceRoot()) {
  const profile = PROFILES[profileKey];
  if (!profile) {
    throw new Error(`Unknown coverage profile: ${profileKey}`);
  }

  const loaded = loadCoverageData(repoRoot, profile.dataDir);
  if (!loaded) {
    console.warn(
      `generate-coverage-report: no ${profile.dataDir}/coverage-summary.json — skipped ${profileKey}`,
    );
    return false;
  }

  const reportDir = path.join(repoRoot, profile.reportDir);
  fs.mkdirSync(reportDir, { recursive: true });

  const generatedAt = new Date().toISOString();
  const csvPath = path.join(reportDir, "coverage-report.csv");
  const htmlPath = path.join(reportDir, "coverage-report.html");
  const jsonPath = path.join(reportDir, "coverage-report.json");

  writeCsv(csvPath, loaded.totalStats, loaded.fileRows, loaded.metricKeys);
  writeHtml(htmlPath, profile, loaded.totalStats, loaded.fileRows, generatedAt, loaded.metricKeys);

  const jsonPayload = {
    profile: profileKey,
    label: profile.label,
    generatedAt,
    source: profile.dataDir,
    total: loaded.totalStats,
    files: loaded.fileRows.map((row) => {
      const status = row[row.length - 1];
      const uncoveredLineNumbersList = String(row[row.length - 2])
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map(Number)
        .filter((n) => Number.isFinite(n));
      const metrics = {};
      let offset = 3;
      for (const key of loaded.metricKeys) {
        metrics[key] = {
          total: row[offset],
          covered: row[offset + 1],
          skipped: row[offset + 2],
          pct: row[offset + 3],
        };
        offset += 4;
      }
      return {
        directory: row[0],
        file: row[1],
        relativePath: row[2],
        ...metrics,
        uncoveredLineNumbers: uncoveredLineNumbersList,
        status,
      };
    }),
  };

  fs.writeFileSync(jsonPath, JSON.stringify(jsonPayload, null, 2), "utf8");

  console.log(`Coverage CSV:  ${csvPath}`);
  console.log(`Coverage HTML: ${htmlPath}`);
  console.log(`Coverage JSON: ${jsonPath}`);
  return true;
}

function isMain() {
  const entry = process.argv[1] ?? "";
  return entry.endsWith("generate-coverage-report.mjs");
}

if (isMain()) {
  const arg = (process.argv[2] ?? "planner").toLowerCase();
  const profiles =
    arg === "all" ? Object.keys(PROFILES) : [arg in PROFILES ? arg : "planner"];

  let any = false;
  for (const profileKey of profiles) {
    if (generateCoverageReport(profileKey)) any = true;
  }
  if (!any) {
    process.exitCode = 1;
  }
}
