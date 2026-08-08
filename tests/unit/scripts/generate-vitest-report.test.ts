// @vitest-environment node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const scriptPath = path.join(siteRoot, "scripts/generate-vitest-report.mjs");

describe("generate-vitest-report (name-mirror)", () => {
  it("flattens vitest JSON into sibling CSV and HTML reports", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vitest-report-"));
    try {
      const jsonPath = path.join(tmp, "sample-results.json");
      fs.writeFileSync(
        jsonPath,
        JSON.stringify({
          numTotalTests: 2,
          numPassedTests: 1,
          numFailedTests: 1,
          success: false,
          testResults: [
            {
              name: "suite-a.test.ts",
              assertionResults: [
                {
                  fullName: "suite-a passes",
                  title: "passes",
                  status: "passed",
                  duration: 12.5,
                  failureMessages: [],
                },
                {
                  fullName: "suite-a fails",
                  title: "fails",
                  status: "failed",
                  duration: 3,
                  failureMessages: ["expected 1 to be 2"],
                },
              ],
            },
          ],
        }),
        "utf8",
      );

      const output = execFileSync(process.execPath, [scriptPath, jsonPath], {
        cwd: siteRoot,
        encoding: "utf8",
      });

      expect(output).toContain(`Vitest CSV report: ${path.join(tmp, "sample-results.csv")}`);
      expect(output).toContain(`Vitest HTML report: ${path.join(tmp, "sample-results.html")}`);

      const csv = fs.readFileSync(path.join(tmp, "sample-results.csv"), "utf8");
      expect(csv).toContain('"suite","test","status","duration_ms","failure_message"');
      expect(csv).toContain("suite-a passes");
      expect(csv).toContain("failed");
      expect(csv).toContain("total_tests=2");
      expect(csv).toContain("passed_tests=1");
      expect(csv).toContain("failed_tests=1");
      expect(csv).toContain("success=false");

      const html = fs.readFileSync(path.join(tmp, "sample-results.html"), "utf8");
      expect(html).toContain("<title>Vitest Report</title>");
      expect(html).toContain("suite-a fails");
      expect(html).toContain("expected 1 to be 2");
      expect(html).toContain("class=\"fail\"");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("exits non-zero when the input JSON report is missing", () => {
    const missing = path.join(os.tmpdir(), `missing-vitest-${Date.now()}.json`);
    expect(() =>
      execFileSync(process.execPath, [scriptPath, missing], {
        cwd: siteRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }),
    ).toThrow();
  });
});
