import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import SolutionsCategoryPage, {
  generateStaticParams,
  generateMetadata,
  dynamicParams,
} from "@/app/(site)/solutions/[category]/page";
import { SOLUTION_CATEGORY_IDS } from "@/features/site/data/routeClassification";
import { notFound } from "next/navigation";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => {
    const messages: Record<string, string> = {
      categoryHeroKicker: "Solution category",
      categoryHeroPrimaryCta: "Browse products",
      categoryHeroSecondaryCta: "All solutions",
      categoryCraftQuote:
        "Inventory is the start — layout and circulation decide whether the category works on site.",
      categoryCraftAttribution: "Planning desk · One&Only",
      categoryBodyKicker: "Specify",
      categoryBodyTitle: "From live catalog to layout",
      categoryBodyDescription:
        "{description} Browse the live product catalog or speak with the planning desk for a workspace layout aligned to this category.",
      categoryBrowseCta: "Browse products",
      categoryAllCta: "All solutions",
      categoryContactCta: "Contact planning desk",
      categoryDeskKicker: "Next step",
      categoryDeskTitle: "Plan this category",
      categoryDeskDescription:
        "Share seat count, timeline, and site constraints — we propose products and a practical layout path.",
      categoryDeskPrimaryCta: "Planning call",
      categoryDeskSecondaryCta: "Open planner",
      categoryDeskTertiaryCta: "All solutions",
    };

    const t = ((key: string, values?: { description?: string }) => {
      const raw = messages[key] ?? key;
      if (values?.description && raw.includes("{description}")) {
        return raw.replace("{description}", values.description);
      }
      return raw;
    }) as ((key: string, values?: { description?: string }) => string) & {
      raw: (key: string) => unknown;
    };
    t.raw = (key: string) => messages[key];
    return t;
  }),
}));

vi.mock("@/components/solutions/SolutionsCategoryPageView", () => ({
  SolutionsCategoryPageView: (props: {
    heroTitleLead: string;
    heroSubtitle: string;
    productsHref: string;
    browseCta: string;
    allSolutionsCta: string;
    contactCta: string;
  }) => (
    <div data-testid="mock-solutions-category-view">
      <h1>
        {props.heroTitleLead}
      </h1>
      <p>{props.heroSubtitle}</p>
      <a href={props.productsHref}>{props.browseCta}</a>
      <a href="/solutions">{props.allSolutionsCta}</a>
      <a href="/contact">{props.contactCta}</a>
    </div>
  ),
}));

vi.mock("@/components/shared/ContactTeaser", () => ({
  ContactTeaser: () => <div data-testid="mock-contact-teaser">Contact Teaser</div>,
}));

vi.mock("@/features/site/data/seo", () => ({
  buildPageMetadata: (_url: string, opts: { title: string; description: string }) => ({
    title: { absolute: `${opts.title} | One&Only` },
    description: opts.description,
  }),
}));

vi.mock("@/lib/siteUrl", () => ({
  SITE_URL: "https://oando.co.in",
}));

describe("SolutionsCategoryPage Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("disables unknown dynamic slugs (hard 404, no soft shell)", () => {
    expect(dynamicParams).toBe(false);
  });

  describe("generateStaticParams", () => {
    it("returns exactly SOLUTION_CATEGORY_IDS (sitemap lockstep)", () => {
      const params = generateStaticParams();
      expect(params).toEqual(
        SOLUTION_CATEGORY_IDS.map((category) => ({ category })),
      );
      expect(params).toContainEqual({ category: "seating" });
      expect(params).toContainEqual({ category: "soft-seating" });
      expect(params).toContainEqual({ category: "education" });
    });
  });

  describe("generateMetadata", () => {
    it("returns metadata for a valid category", async () => {
      const meta = await generateMetadata({
        params: Promise.resolve({ category: "seating" }),
      });
      expect(meta.title).toEqual({ absolute: "Seating Solutions | One&Only" });
      expect(meta.description).toContain("Ergonomic seating solutions");
    });

    it("hard-404s unknown slugs instead of soft-404 marketing metadata", async () => {
      await expect(
        generateMetadata({
          params: Promise.resolve({ category: "invalid-cat" }),
        }),
      ).rejects.toThrow("NOT_FOUND");
      expect(notFound).toHaveBeenCalled();
    });
  });

  describe("SolutionsCategoryPage Component", () => {
    it("renders correctly for a valid category", async () => {
      const pageElement = await SolutionsCategoryPage({
        params: Promise.resolve({ category: "seating" }),
      });

      render(pageElement);

      expect(screen.getByTestId("mock-solutions-category-view")).toBeInTheDocument();
      expect(screen.getByTestId("mock-contact-teaser")).toBeInTheDocument();

      expect(
        screen.getByRole("heading", { level: 1, name: "Seating" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Ergonomic seating solutions for focused and collaborative work."),
      ).toBeInTheDocument();

      expect(screen.getByRole("link", { name: "Browse products" })).toHaveAttribute(
        "href",
        "/products/seating",
      );
      expect(screen.getByRole("link", { name: "All solutions" })).toHaveAttribute(
        "href",
        "/solutions",
      );
      expect(screen.getByRole("link", { name: "Contact planning desk" })).toHaveAttribute(
        "href",
        "/contact",
      );
    });

    it("calls notFound() for an invalid category", async () => {
      await expect(
        SolutionsCategoryPage({
          params: Promise.resolve({ category: "invalid-cat" }),
        }),
      ).rejects.toThrow("NOT_FOUND");

      expect(notFound).toHaveBeenCalled();
    });
  });
});
