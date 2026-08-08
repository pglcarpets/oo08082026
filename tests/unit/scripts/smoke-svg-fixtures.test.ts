// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const scriptPath = path.join(siteRoot, "scripts/smoke-svg-fixtures.mjs");
const fixturesDir = path.join(siteRoot, "scripts/generate-svg/_fixtures");

describe("smoke-svg-fixtures (name-mirror)", () => {
  it("only smokes generate-svg/_fixtures and uses runPipeline", () => {
    const src = fs.readFileSync(scriptPath, "utf8");
    expect(src).toContain("generate-svg");
    expect(src).toContain("_fixtures");
    expect(src).toContain("runPipeline");
    expect(src).toContain("listFixtureJsonFiles");
    // must not touch inventory descriptors
    expect(src).not.toMatch(/inventory\/descriptors/);
  });

  it("has deterministic fixture JSON files with slugs", () => {
    expect(fs.existsSync(fixturesDir)).toBe(true);
    const files = fs
      .readdirSync(fixturesDir)
      .filter((name) => name.endsWith(".json"))
      .sort((a, b) => a.localeCompare(b));
    expect(files.length).toBeGreaterThanOrEqual(4);
    expect(files).toEqual(
      expect.arrayContaining([
        "chaise.json",
        "sectional.json",
        "side-table.json",
        "missing-geometry.json",
      ]),
    );

    for (const name of files) {
      const descriptor = JSON.parse(
        fs.readFileSync(path.join(fixturesDir, name), "utf8"),
      ) as { slug?: string };
      expect(typeof descriptor.slug).toBe("string");
      expect(descriptor.slug!.length).toBeGreaterThan(0);
    }
  });
});
