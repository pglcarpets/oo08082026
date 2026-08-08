/**
 * Name-mirror: site/app/not-found.tsx
 * Root 404 owns chrome + absolute noindex — never homepage dual titles.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RootNotFound, { metadata } from "@/app/not-found";

vi.mock("@/components/site/Header", () => ({
  SiteHeader: () => <header data-testid="site-header">Header</header>,
}));

vi.mock("@/components/site/Footer", () => ({
  SiteFooter: () => <footer data-testid="site-footer">Footer</footer>,
}));

vi.mock("@/components/ui/MarketingCtaLink", () => ({
  MarketingCtaLink: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("app/not-found.tsx", () => {
  it("exports noindex 404 metadata (no soft homepage shell SEO)", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    const title =
      typeof metadata.title === "string"
        ? metadata.title
        : typeof metadata.title === "object" && metadata.title && "absolute" in metadata.title
          ? String(metadata.title.absolute)
          : String(metadata.title ?? "");
    expect(title.toLowerCase()).toContain("not found");
    expect(title.toLowerCase()).toContain("404");
  });

  it("renders recovery links without Admin destinations", () => {
    render(<RootNotFound />);

    expect(screen.getByTestId("site-header")).toBeInTheDocument();
    expect(screen.getByTestId("site-footer")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /could not find that page/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to homepage" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Workspace planner" })).toHaveAttribute(
      "href",
      "/planner",
    );

    const links = screen.getAllByRole("link");
    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      const label = (link.textContent ?? "").trim().toLowerCase();
      expect(href.toLowerCase()).not.toMatch(/^\/admin(\/|$)/);
      expect(label).not.toBe("admin");
    }
  });
});
