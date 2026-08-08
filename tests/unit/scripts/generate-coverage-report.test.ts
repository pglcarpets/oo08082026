// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

import { generateCoverageReport } from "../../../scripts/generate-coverage-report.mjs";

const scriptPath = path.join(siteRoot, "scripts/generate-coverage-report.mjs");

describe("generate-coverage-report (name-mirror)", () => {
  it("exports generateCoverageReport and profiles planner/site", () => {
    const src = fs.readFileSync(scriptPath, "utf8");
    expect(src).toContain("export function generateCoverageReport");
    expect(src).toContain("results/coverage-reports/planner");
    expect(src).toContain("results/coverage-reports/site");
    expect(typeof generateCoverageReport).toBe("function");
  });

  it("writes csv html json reports from temp coverage summary", () => {
    const tmpCwd = fs.mkdtempSync(path.join(os.tmpdir(), "oando-cov-nm-"));
    try {
      const dataDir = path.join(tmpCwd, "results", "coverage");
      const reportDir = path.join(tmpCwd, "results", "coverage-reports", "planner");
      fs.mkdirSync(dataDir, { recursive: true });
      const absFile = path.join(tmpCwd, "features", "demo.ts").replace(/\\/g, "/");
      fs.mkdirSync(path.dirname(absFile), { recursive: true });
      fs.writeFileSync(absFile, "export const x = 1;\n");
      const summary = {
        total: {
          lines: { total: 1, covered: 1, skipped: 0, pct: 100 },
          statements: { total: 1, covered: 1, skipped: 0, pct: 100 },
          functions: { total: 0, covered: 0, skipped: 0, pct: 100 },
          branches: { total: 0, covered: 0, skipped: 0, pct: 100 },
        },
        [absFile]: {
          lines: { total: 1, covered: 1, skipped: 0, pct: 100 },
          statements: { total: 1, covered: 1, skipped: 0, pct: 100 },
          functions: { total: 0, covered: 0, skipped: 0, pct: 100 },
          branches: { total: 0, covered: 0, skipped: 0, pct: 100 },
        },
      };
      fs.writeFileSync(path.join(dataDir, "coverage-summary.json"), JSON.stringify(summary));
      fs.writeFileSync(path.join(dataDir, "coverage-final.json"), JSON.stringify({}));
      const ok = generateCoverageReport("planner", tmpCwd);
      expect(ok).toBe(true);
      expect(fs.existsSync(path.join(reportDir, "coverage-report.csv"))).toBe(true);
      expect(fs.existsSync(path.join(reportDir, "coverage-report.html"))).toBe(true);
      expect(fs.existsSync(path.join(reportDir, "coverage-report.json"))).toBe(true);
      const json = JSON.parse(
        fs.readFileSync(path.join(reportDir, "coverage-report.json"), "utf8"),
      );
      expect(json.total.lines.pct).toBe(100);
      expect(json.profile).toBe("planner");
    } finally {
      fs.rmSync(tmpCwd, { recursive: true, force: true });
    }
  });

  it("returns false for unknown profile or missing data", () => {
    const tmpCwd = fs.mkdtempSync(path.join(os.tmpdir(), "oando-cov-empty-"));
    try {
      expect(() => generateCoverageReport("nope", tmpCwd)).toThrow(/Unknown coverage profile/);
      expect(generateCoverageReport("planner", tmpCwd)).toBe(false);
    } finally {
      fs.rmSync(tmpCwd, { recursive: true, force: true });
    }
  });
});
