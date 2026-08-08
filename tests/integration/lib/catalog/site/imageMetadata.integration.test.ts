import { beforeEach, describe, expect, it, vi } from "vitest";

const fsMocks = vi.hoisted(() => ({
  existsSync: vi.fn(),
  statSync: vi.fn(),
  readdirSync: vi.fn(),
}));

vi.mock("node:fs", () => ({
  default: {
    existsSync: fsMocks.existsSync,
    statSync: fsMocks.statSync,
    readdirSync: fsMocks.readdirSync,
  },
  existsSync: fsMocks.existsSync,
  statSync: fsMocks.statSync,
  readdirSync: fsMocks.readdirSync,
}));

vi.mock("@/features/site/data/localCatalogIndex.json", () => ({
  default: [
    {
      id: "idx-1",
      slug: "oando-seating--arvo",
      category_id: "oando-seating",
      name: "Arvo",
      images: [
        "/assets/catalog/seating/non-leather/oando-seating--arvo/image-1.jpg",
        "/assets/catalog/seating/non-leather/oando-seating--arvo/image-2.jpg",
      ],
      flagship_image: "/assets/catalog/seating/non-leather/oando-seating--arvo/image-1.jpg",
    },
    {
      id: "idx-2",
      slug: "tables-meeting-opus",
      category_id: "tables",
      name: "Opus Meet",
      images: ["/assets/catalog/oando-tables--opus/image-1.jpg"],
      flagship_image: "/assets/catalog/oando-tables--opus/image-1.jpg",
    },
  ],
}));

import {
  catalogSlugForProduct,
  hasLocalAssetSource,
  resolveProductImages,
} from "@/lib/catalog/site/imageMetadata";

describe("site catalog imageMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fsMocks.existsSync.mockImplementation((target: string) => {
      const path = String(target).replace(/\\/g, "/");
      if (path.includes("/assets/catalog/")) return true;
      return path.endsWith(".jpg") || path.endsWith(".webp");
    });
    fsMocks.statSync.mockReturnValue({ isDirectory: () => true });
    fsMocks.readdirSync.mockReturnValue(["image-1.jpg", "image-2.jpg", "readme.txt"]);
  });

  describe("catalogSlugForProduct", () => {
    it("builds canonical oando slug from category and name", () => {
      expect(catalogSlugForProduct("oando-seating", "Fluid X")).toBe("oando-seating--fluid-x");
      expect(catalogSlugForProduct("oando-workstations", "DeskPro")).toBe(
        "oando-workstations--deskpro",
      );
    });

    it("normalizes legacy category ids", () => {
      expect(catalogSlugForProduct("oando-seating", "Arvo")).toBe("oando-seating--arvo");
      expect(catalogSlugForProduct("meeting-tables", "Opus")).toBe("oando-tables--opus");
      expect(catalogSlugForProduct("storages", "Prelam")).toBe("oando-storage--prelam");
      expect(catalogSlugForProduct("education", "Classcraft")).toBe("oando-educational--classcraft");
      expect(catalogSlugForProduct("oando-chairs", "Arvo")).toBe("oando-chairs--arvo");
    });

    it("returns null when category is missing", () => {
      expect(catalogSlugForProduct(null, "Arvo")).toBeNull();
      expect(catalogSlugForProduct(undefined, "Arvo")).toBeNull();
    });
  });

  describe("resolveProductImages", () => {
    it("resolves by direct catalog index slug match", () => {
      const resolved = resolveProductImages({
        slug: "oando-seating--arvo",
        name: "Arvo",
        categoryId: "oando-seating",
      });

      expect(resolved).toEqual({
        images: [
          "/assets/catalog/seating/non-leather/oando-seating--arvo/image-1.jpg",
          "/assets/catalog/seating/non-leather/oando-seating--arvo/image-2.jpg",
        ],
        flagshipImage: "/assets/catalog/seating/non-leather/oando-seating--arvo/image-1.jpg",
        source: "catalog-index-slug",
        matchedSlug: "oando-seating--arvo",
      });
    });

    it("resolves from catalog directory when index slug misses", () => {
      const resolved = resolveProductImages({
        slug: "oando-tables--opus",
        name: "Opus",
        categoryId: "oando-tables",
      });

      expect(resolved?.source).toBe("catalog-dir-slug");
      expect(resolved?.images).toEqual([
        "/assets/catalog/oando-tables--opus/image-1.jpg",
        "/assets/catalog/oando-tables--opus/image-2.jpg",
      ]);
    });

    it("resolves by canonical slug via index and directory fallbacks", () => {
      const resolved = resolveProductImages({
        slug: "",
        name: "Arvo",
        categoryId: "oando-seating",
      });

      expect(resolved?.source).toBe("catalog-index-slug");
      expect(resolved?.matchedSlug).toBe("oando-seating--arvo");
    });

    it("resolves by category and name when slug is absent", () => {
      fsMocks.existsSync.mockImplementation((target: string) => {
        const path = String(target).replace(/\\/g, "/");
        return path.includes("/assets/catalog/oando-tables--opus/image-1.jpg");
      });

      const resolved = resolveProductImages({
        name: "Opus Meet",
        categoryId: "tables",
      });

      expect(resolved?.source).toBe("catalog-index-name");
      expect(resolved?.matchedSlug).toBe("tables-meeting-opus");
    });

    it("skips legacy /assets/catalog/products explicit candidates", () => {
      fsMocks.existsSync.mockImplementation((target: string) => {
        const path = String(target).replace(/\\/g, "/");
        return path.includes("meeting-table-6pax.webp");
      });

      expect(
        resolveProductImages({
          categoryId: "meeting-tables",
          name: "Collaborate",
        }),
      ).toBeNull();
    });

    it("resolves explicit directory candidates when file has no extension", () => {
      fsMocks.existsSync.mockImplementation((target: string) => {
        const path = String(target).replace(/\\/g, "/");
        return path.includes("oando-tables--letz-think") || path.endsWith(".jpg");
      });

      const resolved = resolveProductImages({
        categoryId: "oando-tables",
        name: "Letz",
      });

      expect(resolved?.source).toBe("explicit-candidate");
      expect(resolved?.images).toEqual([
        "/assets/catalog/tables/oando-tables--letz-think/image-1.jpg",
        "/assets/catalog/tables/oando-tables--letz-think/image-2.jpg",
      ]);
    });

    it("returns null when no source matches", () => {
      fsMocks.existsSync.mockReturnValue(false);
      fsMocks.readdirSync.mockReturnValue([]);

      expect(
        resolveProductImages({
          slug: "missing-slug",
          name: "Unknown Product",
          categoryId: "unknown",
        }),
      ).toBeNull();
    });

    it("skips index entries whose files do not exist", () => {
      fsMocks.existsSync.mockReturnValue(false);

      expect(
        resolveProductImages({
          slug: "oando-seating--arvo",
          name: "Arvo",
          categoryId: "oando-seating",
        }),
      ).toBeNull();
    });
  });

  describe("hasLocalAssetSource", () => {
    it("returns true when resolveProductImages finds assets", () => {
      expect(hasLocalAssetSource("oando-seating", "Arvo", "oando-seating--arvo")).toBe(true);
    });

    it("returns false when no assets resolve", () => {
      fsMocks.existsSync.mockReturnValue(false);
      fsMocks.readdirSync.mockReturnValue([]);
      expect(hasLocalAssetSource("unknown", "Missing", "missing")).toBe(false);
    });
  });
});