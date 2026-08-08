// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const upload = vi.fn();
const getPublicUrl = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload,
        getPublicUrl,
      }),
    },
  }),
}));

describe("catalogAssetStorage.server", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    upload.mockReset();
    getPublicUrl.mockReset();
    process.env = { ...originalEnv };
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    getPublicUrl.mockReturnValue({
      data: { publicUrl: "https://example.supabase.co/storage/v1/object/public/catalog-assets/x" },
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("builds stable planner symbol paths", async () => {
    const mod = await import("@/features/shared/catalog/catalogAssetStorage.server");
    expect(mod.plannerSymbolSvgPath("side-table-001")).toBe(
      "planner-symbols/side-table-001/symbol.svg",
    );
    expect(mod.plannerSymbolPngPath("side-table-001")).toBe(
      "planner-symbols/side-table-001/symbol.png",
    );
    expect(mod.plannerSymbolDescriptorPath("side-table-001")).toBe(
      "planner-symbols/side-table-001/descriptor.json",
    );
  });

  it("uploads binary catalog assets when service role is configured", async () => {
    upload.mockResolvedValue({ error: null });
    const mod = await import("@/features/shared/catalog/catalogAssetStorage.server");
    const result = await mod.uploadCatalogAssetBinary({
      path: mod.plannerSymbolPngPath("side-table-001"),
      body: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      contentType: "image/png",
    });
    expect(result.ok).toBe(true);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(upload.mock.calls[0]?.[0]).toBe(
      "planner-symbols/side-table-001/symbol.png",
    );
  });

  it("uploads text catalog assets when service role is configured", async () => {
    upload.mockResolvedValue({ error: null });
    const mod = await import("@/features/shared/catalog/catalogAssetStorage.server");
    const result = await mod.uploadCatalogAssetText({
      path: mod.plannerSymbolDescriptorPath("side-table-001"),
      body: '{"slug":"side-table-001"}\n',
      contentType: "application/json",
    });
    expect(result.ok).toBe(true);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(upload.mock.calls[0]?.[0]).toBe(
      "planner-symbols/side-table-001/descriptor.json",
    );
  });

  it("returns not_configured when service role is missing", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const mod = await import("@/features/shared/catalog/catalogAssetStorage.server");
    const result = await mod.uploadCatalogAssetText({
      path: mod.plannerSymbolDescriptorPath("x"),
      body: "{}",
      contentType: "application/json",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/not_configured/);
    }
  });

  describe("resolveGeneratedGlbStorageKey / publishGeneratedGlbToSupabase", () => {
    it("rejects path traversal and non-generated prefixes", async () => {
      const mod = await import("@/features/shared/catalog/catalogAssetStorage.server");
      expect(mod.resolveGeneratedGlbStorageKey({ relativePath: "evil/x.glb" }).ok).toBe(false);
      expect(
        mod.resolveGeneratedGlbStorageKey({
          relativePath: "catalog-assets/generated/../admin.glb",
        }).ok,
      ).toBe(false);
      expect(
        mod.resolveGeneratedGlbStorageKey({
          relativePath: "catalog-assets/generated/foo/../../../etc/passwd.glb",
        }).ok,
      ).toBe(false);
    });

    it("namespaces guests under generated/guest with upsert disabled", async () => {
      const mod = await import("@/features/shared/catalog/catalogAssetStorage.server");
      const resolved = mod.resolveGeneratedGlbStorageKey({
        relativePath: "catalog-assets/generated/product-sku.glb",
        ownerId: null,
      });
      expect(resolved.ok).toBe(true);
      if (resolved.ok) {
        expect(resolved.storageKey).toMatch(/^generated\/guest\/.+-product-sku\.glb$/);
        expect(resolved.allowUpsert).toBe(false);
        // Must not write the shared product key the client asked for.
        expect(resolved.storageKey).not.toBe("generated/product-sku.glb");
      }
    });

    it("namespaces members under generated/u/{owner} with upsert allowed", async () => {
      const mod = await import("@/features/shared/catalog/catalogAssetStorage.server");
      const resolved = mod.resolveGeneratedGlbStorageKey({
        relativePath: "catalog-assets/generated/product-sku.glb",
        ownerId: "user-99",
      });
      expect(resolved.ok).toBe(true);
      if (resolved.ok) {
        expect(resolved.storageKey).toBe("generated/u/user-99/product-sku.glb");
        expect(resolved.allowUpsert).toBe(true);
      }
    });

    it("guest upload uses upsert:false and unique key", async () => {
      upload.mockResolvedValue({ error: null });
      const mod = await import("@/features/shared/catalog/catalogAssetStorage.server");
      const bytes = new Uint8Array([1, 2, 3, 4]);
      const result = await mod.publishGeneratedGlbToSupabase({
        relativePath: "catalog-assets/generated/shared-product.glb",
        body: bytes,
        ownerId: null,
      });
      expect(result.ok).toBe(true);
      expect(upload).toHaveBeenCalledTimes(1);
      const [path, , opts] = upload.mock.calls[0] as [
        string,
        Uint8Array,
        { upsert?: boolean; contentType?: string },
      ];
      expect(path).toMatch(/^generated\/guest\/.+-shared-product\.glb$/);
      expect(opts.upsert).toBe(false);
      if (result.ok) {
        expect(result.path).toMatch(/^catalog-assets\/generated\/guest\//);
      }
    });

    it("member upload uses owner namespace and upsert:true", async () => {
      upload.mockResolvedValue({ error: null });
      const mod = await import("@/features/shared/catalog/catalogAssetStorage.server");
      const result = await mod.publishGeneratedGlbToSupabase({
        relativePath: "catalog-assets/generated/desk.glb",
        body: new Uint8Array([9, 9]),
        ownerId: "owner-1",
      });
      expect(result.ok).toBe(true);
      const [path, , opts] = upload.mock.calls[0] as [
        string,
        Uint8Array,
        { upsert?: boolean },
      ];
      expect(path).toBe("generated/u/owner-1/desk.glb");
      expect(opts.upsert).toBe(true);
    });

    it("rejects empty and oversized GLB bodies", async () => {
      const mod = await import("@/features/shared/catalog/catalogAssetStorage.server");
      const empty = await mod.publishGeneratedGlbToSupabase({
        relativePath: "catalog-assets/generated/x.glb",
        body: new Uint8Array(0),
        ownerId: "u1",
      });
      expect(empty.ok).toBe(false);
      if (!empty.ok) expect(empty.reason).toBe("empty_glb_body");

      const huge = await mod.publishGeneratedGlbToSupabase({
        relativePath: "catalog-assets/generated/x.glb",
        body: new Uint8Array(25 * 1024 * 1024 + 1),
        ownerId: "u1",
      });
      expect(huge.ok).toBe(false);
      if (!huge.ok) expect(huge.reason).toBe("glb_too_large");
      expect(upload).not.toHaveBeenCalled();
    });
  });
});
