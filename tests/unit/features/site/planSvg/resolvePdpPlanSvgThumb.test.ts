import { describe, expect, it } from "vitest";

import {
  listPdpPlanSvgSlugCandidates,
  resolvePdpPlanSvgThumb,
} from "@/features/site/planSvg/resolvePdpPlanSvgThumb";

describe("listPdpPlanSvgSlugCandidates", () => {
  it("dedupes and prefers planSlug then productSlug then sourceSlug", () => {
    expect(
      listPdpPlanSvgSlugCandidates({
        planSlug: "oando-fluid-desk-1400",
        productSlug: "fluid-desk",
        sourceSlug: "fluid-desk",
      }),
    ).toEqual(["oando-fluid-desk-1400", "fluid-desk"]);
  });

  it("drops invalid slugs", () => {
    expect(
      listPdpPlanSvgSlugCandidates({
        productSlug: "../evil",
        sourceSlug: "ok-slug",
      }),
    ).toEqual(["ok-slug"]);
  });
});

describe("resolvePdpPlanSvgThumb", () => {
  it("prefers planSymbolPngUrl over revision and disk", () => {
    const result = resolvePdpPlanSvgThumb(
      {
        productSlug: "desk",
        planSymbolPngUrl: "/png-catalog/desk-001.png",
        publishedSvgRevisionId: "desk-r-0123456789abcdef0123",
      },
      { diskExists: () => true, pngDiskExists: () => true },
    );
    expect(result).toEqual({
      url: "/png-catalog/desk-001.png",
      source: "png",
    });
  });

  it("prefers png-catalog disk when present", () => {
    const result = resolvePdpPlanSvgThumb(
      { productSlug: "desk-001" },
      {
        pngDiskExists: (slug) => slug === "desk-001",
        diskExists: () => true,
      },
    );
    expect(result).toEqual({
      url: "/png-catalog/desk-001.png",
      source: "png",
      slug: "desk-001",
    });
  });

  it("prefers published revision API over svg disk", () => {
    const result = resolvePdpPlanSvgThumb(
      {
        productSlug: "desk",
        publishedSvgRevisionId: "desk-r-0123456789abcdef0123",
      },
      { diskExists: () => true },
    );
    expect(result).toEqual({
      url: "/api/files/svg-revisions/desk-r-0123456789abcdef0123",
      source: "revision",
    });
  });

  it("returns disk url when published artifact exists", () => {
    const result = resolvePdpPlanSvgThumb(
      { productSlug: "oando-fluid-desk-1400" },
      {
        diskExists: (slug) => slug === "oando-fluid-desk-1400",
      },
    );
    expect(result).toEqual({
      url: "/svg-catalog/oando-fluid-desk-1400.svg",
      source: "disk",
      slug: "oando-fluid-desk-1400",
    });
  });

  it("tries sourceSlug when product slug has no artifact", () => {
    const result = resolvePdpPlanSvgThumb(
      {
        productSlug: "super-chair",
        sourceSlug: "oando-breeze-task-chair",
      },
      {
        diskExists: (slug) => slug === "oando-breeze-task-chair",
      },
    );
    expect(result?.url).toBe("/svg-catalog/oando-breeze-task-chair.svg");
    expect(result?.source).toBe("disk");
  });

  it("returns null when no revision and no disk hit", () => {
    expect(
      resolvePdpPlanSvgThumb(
        { productSlug: "super-chair" },
        { diskExists: () => false },
      ),
    ).toBeNull();
    expect(resolvePdpPlanSvgThumb({ productSlug: "super-chair" })).toBeNull();
  });

  it("uses findLooseDiskSlug when exact disk slug misses", () => {
    const result = resolvePdpPlanSvgThumb(
      { productSlug: "breeze" },
      {
        diskExists: () => false,
        findLooseDiskSlug: (candidates) =>
          candidates.includes("breeze") ? "oando-breeze-task-chair" : null,
      },
    );
    expect(result).toEqual({
      url: "/svg-catalog/oando-breeze-task-chair.svg",
      source: "disk",
      slug: "oando-breeze-task-chair",
    });
  });

  it("uses findLoosePngDiskSlug when exact png disk slug misses", () => {
    const result = resolvePdpPlanSvgThumb(
      { productSlug: "breeze" },
      {
        pngDiskExists: () => false,
        findLoosePngDiskSlug: (candidates) =>
          candidates.includes("breeze") ? "oando-breeze-task-chair" : null,
      },
    );
    expect(result).toEqual({
      url: "/png-catalog/oando-breeze-task-chair.png",
      source: "png",
      slug: "oando-breeze-task-chair",
    });
  });
});
