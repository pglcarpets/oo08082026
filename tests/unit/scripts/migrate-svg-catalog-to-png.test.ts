// @vitest-environment node
/**
 * Pure helpers for Phase 7 Stage A migration script.
 * Does not call publish, sharp, or mutate catalog inventory.
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const scriptPath = path.join(monorepoRoot, "scripts/migrate-svg-catalog-to-png.mjs");

type MigrateModule = {
  PLAN_SYMBOL_PX_PER_MM: number;
  PLAN_SYMBOL_PAD_MM: number;
  planSymbolRasterBox: (
    widthMm: number,
    depthMm: number,
    padMm?: number,
  ) => {
    widthMm: number;
    depthMm: number;
    coreWidthPx: number;
    coreHeightPx: number;
    rasterWidthPx: number;
    rasterHeightPx: number;
    padMm: number;
    padPx: number;
    pxPerMm: number;
  };
  isLiveDescriptorFilename: (name: string) => boolean;
  listLiveDescriptorSlugs: (filenames: readonly string[]) => string[];
  parseMigrateArgs: (argv: readonly string[]) => {
    ok: boolean;
    error?: string;
    mode?: "dry-run" | "apply";
    all?: boolean;
    slug?: string | null;
  };
  resolveSlugSelection: (args: {
    all: boolean;
    slug: string | null;
    available: readonly string[];
  }) => { ok: true; slugs: string[] } | { ok: false; error: string };
  buildMigrationPlanEntry: (input: {
    slug: string;
    descriptor: unknown | null;
    descriptorPath: string;
    svgPath: string;
    svgPresent: boolean;
    descriptorLoadError?: string;
  }) => {
    slug: string;
    action: string;
    rasterWidthPx: number | null;
    rasterHeightPx: number | null;
    alreadyHasPngPointer: boolean;
    error: string | null;
    svgPresent: boolean;
    widthMm: number | null;
    depthMm: number | null;
    svgPath: string;
  };
  formatPlanLine: (entry: {
    slug: string;
    action: string;
    rasterWidthPx: number | null;
    rasterHeightPx: number | null;
    alreadyHasPngPointer: boolean;
    error: string | null;
    svgPresent: boolean;
    widthMm: number | null;
    depthMm: number | null;
    svgPath: string;
  }) => string;
  buildMigrationPlan: (args: {
    slugs: readonly string[];
    repoRoot: string;
    loadDescriptor?: (
      repoRoot: string,
      slug: string,
    ) =>
      | { path: string; descriptor: unknown }
      | { path: string; error: string };
    svgExists?: (p: string) => boolean;
  }) => Array<{
    slug: string;
    action: string;
    rasterWidthPx: number | null;
    rasterHeightPx: number | null;
    svgPresent: boolean;
    error: string | null;
  }>;
  runMigrateSvgCatalogToPng: (options?: {
    argv?: string[];
    repoRoot?: string;
  }) => Promise<{
    ok: boolean;
    code: number;
    mode?: "dry-run" | "apply";
    error?: string;
    plan?: Array<{ slug: string; action: string; rasterWidthPx: number | null }>;
    migratable?: number;
    skipped?: number;
  }>;
};

async function loadModule(): Promise<MigrateModule> {
  return import(pathToFileURL(scriptPath).href) as Promise<MigrateModule>;
}

describe("migrate-svg-catalog-to-png pure helpers", () => {
  it("planSymbolRasterBox matches contract: 2 px/mm + 40 mm pad each side", async () => {
    const { planSymbolRasterBox, PLAN_SYMBOL_PX_PER_MM, PLAN_SYMBOL_PAD_MM } =
      await loadModule();

    expect(PLAN_SYMBOL_PX_PER_MM).toBe(2);
    expect(PLAN_SYMBOL_PAD_MM).toBe(40);

    // 1000×600 mm → core 2000×1200; pad 80 px each side → 2160×1360
    const box = planSymbolRasterBox(1000, 600);
    expect(box).toMatchObject({
      widthMm: 1000,
      depthMm: 600,
      coreWidthPx: 2000,
      coreHeightPx: 1200,
      rasterWidthPx: 2160,
      rasterHeightPx: 1360,
      padMm: 40,
      padPx: 80,
      pxPerMm: 2,
    });

    // Formula locked by plan: round(w*2)+160 × round(d*2)+160
    expect(box.rasterWidthPx).toBe(Math.round(1000 * 2) + 160);
    expect(box.rasterHeightPx).toBe(Math.round(600 * 2) + 160);

    const square = planSymbolRasterBox(200, 200);
    expect(square.rasterWidthPx).toBe(560);
    expect(square.rasterHeightPx).toBe(560);
  });

  it("listLiveDescriptorSlugs drops version snapshots, latest pointers, and _ prefixes", async () => {
    const { listLiveDescriptorSlugs, isLiveDescriptorFilename } =
      await loadModule();

    const names = [
      "oando-breeze-task-chair.json",
      "oando-breeze-task-chair.2.json",
      "oando-breeze-task-chair.3.json",
      "oando-breeze-task-chair.latest.json",
      "_seed-helper.json",
      "missing-geom-fallback-001.json",
      "readme.txt",
    ];

    expect(isLiveDescriptorFilename("oando-breeze-task-chair.json")).toBe(true);
    expect(isLiveDescriptorFilename("oando-breeze-task-chair.2.json")).toBe(
      false,
    );
    expect(isLiveDescriptorFilename("oando-breeze-task-chair.latest.json")).toBe(
      false,
    );
    expect(isLiveDescriptorFilename("_seed-helper.json")).toBe(false);

    expect(listLiveDescriptorSlugs(names)).toEqual([
      "missing-geom-fallback-001",
      "oando-breeze-task-chair",
    ]);
  });

  it("parseMigrateArgs requires explicit --dry-run|--apply and --slug|--all", async () => {
    const { parseMigrateArgs } = await loadModule();

    expect(parseMigrateArgs([])).toEqual({
      ok: false,
      error: "Require --dry-run or --apply (no implicit apply)",
    });
    expect(parseMigrateArgs(["--slug=x"])).toEqual({
      ok: false,
      error: "Require --dry-run or --apply (no implicit apply)",
    });
    expect(parseMigrateArgs(["--dry-run"])).toEqual({
      ok: false,
      error: "Provide --slug=<slug> or --all",
    });
    expect(parseMigrateArgs(["--dry-run", "--apply", "--all"])).toEqual({
      ok: false,
      error: "Use only one of --dry-run or --apply",
    });
    expect(parseMigrateArgs(["--dry-run", "--all", "--slug=x"])).toEqual({
      ok: false,
      error: "Use only one of --slug=<slug> or --all",
    });

    expect(parseMigrateArgs(["--dry-run", "--slug=desk"])).toEqual({
      ok: true,
      mode: "dry-run",
      all: false,
      slug: "desk",
    });
    expect(parseMigrateArgs(["--apply", "--all"])).toEqual({
      ok: true,
      mode: "apply",
      all: true,
      slug: null,
    });
  });

  it("buildMigrationPlanEntry plans migrate / re-publish / skips with raster box from descriptor geometry", async () => {
    const { buildMigrationPlanEntry, formatPlanLine, resolveSlugSelection } =
      await loadModule();

    const descriptor = {
      slug: "missing-geom-fallback-001",
      geometry: { widthMm: 200, depthMm: 200, heightMm: 200 },
    };

    const migrate = buildMigrationPlanEntry({
      slug: "missing-geom-fallback-001",
      descriptor,
      descriptorPath: "/tmp/missing-geom-fallback-001.json",
      svgPath: "/tmp/svg-catalog/missing-geom-fallback-001.svg",
      svgPresent: true,
    });
    expect(migrate.action).toBe("migrate");
    expect(migrate.rasterWidthPx).toBe(560);
    expect(migrate.rasterHeightPx).toBe(560);
    expect(migrate.alreadyHasPngPointer).toBe(false);
    expect(formatPlanLine(migrate)).toContain("200×200 mm → 560×560 px");

    const rePublish = buildMigrationPlanEntry({
      slug: "has-png",
      descriptor: {
        ...descriptor,
        slug: "has-png",
        planSymbolPngUrl: "https://storage.test/has-png.png",
      },
      descriptorPath: "/tmp/has-png.json",
      svgPath: "/tmp/svg-catalog/has-png.svg",
      svgPresent: true,
    });
    expect(rePublish.action).toBe("re-publish");
    expect(rePublish.alreadyHasPngPointer).toBe(true);

    const missingSvg = buildMigrationPlanEntry({
      slug: "no-svg",
      descriptor,
      descriptorPath: "/tmp/no-svg.json",
      svgPath: "/tmp/svg-catalog/no-svg.svg",
      svgPresent: false,
    });
    expect(missingSvg.action).toBe("skip-missing-svg");
    expect(missingSvg.error).toBe("svg_catalog_missing");

    const badGeom = buildMigrationPlanEntry({
      slug: "bad",
      descriptor: { slug: "bad", geometry: { widthMm: 0, depthMm: 100 } },
      descriptorPath: "/tmp/bad.json",
      svgPath: "/tmp/bad.svg",
      svgPresent: true,
    });
    expect(badGeom.action).toBe("skip-bad-geometry");
    expect(badGeom.error).toBe("widthMm_invalid");

    // Explicit slug always accepted even if not in available list.
    expect(
      resolveSlugSelection({
        all: false,
        slug: "test-symbol",
        available: ["other"],
      }),
    ).toEqual({ ok: true, slugs: ["test-symbol"] });

    expect(
      resolveSlugSelection({
        all: true,
        slug: null,
        available: ["a", "b"],
      }),
    ).toEqual({ ok: true, slugs: ["a", "b"] });
  });

  it("buildMigrationPlan is pure given load/svg hooks (no catalog mutation)", async () => {
    const { buildMigrationPlan } = await loadModule();

    const plan = buildMigrationPlan({
      slugs: ["alpha", "beta"],
      repoRoot: "/repo",
      loadDescriptor: (_root, slug) => {
        if (slug === "alpha") {
          return {
            path: "/repo/site/inventory/descriptors/alpha.json",
            descriptor: {
              slug: "alpha",
              geometry: { widthMm: 1000, depthMm: 600, heightMm: 700 },
            },
          };
        }
        return {
          path: "/repo/site/inventory/descriptors/beta.json",
          error: "descriptor missing: beta",
        };
      },
      svgExists: (p) => p.endsWith("alpha.svg"),
    });

    expect(plan).toHaveLength(2);
    expect(plan[0]).toMatchObject({
      slug: "alpha",
      action: "migrate",
      rasterWidthPx: 2160,
      rasterHeightPx: 1360,
      svgPresent: true,
    });
    expect(plan[1]).toMatchObject({
      slug: "beta",
      action: "skip-bad-descriptor",
      error: "descriptor missing: beta",
    });
  });

  it("runMigrateSvgCatalogToPng dry-run plans real inventory without publish", async () => {
    const { runMigrateSvgCatalogToPng } = await loadModule();

    const refused = await runMigrateSvgCatalogToPng({
      argv: [],
      repoRoot: monorepoRoot,
    });
    expect(refused.ok).toBe(false);
    expect(refused.code).toBe(2);
    expect(refused.error).toMatch(/--dry-run or --apply/);

    const result = await runMigrateSvgCatalogToPng({
      argv: ["--dry-run", "--slug=missing-geom-fallback-001"],
      repoRoot: monorepoRoot,
    });

    expect(result.ok).toBe(true);
    expect(result.code).toBe(0);
    expect(result.mode).toBe("dry-run");
    // SVG catalog file was removed from repo; descriptor exists but SVG is missing,
    // so the plan entry is skip-missing-svg (not migratable).
    expect(result.migratable).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.plan).toHaveLength(1);
    expect(result.plan?.[0]).toMatchObject({
      slug: "missing-geom-fallback-001",
      action: "skip-missing-svg",
      error: "svg_catalog_missing",
    });
  });
});
