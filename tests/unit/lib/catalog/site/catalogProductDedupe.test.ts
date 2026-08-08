import { describe, expect, it } from "vitest";

import {
  catalogProductDedupePriority,
  dedupeCatalogProductsByName,
} from "@/lib/catalog/site/catalogProductDedupe";

describe("catalogProductDedupe", () => {
  it("prefers canonical catalog slug over legacy scrape duplicate", () => {
    const canonical = {
      slug: "arvo",
      name: "Arvo",
      flagshipImage: "/assets/catalog/seating/non-leather/oando-seating--arvo/gallery/image-1.jpg",
    };
    const legacy = {
      slug: "arvo-chair",
      name: "Arvo",
      flagshipImage: "/assets/catalog/products/chair-mesh-office.webp",
    };

    expect(catalogProductDedupePriority(canonical)).toBeGreaterThan(
      catalogProductDedupePriority(legacy),
    );

    const deduped = dedupeCatalogProductsByName([legacy, canonical]);
    expect(deduped).toHaveLength(1);
    expect(deduped[0]?.slug).toBe("arvo");
  });

  it("keeps single legacy slug when no canonical sibling exists", () => {
    const legacy = {
      slug: "phoenix-chair",
      name: "Phoenix",
      flagshipImage: "/assets/catalog/seating/non-leather/oando-seating--phoenix/gallery/image-1.webp",
    };

    const deduped = dedupeCatalogProductsByName([legacy]);
    expect(deduped).toHaveLength(1);
    expect(deduped[0]?.slug).toBe("phoenix-chair");
  });

  it("collapses parenthetical name variants", () => {
    const variants = dedupeCatalogProductsByName([
      {
        slug: "phoenix-chair",
        name: "Phoenix",
        flagshipImage: "/assets/catalog/seating/non-leather/oando-seating--phoenix/gallery/image-1.webp",
      },
      {
        slug: "oando-seating--phoenix-with-headrest",
        name: "Phoenix (With Headrest)",
        flagshipImage: "/assets/catalog/seating/non-leather/oando-seating--phoenix/gallery/image-01.webp",
      },
    ]);

    expect(variants).toHaveLength(1);
    expect(variants[0]?.slug).toBe("oando-seating--phoenix-with-headrest");
  });
});
