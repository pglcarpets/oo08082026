// @vitest-environment node
/**
 * Contract: site/tsconfig.json path aliases used by product imports.
 * Live fork: self-contained site tsconfig with @planner/* and @studio/* (not extends).
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const monorepoRoot = path.resolve(__dirname, "../../../..");
const siteRoot = path.join(monorepoRoot, "site");
const siteTsconfigPath = path.join(siteRoot, "tsconfig.json");

type Tsconfig = {
  extends?: string;
  compilerOptions?: {
    paths?: Record<string, string[]>;
  };
};

describe("tsconfig paths", () => {
  it("site/tsconfig.json exists and parses as JSON", () => {
    expect(fs.existsSync(siteTsconfigPath), siteTsconfigPath).toBe(true);
    expect(() =>
      JSON.parse(fs.readFileSync(siteTsconfigPath, "utf8")),
    ).not.toThrow();
  });

  it("maps bare @/* into site root and focss", () => {
    const tsconfig = JSON.parse(
      fs.readFileSync(siteTsconfigPath, "utf8"),
    ) as Tsconfig;
    const paths = tsconfig.compilerOptions?.paths;
    expect(paths, "compilerOptions.paths required").toBeDefined();
    expect(paths?.["@/*"]).toContain("./*");
    expect(paths?.["@focss/*"]).toContain("./focss/*");
  });

  it("maps forked Planner and Studio aliases", () => {
    const tsconfig = JSON.parse(
      fs.readFileSync(siteTsconfigPath, "utf8"),
    ) as Tsconfig;
    const paths = tsconfig.compilerOptions?.paths ?? {};
    expect(paths["@planner/lib/*"]).toContain("./lib/Planner/*");
    expect(paths["@planner/components/*"]).toContain("./components/Planner/*");
    expect(paths["@studio/lib/*"]).toContain("./lib/Studio/*");
    expect(paths["@studio/components/*"]).toContain("./components/Studio/*");
  });

  it("platform types and features directories exist under site/", () => {
    const typesDir = path.join(siteRoot, "platform", "types");
    const featuresDir = path.join(siteRoot, "features");
    expect(fs.existsSync(typesDir), typesDir).toBe(true);
    expect(fs.statSync(typesDir).isDirectory()).toBe(true);
    expect(fs.existsSync(featuresDir), featuresDir).toBe(true);
    expect(fs.statSync(featuresDir).isDirectory()).toBe(true);
  });
});
