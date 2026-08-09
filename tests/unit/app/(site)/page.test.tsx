/**
 * Name-mirror: app/(site)/page.tsx — homepage smoke render.
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import Home, { metadata } from "@/app/(site)/page";
import { HomeMarketingLayout } from "@/components/home/layout";

vi.mock("@/features/crm/businessStats", () => ({
  getBusinessStats: vi.fn().mockResolvedValue({
    stats: {
      activeUsers: 10,
      generatedPlans: 20,
      configuredProducts: 30,
    },
  }),
}));

vi.mock("@/components/home/HomepageHero", () => ({
  HomepageHero: () => <div data-testid="HomepageHero" />,
}));

vi.mock("@/components/home/Collections", () => ({
  Collections: () => <div data-testid="Collections" />,
}));

vi.mock("@/components/home/TrustStrip", () => ({
  TrustStrip: ({
    stats,
  }: {
    stats: { activeUsers: number; generatedPlans: number; configuredProducts: number };
  }) => (
    <div
      data-testid="TrustStrip"
      data-active-users={String(stats.activeUsers)}
    />
  ),
}));

vi.mock("@/components/home/HomeDeferredSections", () => ({
  HomeDeferredSections: () => (
    <div data-testid="HomeDeferredSections">
      <div data-testid="InteractiveTools" />
      <div data-testid="WhyChooseUs" />
      <div data-testid="ShowcaseCarousel" />
      <div data-testid="ContactTeaser" />
    </div>
  ),
}));

vi.mock("@/components/home/InteractiveTools", () => ({
  InteractiveTools: () => <div data-testid="InteractiveTools" />,
}));

vi.mock("@/components/home/WhyChooseUs", () => ({
  WhyChooseUs: () => <div data-testid="WhyChooseUs" />,
}));

vi.mock("@/components/home/ShowcaseCarousel", () => ({
  ShowcaseCarousel: () => <div data-testid="ShowcaseCarousel" />,
}));

vi.mock("@/components/shared/ContactTeaser", () => ({
  ContactTeaser: () => <div data-testid="ContactTeaser" />,
}));

vi.mock("@/lib/analytics/seo", () => ({
  SITE_BRAND: {
    defaultTitle: "Oando Office",
    description: "Workplace solutions",
  },
  buildPageMetadata: (
    _base: string,
    opts: { title: string; description: string; path: string },
  ) => ({
    title: opts.title,
    description: opts.description,
    path: opts.path,
  }),
  buildPageJsonLd: () => ({ "@type": "WebPage" }),
}));

vi.mock("@/features/site/data/seo", () => ({
  buildLocalBusinessJsonLd: () => ({ "@type": "LocalBusiness" }),
}));

vi.mock("@/lib/security/sanitize", () => ({
  sanitizeJsonForScript: (data: unknown) => JSON.stringify(data),
}));

describe("app/(site)/page.tsx", () => {
  it("exports homepage metadata", () => {
    expect(metadata.title).toBe("Oando Office");
    expect(metadata.description).toBe("Workplace solutions");
  });

  it("renders marketing shell with homepage sections and stats", async () => {
    const jsx = await Home();
    expect(jsx.type).toBe(HomeMarketingLayout);

    render(jsx);

    expect(screen.getByTestId("home-marketing-layout")).toBeInTheDocument();
    expect(screen.getByTestId("HomepageHero")).toBeInTheDocument();
    expect(screen.getByTestId("Collections")).toBeInTheDocument();
    expect(screen.getByTestId("TrustStrip")).toHaveAttribute(
      "data-active-users",
      "10",
    );
    expect(screen.getByTestId("InteractiveTools")).toBeInTheDocument();
    expect(screen.getByTestId("WhyChooseUs")).toBeInTheDocument();
    expect(screen.getByTestId("ShowcaseCarousel")).toBeInTheDocument();
    expect(screen.getByTestId("ContactTeaser")).toBeInTheDocument();
    expect(screen.queryByTestId("site-mobile-sticky-cta")).not.toBeInTheDocument();
  });

  it("embeds JSON-LD scripts for WebPage and LocalBusiness", async () => {
    const jsx = await Home();
    const { container } = render(jsx);
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    expect(scripts.length).toBeGreaterThanOrEqual(2);
    const payloads = Array.from(scripts).map((el) => el.innerHTML);
    expect(payloads.some((p) => p.includes("WebPage"))).toBe(true);
    expect(payloads.some((p) => p.includes("LocalBusiness"))).toBe(true);
  });
});
