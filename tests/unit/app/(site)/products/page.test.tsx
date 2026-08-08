import "@/tests/helpers/nextIntlServerEnMock";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ProductsPage from "@/app/(site)/products/page";
import { expectHomeMarketingShell } from "@/tests/unit/app/(site)/_template.homepage.test";

vi.mock("@/components/home/CategoryGrid", () => ({
  loadProductsCategoryTiles: vi.fn(async () => [
    {
      id: "cat-seating",
      name: "Seating",
      href: "/products/cat-seating",
      image: "/seating.jpg",
      productCount: 8,
    },
  ]),
}));

vi.mock("@/components/products/ProductsPageView", () => ({
  ProductsPageView: () => (
    <section data-testid="products-page-view" className="home-section">
      <div className="home-shell-xl" />
    </section>
  ),
}));

vi.mock("@/components/shared/ContactTeaser", () => ({
  ContactTeaser: () => <div data-testid="contact-teaser" />,
}));

vi.mock("@/features/site/data/seo", () => ({
  buildPageJsonLd: vi.fn(() => ({ "@type": "CollectionPage" })),
  buildPageMetadata: vi.fn(() => ({ title: "Products" })),
}));

vi.mock("@/lib/security/sanitize", () => ({
  sanitizeJsonForScript: vi.fn((data) => JSON.stringify(data)),
}));

describe("ProductsPage", () => {
  it("renders homepage marketing shell with products view", async () => {
    const jsx = await ProductsPage();
    const { container } = render(jsx);

    expectHomeMarketingShell(container);
    expect(screen.getByTestId("products-page-view")).toBeInTheDocument();
    expect(screen.getByTestId("contact-teaser")).toBeInTheDocument();
  });
});
