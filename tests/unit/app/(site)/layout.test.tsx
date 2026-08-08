import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import SiteLayout, {
  metadata,
  viewport,
} from "@/app/(site)/layout";
import { SITE_VIEWPORT } from "@/lib/siteViewport";

vi.mock("@/app/(site)/providers/QueryProvider", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-provider">{children}</div>
  ),
}));

vi.mock("@/components/site/RouteChromeSuspense", () => ({
  RouteChromeSuspense: ({ position }: { position: string }) => (
    <div data-testid={`route-chrome-${position}`} />
  ),
}));

vi.mock("@/components/site/SiteErrorBoundary", () => ({
  SiteErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="site-error-boundary">{children}</div>
  ),
}));

describe("app/(site)/layout.tsx", () => {
  it("exports site metadata and viewport themeColor", () => {
    expect(metadata).toBeDefined();
    expect(viewport.themeColor).toBe("var(--color-ocean-boat-blue-900)");
    expect(viewport.width).toBe(SITE_VIEWPORT.width);
  });

  it("renders chrome, main, and children inside QueryProvider", async () => {
    // Async server component: resolve it first, then render the element.
    // `render(<SiteLayout />)` hands React a promise and nothing mounts.
    const layout = await SiteLayout({
      children: <div data-testid="site-child">Site child</div>,
    });
    render(layout);

    expect(screen.getByTestId("site-error-boundary")).toBeInTheDocument();
    expect(screen.getByTestId("query-provider")).toBeInTheDocument();
    expect(screen.getByTestId("route-chrome-top")).toBeInTheDocument();
    expect(screen.getByTestId("route-chrome-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("site-child")).toBeInTheDocument();
    expect(document.getElementById("main-content")).toContainElement(
      screen.getByTestId("site-child"),
    );
  });
});
