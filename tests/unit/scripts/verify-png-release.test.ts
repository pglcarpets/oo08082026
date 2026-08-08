// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const scriptPath = path.join(monorepoRoot, "scripts/verify-png-release.mjs");

async function loadModule() {
  return import(pathToFileURL(scriptPath).href);
}

type PointerBody = {
  slug: string;
  planSymbolPngUrl: string;
  planSymbolPngChecksum: string;
  planSymbolMime: string;
};

function pointerBody(
  slug: string,
  overrides: Partial<PointerBody> = {},
): PointerBody {
  return {
    slug,
    planSymbolPngUrl: `https://storage.test/${slug}.png`,
    planSymbolPngChecksum: "c".repeat(64),
    planSymbolMime: "image/png",
    ...overrides,
  };
}

function storageOk(body: PointerBody) {
  return vi.fn().mockResolvedValue({
    ok: true,
    path: `planner-symbols/${body.slug}/descriptor.json`,
    body: JSON.stringify(body),
  });
}

describe("verify-png-release", () => {
  it.each([
    {
      name: "missing slug",
      args: {
        slug: "",
        deps: {
          downloadCatalogAssetText: vi.fn(),
          getSvgReleaseAuthority: (): "disk" | "db" => "disk",
          readDiskDescriptor: vi.fn(),
          readBlockDescriptorRow: vi.fn(),
        },
      },
      ok: false,
      code: 2,
      error: /Provide --slug/,
    },
    {
      name: "storage descriptor missing",
      args: {
        slug: "no-storage",
        authority: "disk" as const,
        deps: {
          downloadCatalogAssetText: vi.fn().mockResolvedValue({
            ok: false,
            reason: "not_found",
          }),
          getSvgReleaseAuthority: (): "disk" | "db" => "disk",
          readDiskDescriptor: vi.fn(),
          readBlockDescriptorRow: vi.fn(),
        },
      },
      ok: false,
      code: 1,
      error: /storage_descriptor: not_found/,
    },
    {
      name: "disk release missing",
      args: {
        slug: "no-disk",
        authority: "disk" as const,
        deps: {
          downloadCatalogAssetText: storageOk(pointerBody("no-disk")),
          getSvgReleaseAuthority: (): "disk" | "db" => "disk",
          readDiskDescriptor: vi.fn().mockReturnValue({
            path: "/tmp/no-disk.json",
            error: "missing",
          }),
          readBlockDescriptorRow: vi.fn(),
        },
      },
      ok: false,
      code: 1,
      error: /disk_release: missing/,
    },
    {
      name: "db release row missing",
      args: {
        slug: "no-db",
        authority: "db" as const,
        deps: {
          downloadCatalogAssetText: storageOk(pointerBody("no-db")),
          getSvgReleaseAuthority: (): "disk" | "db" => "db",
          readDiskDescriptor: vi.fn(),
          readBlockDescriptorRow: vi.fn().mockResolvedValue({
            ok: false,
            error: "row_missing",
          }),
        },
      },
      ok: false,
      code: 1,
      error: /db_release: row_missing/,
    },
    {
      name: "pointer drift between storage and release",
      args: {
        slug: "demo-slug",
        authority: "disk" as const,
        deps: {
          downloadCatalogAssetText: storageOk(
            pointerBody("demo-slug", {
              planSymbolPngUrl: "https://storage.test/a.png",
              planSymbolPngChecksum: "a".repeat(64),
            }),
          ),
          getSvgReleaseAuthority: (): "disk" | "db" => "disk",
          readDiskDescriptor: vi.fn().mockReturnValue({
            path: "/tmp/demo-slug.json",
            descriptor: pointerBody("demo-slug", {
              planSymbolPngUrl: "https://storage.test/b.png",
              planSymbolPngChecksum: "b".repeat(64),
            }),
          }),
          readBlockDescriptorRow: vi.fn(),
        },
      },
      ok: false,
      code: 1,
      error: /^pointer_drift$/,
      drifts: true,
    },
  ])("fail contract: $name", async ({ args, ok, code, error, drifts }) => {
    const { verifyPngRelease } = await loadModule();
    const result = await verifyPngRelease(args);

    expect(result.ok).toBe(ok);
    expect(result.code).toBe(code);
    expect(result.error).toMatch(error);
    if (drifts) {
      expect(result.drifts?.length).toBeGreaterThan(0);
      expect(result.drifts?.some((d: { field: string }) => d.field === "planSymbolPngUrl")).toBe(
        true,
      );
      expect(
        result.drifts?.some((d: { field: string }) => d.field === "planSymbolPngChecksum"),
      ).toBe(true);
    }
  });

  it.each([
    {
      name: "disk authority match",
      authority: "disk" as const,
      slug: "match-slug",
      releaseSource: "/tmp/match-slug.json",
      setupDeps: (body: PointerBody) => ({
        downloadCatalogAssetText: storageOk(body),
        getSvgReleaseAuthority: (): "disk" | "db" => "disk",
        readDiskDescriptor: vi.fn().mockReturnValue({
          path: "/tmp/match-slug.json",
          descriptor: body,
        }),
        readBlockDescriptorRow: vi.fn(),
      }),
    },
    {
      name: "db authority match",
      authority: "db" as const,
      slug: "db-slug",
      releaseSource: "block_descriptors:db-slug",
      setupDeps: (body: PointerBody) => ({
        downloadCatalogAssetText: storageOk(body),
        getSvgReleaseAuthority: (): "disk" | "db" => "db",
        readDiskDescriptor: vi.fn(),
        readBlockDescriptorRow: vi.fn().mockResolvedValue({
          ok: true,
          descriptor: body,
        }),
      }),
    },
  ])(
    "pass contract: $name when planSymbol pointers align",
    async ({ authority, slug, releaseSource, setupDeps }) => {
      const { verifyPngRelease } = await loadModule();
      const body = pointerBody(slug);
      const result = await verifyPngRelease({
        slug,
        authority,
        deps: setupDeps(body),
      });

      expect(result.ok).toBe(true);
      expect(result.code).toBe(0);
      expect(result.authority).toBe(authority);
      expect(result.releaseSource).toBe(releaseSource);
      expect(result.pointers).toEqual({
        planSymbolPngUrl: body.planSymbolPngUrl,
        planSymbolPngChecksum: body.planSymbolPngChecksum,
        planSymbolMime: body.planSymbolMime,
      });
    },
  );
});
