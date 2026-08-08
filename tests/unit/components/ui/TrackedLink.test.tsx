import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TrackedLink } from "@/components/ui/TrackedLink";
import {
  handlePlannerEntryNavigation,
  trackSiteCtaClick,
} from "@/lib/analytics/siteEvents";

vi.mock("next/navigation", () => ({
  usePathname: () => "/current-path",
}));

vi.mock("@/lib/analytics/siteEvents", () => ({
  trackSiteCtaClick: vi.fn(),
  handlePlannerEntryNavigation: vi.fn(),
}));

describe("TrackedLink Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders internal link and tracks click", () => {
    render(
      <TrackedLink href="/products/chairs" label="View Chairs" surface="test-page">
        Go to Chairs
      </TrackedLink>,
    );

    const link = screen.getByTestId("next-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/products/chairs");
    expect(link).toHaveTextContent("Go to Chairs");

    fireEvent.click(link);

    expect(trackSiteCtaClick).toHaveBeenCalledWith({
      href: "/products/chairs",
      label: "View Chairs",
      pathname: "/current-path",
      surface: "test-page",
    });
    expect(handlePlannerEntryNavigation).not.toHaveBeenCalled();
  });

  it("renders external link and tracks click", () => {
    render(
      <TrackedLink
        href="https://google.com"
        label="Google"
        surface="test-page"
        target="_blank"
        rel="noopener noreferrer"
        className="external-class"
      >
        Search Google
      </TrackedLink>,
    );

    const link = screen.getByRole("link", { name: "Search Google" });
    expect(link).toBeInTheDocument();
    expect(link).not.toHaveAttribute("data-testid", "next-link");
    expect(link).toHaveAttribute("href", "https://google.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveClass("external-class");

    fireEvent.click(link);

    expect(trackSiteCtaClick).toHaveBeenCalledWith({
      href: "https://google.com",
      label: "Google",
      pathname: "/current-path",
      surface: "test-page",
    });
  });

  it("handles mailto and tel links as external", () => {
    const { rerender } = render(
      <TrackedLink href="mailto:info@oando.co.in" label="Email" surface="footer">
        Email Us
      </TrackedLink>,
    );
    expect(screen.queryByTestId("next-link")).toBeNull();

    rerender(
      <TrackedLink href="tel:+9112345678" label="Call" surface="footer">
        Call Us
      </TrackedLink>,
    );
    expect(screen.queryByTestId("next-link")).toBeNull();
  });

  it("SSR-safe planner href omits cookie utm; click path includes attribution tracking", () => {
    document.cookie = "oando_seo_source=google; path=/";
    document.cookie = "oando_seo_medium=cpc; path=/";
    document.cookie = "oando_seo_campaign=spring; path=/";

    render(
      <TrackedLink href="/ooplanner" label="Open planner" surface="hero">
        Launch
      </TrackedLink>,
    );

    const link = screen.getByTestId("next-link");
    const href = link.getAttribute("href") ?? "";
    expect(href.startsWith("/ooplanner")).toBe(true);
    expect(href).toContain("siteSource=%2Fcurrent-path");
    expect(href).not.toContain("utm_source=");
    expect(href).not.toContain("utm_medium=");

    fireEvent.click(link);

    expect(handlePlannerEntryNavigation).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Open planner",
        pathname: "/current-path",
        surface: "hero",
        href: expect.stringContaining("utm_source=google"),
      }),
    );
    expect(trackSiteCtaClick).not.toHaveBeenCalled();

    document.cookie = "oando_seo_source=; Max-Age=0; path=/";
    document.cookie = "oando_seo_medium=; Max-Age=0; path=/";
    document.cookie = "oando_seo_campaign=; Max-Age=0; path=/";
  });
});
