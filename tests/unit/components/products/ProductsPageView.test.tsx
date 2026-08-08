import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { ProductsPageView } from "@/components/products/ProductsPageView";
import enMessages from "@/i18n/messages/en.json";
import { CATEGORY_ROUTE_COPY } from "@/features/site/data/routeCopy";

vi.mock("@gsap/react", () => ({
  useGSAP: () => undefined,
}));

vi.mock("gsap", () => ({
  default: {
    context: (fn: () => void) => {
      fn();
      return { revert: vi.fn() };
    },
    from: vi.fn(),
    to: vi.fn(),
  },
}));

vi.mock("@/lib/helpers/gsapMotion", () => ({
  registerGsapPlugins: vi.fn(),
  gsapReducedMotion: () => true,
  GSAP_EASE_OUT: "power2.out",
  GSAP_REVEAL: { y: 24, opacity: 0, duration: 0.85, stagger: 0.11 },
  GSAP_SCROLL_REVEAL: { y: 20, opacity: 0, duration: 0.75, stagger: 0.09 },
}));

vi.mock("@phosphor-icons/react", () => ({
  ArrowRight: () => <span data-testid="arrow-right" />,
  CheckCircle: () => <span data-testid="check-circle" />,
  Clock: () => <span data-testid="clock" />,
  ShieldCheck: () => <span data-testid="shield-check" />,
}));

vi.mock("@/components/ui/MarketingCtaLink", () => ({
  MarketingCtaLink: ({
    href,
    children,
  }: {
    href: string;
    children: ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/shared/RouteCtaBand", () => ({
  RouteCtaBand: () => <div data-testid="route-cta-band" />,
}));

const products = enMessages.products;

const baseProps = {
  heroKicker: products.heroKicker,
  heroTitleLead: products.headlineLead,
  heroTitleAccent: products.headlineAccent,
  heroSubtitle: products.heroSubtitle,
  heroPrimaryCta: products.heroPrimaryCta,
  heroSecondaryCta: products.heroSecondaryCta,
  craftQuote: products.craftQuote,
  craftAttribution: products.craftAttribution,
  introKicker: products.introKicker,
  introTitleLead: products.introTitleLead,
  introTitleAccent: products.introTitleAccent,
  introDescription: products.introDescription,
  featureBullets: products.featureBullets,
  categoryRoutesKicker: products.categoryRoutesKicker,
  categoryRoutesDescription: products.categoryRoutesDescription,
  categoryRoutesCta: products.categoryRoutesCta,
  rangeKicker: products.rangeKicker,
  rangeTitleLead: products.rangeTitleLead,
  rangeTitleAccent: products.rangeTitleAccent,
  pillarsKicker: products.pillarsKicker,
  pillarsTitleLead: products.pillarsTitleLead,
  pillarsTitleAccent: products.pillarsTitleAccent,
  pillarsIntro: products.pillarsIntro,
  pillars: products.pillars.map(({ title, detail, icon }) => ({
    title,
    detail,
    icon: icon as "check-circle" | "clock" | "shield",
  })),
  categories: [
    {
      id: "cat-seating",
      name: "Label for Seating",
      href: "/catalog/cat-seating",
      image: "/seating.jpg",
      productCount: 12,
    },
  ],
  deskKicker: products.deskKicker,
  deskTitle: products.deskTitle,
  deskDescription: products.deskDescription,
  deskPrimaryCta: products.deskPrimaryCta,
  deskSecondaryCta: products.deskSecondaryCta,
  deskTertiaryCta: products.deskTertiaryCta,
};

describe("ProductsPageView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders editorial products hub with category tiles", () => {
    render(<ProductsPageView {...baseProps} />);

    expect(screen.getByTestId("products-hero")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: /built to/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /workspace needs/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(products.pillarsTitleLead)).toBeInTheDocument();

    products.pillars.forEach((p) => {
      expect(screen.getByRole("heading", { level: 3, name: p.title })).toBeInTheDocument();
      expect(screen.getByText(p.detail)).toBeInTheDocument();
    });

    expect(document.querySelectorAll(".home-why-card").length).toBe(0);
    expect(document.querySelectorAll(".products-category-tile").length).toBe(1);

    const categoryTile = document.querySelector(
      ".products-category-tile",
    ) as HTMLAnchorElement | null;
    expect(categoryTile).not.toBeNull();
    expect(categoryTile).toHaveAttribute("href", "/catalog/cat-seating");
  });

  it("shows honest empty state when no categories are published", () => {
    render(<ProductsPageView {...baseProps} categories={[]} />);

    expect(
      screen.getByRole("heading", { name: CATEGORY_ROUTE_COPY.offlineTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(CATEGORY_ROUTE_COPY.offlineDescription)).toBeInTheDocument();
  });
});
