// @vitest-environment node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const scriptPath = path.join(siteRoot, "scripts/check-marketing-inline-style.mjs");

describe("check-marketing-inline-style (name-mirror)", () => {
  it("emits a structured ok or failure report for marketing style attrs", () => {
    let code = 0;
    let out = "";
    try {
      out = execFileSync(process.execPath, [scriptPath], {
        cwd: siteRoot,
        encoding: "utf8",
      });
    } catch (error) {
      const err = error as { status?: number; stderr?: string; stdout?: string };
      code = err.status ?? 1;
      out = `${err.stderr ?? ""}${err.stdout ?? ""}`;
    }

    if (code === 0) {
      expect(out).toContain("check-marketing-inline-style: ok");
    } else {
      expect(code).toBe(1);
      expect(out).toMatch(/check-marketing-inline-style: \d+ file/);
      expect(out).toMatch(/\.tsx/);
    }
  });
});
