import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import path from "node:path";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { publishFurnitureToCatalog } from "@/server/Studio/publishFurnitureToCatalog";

// Disk-path contract tests: assert versioned descriptor files and the lifecycle
// manifest. Pin the mode rather than leaving it to DEV_AUTH_BYPASS parsing —
// the supabase branch writes to block_descriptors and touches no files.
vi.mock("@/lib/catalog/furnitureCatalogMode", () => ({
  getFurnitureCatalogMode: () => "disk",
  isFurnitureCatalogConfigured: () => true,
}));

describe("publishFurnitureToCatalog", () => {
  let root: string;
  let descriptorsDir: string;
  let lifecycleDir: string;

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), "pub-furn-"));
    descriptorsDir = path.join(root, "descriptors");
    lifecycleDir = root;
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("rejects invalid metadata", async () => {
    const result = await publishFurnitureToCatalog({
      name: "",
      category: "desks",
      width_mm: 1200,
      depth_mm: 600,
      descriptorsDir,
      lifecycleDir,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("validation");
  });

  it("persists versioned descriptor and draft lifecycle without PNG", async () => {
    const result = await publishFurnitureToCatalog({
      name: "Smoke Desk",
      category: "desks",
      width_mm: 1400,
      depth_mm: 700,
      height_mm: 750,
      descriptorsDir,
      lifecycleDir,
      goLive: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.slug).toBe("smoke-desk");
    expect(result.version).toBe(1);
    const latest = path.join(descriptorsDir, "smoke-desk.latest.json");
    expect(existsSync(latest)).toBe(true);
    const body = JSON.parse(readFileSync(latest, "utf8")) as {
      slug: string;
      version: number;
      name: string;
    };
    expect(body.slug).toBe("smoke-desk");
    expect(body.version).toBe(1);
    expect(body.name).toBe("Smoke Desk");
    const lifecycle = path.join(lifecycleDir, "catalog-lifecycle.json");
    expect(existsSync(lifecycle)).toBe(true);
    const manifest = JSON.parse(readFileSync(lifecycle, "utf8")) as Record<
      string,
      { state: string }
    >;
    expect(manifest["smoke-desk"]?.state).toBe("draft");
  });

  it("bumps version on second publish", async () => {
    const input = {
      name: "Repeat Item",
      category: "storage",
      width_mm: 400,
      depth_mm: 400,
      descriptorsDir,
      lifecycleDir,
    };
    const a = await publishFurnitureToCatalog(input);
    const b = await publishFurnitureToCatalog(input);
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.version).toBe(1);
      expect(b.version).toBe(2);
      expect(a.slug).toBe(b.slug);
    }
  });
});
