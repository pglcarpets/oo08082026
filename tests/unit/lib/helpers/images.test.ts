import { describe, it, expect, vi } from "vitest";
import { normalizeImageSource, normalizeAssetPath } from "@/lib/helpers/images";

vi.mock("@/lib/assetPaths", () => ({
  normalizeAssetPath: vi.fn((val) => val === undefined || val === null ? "" : `mocked-${val}`),
}));

describe("images helper", () => {
  it("should normalize image source correctly calling normalizeAssetPath", () => {
    expect(normalizeImageSource("test.png")).toBe("mocked-test.png");
    expect(normalizeImageSource(null)).toBe("");
    expect(normalizeImageSource(undefined)).toBe("");
  });

  it("should export normalizeAssetPath", () => {
    expect(normalizeAssetPath("some-path")).toBe("mocked-some-path");
  });
});
