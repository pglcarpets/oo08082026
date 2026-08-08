import { describe, expect, it } from "vitest";

import {
  isUsableMarketingImage,
  pickCategoryTileImage,
  pickMarketingImage,
  preferMarketingImages,
} from "@/lib/catalog/site/marketingImages";

describe("marketingImages", () => {
  it("rejects line SVG and placeholder paths for marketing", () => {
    expect(isUsableMarketingImage("/assets/catalog/chair.jpg")).toBe(true);
    expect(isUsableMarketingImage("/assets/marketing/projects/DMRC/dmrc-facility.webp")).toBe(false);
    expect(isUsableMarketingImage("/svg-catalog/desk.svg")).toBe(false);
    expect(isUsableMarketingImage("assets_placeholder.jpg")).toBe(false);
    expect(isUsableMarketingImage("/assets/marketing/fallback/placeholders/category.webp")).toBe(false);
  });

  it("preferMarketingImages keeps photos when mixed with svg", () => {
    expect(
      preferMarketingImages([
        "/svg-catalog/desk.svg",
        "/assets/catalog/chair.jpg",
        "/assets/catalog/chair.jpg",
      ]),
    ).toEqual(["/assets/catalog/chair.jpg"]);
  });

  it("falls back to raw list when only svg remains", () => {
    expect(preferMarketingImages(["/svg-catalog/only.svg"])).toEqual([
      "/svg-catalog/only.svg",
    ]);
  });

  it("pickMarketingImage chooses first photo candidate", () => {
    expect(
      pickMarketingImage("/svg-catalog/x.svg", "/photos/a.webp", ""),
    ).toBe("/photos/a.webp");
  });

  it("pickCategoryTileImage prefers catalog oando paths over loose product paths", () => {
    expect(
      pickCategoryTileImage(
        [
          "/assets/catalog/products/dauble paper tray.jpg",
          "/assets/catalog/seating/non-leather/oando-seating--breeze/gallery/image-01.webp",
        ],
      ),
    ).toBe("/assets/catalog/seating/non-leather/oando-seating--breeze/gallery/image-01.webp");
  });

  it("pickCategoryTileImage uses catalog fallback when no catalog candidates", () => {
    expect(
      pickCategoryTileImage(
        ["/assets/catalog/products/dauble paper tray.jpg"],
        "/assets/catalog/seating/non-leather/oando-seating--breeze/gallery/image-01.webp",
      ),
    ).toBe("/assets/catalog/seating/non-leather/oando-seating--breeze/gallery/image-01.webp");
  });
});
