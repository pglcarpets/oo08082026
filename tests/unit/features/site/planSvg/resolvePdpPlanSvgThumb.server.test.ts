import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fsMocks = vi.hoisted(() => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("node:fs", () => ({
  existsSync: fsMocks.existsSync,
  readdirSync: fsMocks.readdirSync,
  default: {
    existsSync: fsMocks.existsSync,
    readdirSync: fsMocks.readdirSync,
  },
}));

vi.mock("@/lib/paths/sitePackageRoot.server", () => ({
  resolvePublicDir: () => "/mock/public",
  resolveSvgCatalogDir: () =>
    path.join("/mock/public", "assets", "others", "legacy", "svg-catalog"),
  resolvePngCatalogDir: () =>
    path.join("/mock/public", "assets", "others", "legacy", "png-catalog"),
}));

function publicPath(...segments: string[]): string {
  return path.join("/mock/public", "assets", "others", "legacy", ...segments);
}

function isCatalogDir(target: string, catalog: "svg-catalog" | "png-catalog"): boolean {
  const normalized = String(target).replace(/\\/g, "/");
  return (
    normalized === `/mock/public/assets/others/legacy/${catalog}` ||
    normalized.endsWith(`/assets/others/legacy/${catalog}`) ||
    normalized.endsWith(`/${catalog}`)
  );
}

async function loadServerModule() {
  vi.resetModules();
  return import("@/features/site/planSvg/resolvePdpPlanSvgThumb.server");
}

describe("resolvePdpPlanSvgThumb.server", () => {
  beforeEach(() => {
    fsMocks.existsSync.mockReset();
    fsMocks.readdirSync.mockReset();
  });

  describe("diskPlanSvgExists", () => {
    it("returns true when svg file exists on disk", async () => {
      fsMocks.existsSync.mockReturnValue(true);
      const { diskPlanSvgExists } = await loadServerModule();
      expect(diskPlanSvgExists("oando-breeze-task-chair")).toBe(true);
      expect(fsMocks.existsSync).toHaveBeenCalledWith(
        publicPath("svg-catalog", "oando-breeze-task-chair.svg"),
      );
    });

    it("rejects unsafe slugs", async () => {
      const { diskPlanSvgExists } = await loadServerModule();
      expect(diskPlanSvgExists("../evil")).toBe(false);
      expect(diskPlanSvgExists("")).toBe(false);
      expect(diskPlanSvgExists("bad/slug")).toBe(false);
      expect(fsMocks.existsSync).not.toHaveBeenCalled();
    });
  });

  describe("diskPlanPngExists", () => {
    it("returns true when png file exists on disk", async () => {
      fsMocks.existsSync.mockReturnValue(true);
      const { diskPlanPngExists } = await loadServerModule();
      expect(diskPlanPngExists("desk-001")).toBe(true);
      expect(fsMocks.existsSync).toHaveBeenCalledWith(
        publicPath("png-catalog", "desk-001.png"),
      );
    });

    it("rejects unsafe slugs", async () => {
      const { diskPlanPngExists } = await loadServerModule();
      expect(diskPlanPngExists("..\\evil")).toBe(false);
      expect(fsMocks.existsSync).not.toHaveBeenCalled();
    });
  });

  describe("findLooseDiskPlanSvgSlug", () => {
    it("maps short marketing slug breeze onto published oando-breeze-* file when present", async () => {
      fsMocks.existsSync.mockImplementation((target: string) =>
        isCatalogDir(target, "svg-catalog"),
      );
      fsMocks.readdirSync.mockReturnValue(["oando-breeze-task-chair.svg"]);

      const { findLooseDiskPlanSvgSlug, diskPlanSvgExists } =
        await loadServerModule();
      expect(findLooseDiskPlanSvgSlug(["breeze"])).toBe("oando-breeze-task-chair");
      fsMocks.existsSync.mockReturnValue(true);
      expect(diskPlanSvgExists("oando-breeze-task-chair")).toBe(true);
    });

    it("returns null for unknown stems", async () => {
      fsMocks.existsSync.mockReturnValue(false);
      fsMocks.readdirSync.mockReturnValue([]);
      const { findLooseDiskPlanSvgSlug } = await loadServerModule();
      expect(findLooseDiskPlanSvgSlug(["definitely-not-a-plan-symbol-xyz"])).toBeNull();
    });

    it("returns null when svg catalog has files but no stem matches", async () => {
      fsMocks.existsSync.mockImplementation((target: string) =>
        isCatalogDir(target, "svg-catalog"),
      );
      fsMocks.readdirSync.mockReturnValue(["oando-breeze-task-chair.svg"]);
      const { findLooseDiskPlanSvgSlug } = await loadServerModule();
      expect(findLooseDiskPlanSvgSlug(["unknown-stem"])).toBeNull();
    });
  });

  describe("findLooseDiskPlanPngSlug", () => {
    it("prefers exact png slug then oando-prefixed matches", async () => {
      fsMocks.existsSync.mockImplementation((target: string) =>
        isCatalogDir(target, "png-catalog"),
      );
      fsMocks.readdirSync.mockReturnValue([
        "desk-001.png",
        "oando-breeze-task-chair.png",
      ]);

      const { findLooseDiskPlanPngSlug } = await loadServerModule();
      expect(findLooseDiskPlanPngSlug(["desk-001"])).toBe("desk-001");
      expect(findLooseDiskPlanPngSlug(["breeze"])).toBe("oando-breeze-task-chair");
    });

    it("returns null when png catalog is empty", async () => {
      fsMocks.existsSync.mockReturnValue(false);
      fsMocks.readdirSync.mockReturnValue([]);
      const { findLooseDiskPlanPngSlug } = await loadServerModule();
      expect(findLooseDiskPlanPngSlug(["breeze"])).toBeNull();
    });

    it("returns null when png catalog has files but no stem matches", async () => {
      fsMocks.existsSync.mockImplementation((target: string) =>
        isCatalogDir(target, "png-catalog"),
      );
      fsMocks.readdirSync.mockReturnValue(["desk-001.png"]);
      const { findLooseDiskPlanPngSlug } = await loadServerModule();
      expect(findLooseDiskPlanPngSlug(["unknown-stem"])).toBeNull();
    });

    it("skips unsafe png candidate stems", async () => {
      fsMocks.existsSync.mockImplementation((target: string) =>
        isCatalogDir(target, "png-catalog"),
      );
      fsMocks.readdirSync.mockReturnValue(["desk-001.png"]);
      const { findLooseDiskPlanPngSlug } = await loadServerModule();
      expect(findLooseDiskPlanPngSlug(["../evil"])).toBeNull();
    });

    it("returns exact oando-{stem} png slug", async () => {
      fsMocks.existsSync.mockImplementation((target: string) =>
        isCatalogDir(target, "png-catalog"),
      );
      fsMocks.readdirSync.mockReturnValue(["oando-breeze.png"]);
      const { findLooseDiskPlanPngSlug } = await loadServerModule();
      expect(findLooseDiskPlanPngSlug(["breeze"])).toBe("oando-breeze");
    });
  });

  describe("resolvePdpPlanSvgThumbFromDisk", () => {
    it("prefers png-catalog disk over svg-catalog", async () => {
      fsMocks.existsSync.mockImplementation((target: string) => {
        const normalized = String(target).replace(/\\/g, "/");
        return (
          normalized.endsWith("/png-catalog/desk-001.png") ||
          normalized.endsWith("/svg-catalog/desk-001.svg") ||
          isCatalogDir(target, "png-catalog") ||
          isCatalogDir(target, "svg-catalog")
        );
      });
      fsMocks.readdirSync.mockImplementation((dir: string) => {
        if (isCatalogDir(dir, "png-catalog")) {
          return ["desk-001.png"];
        }
        return ["desk-001.svg"];
      });

      const { resolvePdpPlanSvgThumbFromDisk } = await loadServerModule();
      expect(resolvePdpPlanSvgThumbFromDisk({ productSlug: "desk-001" })).toEqual({
        url: "/png-catalog/desk-001.png",
        source: "png",
        slug: "desk-001",
      });
    });

    it("uses loose svg slug mapping when exact product slug misses", async () => {
      fsMocks.existsSync.mockImplementation((target: string) => {
        const normalized = String(target).replace(/\\/g, "/");
        return (
          isCatalogDir(target, "svg-catalog") ||
          normalized.endsWith("/svg-catalog/oando-breeze-task-chair.svg")
        );
      });
      fsMocks.readdirSync.mockImplementation((dir: string) => {
        if (isCatalogDir(dir, "png-catalog")) {
          return [];
        }
        return ["oando-breeze-task-chair.svg"];
      });

      const { resolvePdpPlanSvgThumbFromDisk } = await loadServerModule();
      expect(resolvePdpPlanSvgThumbFromDisk({ productSlug: "breeze" })).toEqual({
        url: "/svg-catalog/oando-breeze-task-chair.svg",
        source: "disk",
        slug: "oando-breeze-task-chair",
      });
    });
  });
});