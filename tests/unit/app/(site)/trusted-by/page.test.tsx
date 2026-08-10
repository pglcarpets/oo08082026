import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TRUSTED_BY_PAGE_COPY } from "@/features/site/data/routeCopy";

vi.mock("@/lib/helpers/gsapMotion", () => ({
  registerGsapPlugins: () => {},
  gsapReducedMotion: () => true,
  GSAP_EASE_OUT: "power3.out",
  GSAP_REVEAL: { y: 24, opacity: 0, duration: 0.85, stagger: 0.11 },
  GSAP_SCROLL_REVEAL: { y: 20, opacity: 0, duration: 0.75, stagger: 0.09 },
}));

vi.mock("@gsap/react", () => ({
  useGSAP: () => undefined,
}));

vi.mock("next/image", () => ({
  default: (props: { alt?: string }) => (
    <img alt={props.alt ?? ""} data-testid="mock-next-image" />
  ),
}));

vi.mock("@/components/home/layout", () => ({
  HomeMarketingLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="home-marketing-layout">{children}</div>
  ),
  HomeSection: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
  HomeSectionInner: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/shared/ContactTeaser", () => ({
  ContactTeaser: () => <div data-testid="mock-contact-teaser" />,
}));

vi.mock("@/components/ui/MarketingCtaLink", () => ({
  MarketingCtaLink: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/shared/RouteCtaBand", () => ({
  RouteCtaBand: ({ title, description }: { title: React.ReactNode; description: React.ReactNode }) => (
    <div data-testid="mock-route-cta-band">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
}));

import TrustedByPage from "@/app/(site)/trusted-by/page";

describe("app/(site)/trusted-by/page.tsx", () => {
  it("renders editorial hero and abstract trust copy", () => {
    render(<TrustedByPage />);
    expect(screen.getByTestId("home-marketing-layout")).toBeInTheDocument();
    expect(screen.getByTestId("trusted-by-hero")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(TRUSTED_BY_PAGE_COPY.overviewKicker)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: TRUSTED_BY_PAGE_COPY.overviewTitle,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(TRUSTED_BY_PAGE_COPY.overviewDescription)).toBeInTheDocument();
    expect(screen.queryByTestId("trusted-by-roster")).not.toBeInTheDocument();
    expect(screen.getByTestId("trusted-by-palette")).toBeInTheDocument();
  });
});
