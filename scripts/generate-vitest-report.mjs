import fs from "node:fs";
import path from "node:path";

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

function flattenTests(testResults = []) {
  const rows = [];

  for (const suite of testResults) {
    const suiteName = suite.name ?? "unknown-suite";

    for (const result of suite.assertionResults ?? []) {
      rows.push({
        suite: suiteName,
        name: result.fullName ?? result.title ?? "unknown-test",
        status: result.status ?? "unknown",
        durationMs: typeof result.duration === "number" ? result.duration : "",
        failureMessages: Array.isArray(result.failureMessages)
          ? result.failureMessages.join("\n")
          : "",
      });
    }
  }

  return rows;
}

function writeCsv(outputPath, summary, rows, coverageLink, consoleReport) {
  const header = [
    "suite",
    "test",
    "status",
    "duration_ms",
    "failure_message",
  ];

  const lines = [
  header.map(escapeCsv).join(","),
  ...rows.map((row) =>
    [
      row.suite,
      row.name,
      row.status,
      row.durationMs,
      row.failureMessages,
    ]
      .map(escapeCsv)
      .join(","),
  ),
  "",
  escapeCsv("summary"),
  escapeCsv(`total_tests=${summary.numTotalTests ?? 0}`),
  escapeCsv(`passed_tests=${summary.numPassedTests ?? 0}`),
  escapeCsv(`failed_tests=${summary.numFailedTests ?? 0}`),
  escapeCsv(`success=${summary.success === true}`),
  escapeCsv(`console_entries=${consoleReport.consoleCount}`),
  escapeCsv(`stderr_entries=${consoleReport.stderrCount}`),
  escapeCsv(`stdout_entries=${consoleReport.stdoutCount}`),
  escapeCsv(`console_report=${consoleReport.path}`),
  ];

  if (coverageLink?.payload?.total) {
    const total = coverageLink.payload.total;
    lines.push("");
    lines.push(escapeCsv("coverage_summary"));
    for (const key of ["lines", "statements", "functions", "branches"]) {
      const m = total[key] ?? {};
      lines.push(
        escapeCsv(
          `${key}_total=${m.total ?? 0};${key}_covered=${m.covered ?? 0};${key}_skipped=${m.skipped ?? 0};${key}_pct=${m.pct ?? 0}`,
        ),
      );
    }
    lines.push(escapeCsv(`coverage_report=${coverageLink.reportJson}`));
  }

  fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
}

function loadCoverageReportLink(jsonPath) {
  const base = path.basename(jsonPath, ".json");
  const profile = base.includes("site") ? "site" : "planner";
  const resultsRoot = path.resolve(path.dirname(jsonPath), "..", "..");
  const reportDir = path.join(
    resultsRoot,
    "coverage-reports",
    profile,
  );
  const html = path.join(reportDir, "coverage-report.html");
  const csv = path.join(reportDir, "coverage-report.csv");
  const reportJson = path.join(reportDir, "coverage-report.json");

  if (!fs.existsSync(reportJson)) return null;
  const payload = JSON.parse(fs.readFileSync(reportJson, "utf8"));
  return { profile, html, csv, reportJson, payload };
}

function loadConsoleReport(jsonPath) {
  const base = path.basename(jsonPath, ".json");
  const profile = base.includes("site") ? "vitest-site" : "vitest";
  const consolePath = path.join(path.dirname(jsonPath), `${profile}-console.json`);

  if (!fs.existsSync(consolePath)) {
    return {
      path: consolePath,
      consoleCount: 0,
      stderrCount: 0,
      stdoutCount: 0,
      entries: [],
      missing: true,
    };
  }

  const payload = JSON.parse(fs.readFileSync(consolePath, "utf8"));
  return {
    path: consolePath,
    consoleCount: Number(payload.consoleCount) || 0,
    stderrCount: Number(payload.stderrCount) || 0,
    stdoutCount: Number(payload.stdoutCount) || 0,
    entries: Array.isArray(payload.entries) ? payload.entries : [],
    missing: false,
  };
}

function coverageSummaryHtml(link) {
  if (!link?.payload?.total) {
    return `<p class="meta">No coverage report found. Run <code>npm run test:coverage${link?.profile === "site" ? ":site" : ":planner"}</code>.</p>`;
  }

  const total = link.payload.total;
  const cards = ["lines", "statements", "functions", "branches"]
    .map((key) => {
      const m = total[key] ?? {};
      return `<div class="card"><strong>${key}</strong><div>${m.covered ?? 0}/${m.total ?? 0} (${m.pct ?? 0}%)</div><div class="sub">skipped: ${m.skipped ?? 0}</div></div>`;
    })
    .join("\n");

  return `<section class="coverage">
  <h2>Coverage</h2>
  <p class="meta">Profile: ${escapeHtml(link.profile)} · <a href="file:///${link.html.replace(/\\/g, "/")}">coverage-report.html</a> · <a href="file:///${link.csv.replace(/\\/g, "/")}">coverage-report.csv</a></p>
  <div class="summary">${cards}</div>
</section>`;
}

function consoleSummaryHtml(report) {
  if (report.missing) {
    return `<section><h2>Console output</h2><p class="meta">Console artifact missing: <code>${escapeHtml(report.path)}</code></p></section>`;
  }

  const rows = report.entries
    .map(
      (entry) => `<tr>
  <td>${escapeHtml(entry.type || "unknown")}</td>
  <td>${escapeHtml(entry.testName || entry.origin || entry.taskId || "unknown")}</td>
  <td><pre>${escapeHtml(entry.content)}</pre></td>
</tr>`,
    )
    .join("\n");

  return `<section>
  <h2>Console output (${report.consoleCount})</h2>
  <p class="meta">stderr: ${report.stderrCount} · stdout: ${report.stdoutCount}</p>
  <p class="meta">Raw artifact: <code>${escapeHtml(report.path)}</code></p>
  <table>
    <thead><tr><th>Stream</th><th>Origin</th><th>Output</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</section>`;
}

function writeHtml(outputPath, summary, rows, coverageLink, consoleReport) {
  const failedRows = rows.filter((row) => row.status === "failed");
  const generatedAt = new Date().toISOString();

  const bodyRows = rows
    .map((row) => {
      const statusClass = row.status === "passed" ? "pass" : row.status === "failed" ? "fail" : "other";
      return `<tr class="${statusClass}">
  <td>${escapeHtml(row.suite)}</td>
  <td>${escapeHtml(row.name)}</td>
  <td>${escapeHtml(row.status)}</td>
  <td>${escapeHtml(row.durationMs)}</td>
  <td><pre>${escapeHtml(row.failureMessages)}</pre></td>
</tr>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vitest Report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; color: #111; }
    h1 { margin-bottom: 0.25rem; }
    .meta { color: #555; margin-bottom: 1rem; }
    .summary { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px 16px; min-width: 140px; }
    .card .sub { color: #666; font-size: 12px; margin-top: 4px; }
    .coverage { margin: 24px 0; }
    .coverage h2 { margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; text-align: left; }
    th { background: #f5f5f5; }
    tr.pass td:nth-child(3) { color: #0a7a2f; }
    tr.fail td:nth-child(3) { color: #b42318; font-weight: 600; }
    pre { white-space: pre-wrap; margin: 0; font-family: ui-monospace, monospace; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Vitest Report</h1>
  <p class="meta">Generated ${escapeHtml(generatedAt)}</p>
  <div class="summary">
    <div class="card"><strong>Total</strong><div>${summary.numTotalTests ?? 0}</div></div>
    <div class="card"><strong>Passed</strong><div>${summary.numPassedTests ?? 0}</div></div>
    <div class="card"><strong>Failed</strong><div>${summary.numFailedTests ?? 0}</div></div>
    <div class="card"><strong>Success</strong><div>${summary.success === true ? "yes" : "no"}</div></div>
    <div class="card"><strong>Failed suites</strong><div>${failedRows.length}</div></div>
    <div class="card"><strong>Console entries</strong><div>${consoleReport.consoleCount}</div></div>
    <div class="card"><strong>Stderr entries</strong><div>${consoleReport.stderrCount}</div></div>
  </div>
  ${coverageSummaryHtml(coverageLink)}
  ${consoleSummaryHtml(consoleReport)}
  <h2>Tests</h2>
  <table>
    <thead>
      <tr>
        <th>Suite</th>
        <th>Test</th>
        <th>Status</th>
        <th>Duration (ms)</th>
        <th>Failure</th>
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

function resolveOutputs(jsonPath) {
  const base = path.basename(jsonPath, ".json");
  const dir = path.dirname(jsonPath);
  return {
    json: jsonPath,
    csv: path.join(dir, `${base}.csv`),
    html: path.join(dir, `${base}.html`),
  };
}

function generateReport(jsonPath) {
  if (!fs.existsSync(jsonPath)) {
    console.error(`Vitest JSON report not found: ${jsonPath}`);
    process.exitCode = 1;
    return;
  }

  const payload = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const rows = flattenTests(payload.testResults);
  const outputs = resolveOutputs(jsonPath);
  const coverageLink = loadCoverageReportLink(jsonPath);
  const consoleReport = loadConsoleReport(jsonPath);

  fs.mkdirSync(path.dirname(outputs.csv), { recursive: true });
  writeCsv(outputs.csv, payload, rows, coverageLink, consoleReport);
  writeHtml(outputs.html, payload, rows, coverageLink, consoleReport);

  console.log(`Vitest CSV report: ${outputs.csv}`);
  console.log(`Vitest HTML report: ${outputs.html}`);
}

const defaultResultsRoot = path.basename(process.cwd()) === "site"
  ? path.resolve(process.cwd(), "..", "results")
  : path.resolve(process.cwd(), "results");
const input = process.argv[2] ?? path.join(defaultResultsRoot, "tests/vitest-results.json");
generateReport(path.resolve(process.cwd(), input));
