// @vitest-environment node
/**
 * Contract: config/build/playwright-gate-specs.json lists release:gate Playwright specs.
 * Every declared relative path must exist under site/.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const siteRoot = path.resolve(__dirname, "../../../..");
const manifestPath = path.join(
  siteRoot,
  "config",
  "build",
  "playwright-gate-specs.json",
);

type GateManifest = {
  version?: number;
  description?: string;
  specs: string[];
  excluded?: string[];
};

describe("playwright-gate-specs.json", () => {
  it("exists and is valid JSON", () => {
    expect(fs.existsSync(manifestPath), manifestPath).toBe(true);
    const raw = fs.readFileSync(manifestPath, "utf8");
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it("declares a non-empty specs array (or object) of relative paths", () => {
    const manifest = JSON.parse(
      fs.readFileSync(manifestPath, "utf8"),
    ) as GateManifest;

    expect(manifest.version ?? 1).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(manifest.specs), "specs must be an array").toBe(true);
    expect(manifest.specs.length).toBeGreaterThan(0);

    for (const rel of manifest.specs) {
      expect(typeof rel, "spec entry must be string").toBe("string");
      expect(rel.trim().length, `empty spec path: ${JSON.stringify(rel)}`).toBeGreaterThan(0);
      expect(rel.endsWith(".spec.ts"), rel).toBe(true);
      expect(path.isAbsolute(rel), `must be relative: ${rel}`).toBe(false);
    }
  });

  it("every listed relative path exists under site/", () => {
    const manifest = JSON.parse(
      fs.readFileSync(manifestPath, "utf8"),
    ) as GateManifest;

    for (const rel of manifest.specs) {
      const abs = path.join(siteRoot, rel);
      expect(fs.existsSync(abs), `missing gate spec: ${rel}`).toBe(true);
      expect(fs.statSync(abs).isFile(), `not a file: ${rel}`).toBe(true);
    }
  });

  it("excluded entries (if present) are non-empty strings", () => {
    const manifest = JSON.parse(
      fs.readFileSync(manifestPath, "utf8"),
    ) as GateManifest;

    if (manifest.excluded === undefined) return;
    expect(Array.isArray(manifest.excluded)).toBe(true);
    for (const rel of manifest.excluded) {
      expect(typeof rel).toBe("string");
      expect(rel.trim().length).toBeGreaterThan(0);
    }
  });

  it("specs have no duplicates", () => {
    const manifest = JSON.parse(
      fs.readFileSync(manifestPath, "utf8"),
    ) as GateManifest;
    const seen = new Set<string>();
    for (const rel of manifest.specs) {
      expect(seen.has(rel), `duplicate spec: ${rel}`).toBe(false);
      seen.add(rel);
    }
  });

  it("includes every Playwright path from release:gate e2e scripts", () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(siteRoot, "package.json"), "utf8"),
    ) as { scripts?: Record<string, string> };
    const scripts = packageJson.scripts ?? {};
    const releaseGate = scripts["release:gate"] ?? "";
    expect(releaseGate, "release:gate script missing").toContain("test:a11y");
    expect(releaseGate).toContain("test:planner-catalog");

    const a11y = scripts["test:a11y"] ?? "";
    const plannerCatalog = scripts["test:planner-catalog"] ?? "";
    const fromScripts = new Set<string>();
    for (const script of [a11y, plannerCatalog]) {
      for (const match of script.matchAll(/tests\/e2e\/[\w.-]+\.spec\.ts/g)) {
        fromScripts.add(match[0]);
      }
    }
    expect(fromScripts.size, "expected e2e specs in gate scripts").toBeGreaterThan(0);

    const manifest = JSON.parse(
      fs.readFileSync(manifestPath, "utf8"),
    ) as GateManifest;
    const listed = new Set(manifest.specs);
    for (const rel of fromScripts) {
      expect(listed.has(rel), `gate-specs missing release:gate e2e: ${rel}`).toBe(
        true,
      );
    }
  });
});
