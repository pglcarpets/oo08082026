/**
 * Name-mirror: features/site/data/localCatalogIndex.json
 * Structural contracts only — does not mutate the catalog file.
 */

import { describe, expect, it } from "vitest";
import localCatalogIndex from "@/features/site/data/localCatalogIndex.json";

type LocalCatalogEntry = {
  id: string;
  slug: string;
  category_id: string;
  name: string;
  images: string[];
  flagship_image: string;
};

describe("localCatalogIndex.json", () => {
  const entries = localCatalogIndex as LocalCatalogEntry[];

  it("is a non-empty array of catalog entries", () => {
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(50);
  });

  it("requires id, slug, category_id, name, images, flagship_image on every row", () => {
    for (const entry of entries) {
      expect(entry.id, entry.slug).toMatch(/\S/);
      expect(entry.slug, entry.id).toMatch(/\S/);
      expect(entry.category_id, entry.slug).toMatch(/\S/);
      expect(entry.name, entry.slug).toMatch(/\S/);
      expect(Array.isArray(entry.images), entry.slug).toBe(true);
      expect(entry.images.length, entry.slug).toBeGreaterThan(0);
      expect(entry.flagship_image, entry.slug).toMatch(/^\//);
      for (const image of entry.images) {
        expect(image, entry.slug).toMatch(/^\//);
      }
    }
  });

  it("has unique ids and unique slugs", () => {
    const ids = entries.map((e) => e.id);
    const slugs = entries.map((e) => e.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
