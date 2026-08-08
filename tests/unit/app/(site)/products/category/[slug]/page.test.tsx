/**
 * Legacy alias /products/category/:slug must hard-redirect (or hard-404).
 * Soft marketing shells are an SEO soft-404 risk.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { notFound, permanentRedirect } from "next/navigation";
import LegacyCategorySlugPage, {
  generateMetadata,
} from "@/app/(site)/products/category/[slug]/page";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
  permanentRedirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@/lib/catalog/site/categories", () => ({
  normalizeRequestedCategoryId: (slug: string) => {
    if (slug === "valid-slug" || slug === "seating") return "seating";
    return null;
  },
}));

vi.mock("@/features/site/data/seo", () => ({
  buildPageMetadata: (
    _url: string,
    opts: { title: string; description: string; path: string; indexable?: boolean },
  ) => ({
    title: opts.title,
    description: opts.description,
    path: opts.path,
    robots: opts.indexable === false ? { index: false, follow: false } : { index: true, follow: true },
  }),
}));

vi.mock("@/lib/siteUrl", () => ({
  SITE_URL: "https://oando.co.in",
}));

describe("LegacyCategorySlugPage (/products/category/[slug])", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateMetadata", () => {
    it("hard-404s unknown slugs instead of emitting indexable metadata", async () => {
      await expect(
        generateMetadata({ params: Promise.resolve({ slug: "not-a-category" }) }),
      ).rejects.toThrow("NOT_FOUND");
      expect(notFound).toHaveBeenCalled();
    });

    it("emits noindex metadata for valid legacy slugs (redirect target owns index)", async () => {
      const meta = await generateMetadata({
        params: Promise.resolve({ slug: "valid-slug" }),
      });
      expect(meta.title).toBe("seating");
      expect(meta.robots).toEqual({ index: false, follow: false });
    });
  });

  describe("page", () => {
    it("hard-404s unknown category slugs", async () => {
      await expect(
        LegacyCategorySlugPage({ params: Promise.resolve({ slug: "invalid-slug" }) }),
      ).rejects.toThrow("NOT_FOUND");
      expect(notFound).toHaveBeenCalled();
      expect(permanentRedirect).not.toHaveBeenCalled();
    });

    it("permanentRedirects valid slugs to /products/:category/", async () => {
      await expect(
        LegacyCategorySlugPage({ params: Promise.resolve({ slug: "valid-slug" }) }),
      ).rejects.toThrow("NEXT_REDIRECT");
      expect(permanentRedirect).toHaveBeenCalledWith("/products/seating/");
      expect(notFound).not.toHaveBeenCalled();
    });
  });
});
