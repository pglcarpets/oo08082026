// @vitest-environment node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const scriptPath = path.join(
  monorepoRoot,
  "scripts",
  "general",
  "audit-" + "eslint" + "-" + "disable" + ".mjs",
);

describe("audit " + "eslint" + " suppress directives", () => {
  const token = "eslint" + "-" + "disable";

  it("scans site product trees plus tests/scripts (not monorepo-root app/)", () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
    const source = fs.readFileSync(scriptPath, "utf8");
    expect(source).toContain(token);
    expect(source).toContain("site/app");
    expect(source).toContain("site/features");
    expect(source).toContain("site/lib");
    expect(source).not.toMatch(/SCAN_DIRS = \["app", "components"/);
  });

  it("exits 0 when a synthetic monorepo has no suppress comments", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "eslint-audit-clean-"));
    try {
      for (const dir of [
        "site/app",
        "site/components",
        "site/features",
        "site/lib",
        "tests",
        "scripts",
      ]) {
        fs.mkdirSync(path.join(tmp, dir), { recursive: true });
      }
      fs.writeFileSync(
        path.join(tmp, "site/app", "ok.ts"),
        "export const x = 1;\n",
        "utf8",
      );
      const output = execFileSync(process.execPath, [scriptPath], {
        cwd: monorepoRoot,
        encoding: "utf8",
        env: { ...process.env, MONOREPO_ROOT: tmp },
        stdio: ["ignore", "pipe", "pipe"],
      });
      expect(output).toContain("audit-" + token + ": ok");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("exits 1 when site product source contains a suppress directive", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "eslint-audit-bad-"));
    try {
      fs.mkdirSync(path.join(tmp, "site/lib"), { recursive: true });
      fs.writeFileSync(
        path.join(tmp, "site/lib", "bad.ts"),
        `// ${token}-next-line no-console\nconsole.log(1);\n`,
        "utf8",
      );
      let failed = false;
      let stderr = "";
      try {
        execFileSync(process.execPath, [scriptPath], {
          cwd: monorepoRoot,
          encoding: "utf8",
          env: { ...process.env, MONOREPO_ROOT: tmp },
          stdio: ["ignore", "pipe", "pipe"],
        });
      } catch (error) {
        failed = true;
        const err = error as {
          status?: number;
          stderr?: string;
          stdout?: string;
        };
        expect(err.status).toBe(1);
        stderr = `${err.stderr ?? ""}${err.stdout ?? ""}`;
      }
      expect(failed).toBe(true);
      expect(stderr).toMatch(new RegExp(`audit-${token}: \\d+ file\\(s\\)`));
      expect(stderr.replaceAll("\\", "/")).toContain("site/lib/bad.ts");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("matches suppress, suppress-line, and suppress-next-line directives", () => {
    const source = fs.readFileSync(scriptPath, "utf8");
    const reMatch = source.match(/const DISABLE_RE = (\/.*?\/);/);
    expect(reMatch).not.toBeNull();
    const DISABLE_RE = new Function(`return ${reMatch![1]}`)() as RegExp;
    expect(DISABLE_RE.test("// " + token)).toBe(true);
    expect(DISABLE_RE.test("// " + token + "-line no-console")).toBe(true);
    expect(DISABLE_RE.test("// " + token + "-next-line @ts-ignore")).toBe(true);
    expect(DISABLE_RE.test("const x = 1")).toBe(false);
  });
});
