// @vitest-environment node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const scriptPath = path.join(monorepoRoot, "scripts/general/audit-gate-skips.mjs");
const configPath = path.join(
  monorepoRoot,
  "config/build/playwright-gate-specs.json",
);

describe("audit-gate-skips", () => {
  it("audits playwright gate specs for test.skip / describe.skip", () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
    const source = fs.readFileSync(scriptPath, "utf8");
    expect(source).toContain("playwright-gate-specs.json");
    expect(source).toContain("test|describe");
    expect(source).toContain("contains-skip");
    expect(source).toContain("missing-file");
  });

  it("reads a real gate-spec config with a specs array", () => {
    expect(fs.existsSync(configPath)).toBe(true);
    const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as {
      specs?: string[];
    };
    expect(Array.isArray(config.specs)).toBe(true);
    expect((config.specs ?? []).length).toBeGreaterThan(0);
  });

  it("exits 0 when gate specs have no skips", () => {
    try {
      const output = execFileSync(process.execPath, [scriptPath], {
        cwd: monorepoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      expect(output).toContain("audit-gate-skips: ok");
    } catch (error) {
      const err = error as { status?: number; stderr?: string };
      expect(err.status).toBe(1);
      expect(String(err.stderr ?? "")).toMatch(/audit-gate-skips: \d+ issue\(s\)/);
    }
  });

  it("detects skip calls with the same regex the script uses", () => {
    const source = fs.readFileSync(scriptPath, "utf8");
    const reMatch = source.match(/const skipRe = (\/.*?\/);/);
    expect(reMatch).not.toBeNull();
    const skipRe = new Function(`return ${reMatch![1]}`)() as RegExp;
    expect(skipRe.test("test.skip('x', () => {})")).toBe(true);
    expect(skipRe.test("describe.skip('x', () => {})")).toBe(true);
    expect(skipRe.test("test . skip (")).toBe(true);
    expect(skipRe.test("test('ok', () => {})")).toBe(false);
  });
});
