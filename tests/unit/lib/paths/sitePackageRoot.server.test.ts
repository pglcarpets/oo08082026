/**
 * Name-mirror coverage for lib/paths/sitePackageRoot.server.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("sitePackageRoot.server", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("re-exports path resolvers from sitePackageRoot", async () => {
    const server = await import("@/lib/paths/sitePackageRoot.server");
    const client = await import("@/lib/paths/sitePackageRoot");

    expect(server.resolveSitePackageRoot).toBe(client.resolveSitePackageRoot);
    expect(server.resolveBlockDescriptorsDir).toBe(
      client.resolveBlockDescriptorsDir,
    );
    expect(server.resolvePublicDir).toBe(client.resolvePublicDir);
  });

  it("resolves the same package root as the non-server entry", async () => {
    const { resolveSitePackageRoot } = await import(
      "@/lib/paths/sitePackageRoot.server"
    );
    const root = resolveSitePackageRoot();
    expect(root.length).toBeGreaterThan(0);
    expect(root).toContain("site");
  });
});
