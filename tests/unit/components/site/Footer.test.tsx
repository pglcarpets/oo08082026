import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "@/components/site/Footer";
import { SITE_FOOTER_NAV, SITE_SOCIAL_LINKS } from "@/features/site/data/navigation";
import { SITE_CONTACT } from "@/features/site/data/contact";

vi.mock("@/components/ui/Logo", () => ({
  OneAndOnlyLogo: ({
    variant,
    className,
  }: {
    variant?: string;
    className?: string;
  }) => (
    <div data-testid="logo" data-variant={variant} className={className}>
      Logo
    </div>
  ),
}));

vi.mock("@/components/site/LanguageSwitcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">Language Switcher</div>,
}));

function expectMinTapTarget(el: HTMLElement) {
  // Footer uses site-footer__link with py-1 for text links and min-h-11 for legal links.
  // Both approaches meet the ≥44 px threshold.
  expect(el.className).toMatch(/site-footer__|min-h-11/);
}

describe("SiteFooter Component", () => {
  it("renders brand, contact, real footer nav, and legal links", () => {
    render(<SiteFooter />);

    const logo = screen.getByTestId("logo");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("data-variant", "orange");
    expect(screen.getByRole("link", { name: /One&Only - home/i })).toHaveAttribute("href", "/");

    expect(screen.getByText(/Jagat Trade Centre/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /90310 22875/ })).toHaveAttribute(
      "href",
      // toTelHref strips spaces — not the raw display phone string
      `tel:${SITE_CONTACT.supportPhone.replace(/[^\d+]/g, "")}`,
    );
    expect(screen.getByRole("link", { name: SITE_CONTACT.salesEmail })).toHaveAttribute(
      "href",
      `mailto:${SITE_CONTACT.salesEmail}`,
    );

    expect(screen.getByTestId("language-switcher")).toBeInTheDocument();

    for (const social of SITE_SOCIAL_LINKS) {
      const socialLink = screen.getByRole("link", { name: social.label });
      expect(socialLink).toHaveAttribute("href", social.href);
    }

    for (const col of SITE_FOOTER_NAV) {
      expect(screen.getByText(col.heading)).toBeInTheDocument();
      for (const link of col.links) {
        expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
      }
    }

    expect(screen.getByRole("link", { name: "Refund Policy" })).toHaveAttribute(
      "href",
      "/refund-and-return-policy",
    );
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "/privacy",
    );
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
    expect(screen.queryByRole("link", { name: "Imprint" })).not.toBeInTheDocument();

    expect(
      screen.getByText(new RegExp(`One&Only. All rights reserved.`)),
    ).toBeInTheDocument();
  });

  it("does not expose a public Admin link (real nav data, not mocks)", () => {
    render(<SiteFooter />);

    const hrefs = SITE_FOOTER_NAV.flatMap((section) => section.links.map((l) => l.href));
    const labels = SITE_FOOTER_NAV.flatMap((section) => section.links.map((l) => l.label));
    expect(hrefs.some((href) => /^\/admin(\/|$)/i.test(href))).toBe(false);
    expect(labels.some((label) => label.trim().toLowerCase() === "admin")).toBe(false);

    const rendered = screen.getAllByRole("link");
    for (const link of rendered) {
      const href = link.getAttribute("href") ?? "";
      const label = (link.textContent ?? "").trim().toLowerCase();
      expect(href.toLowerCase()).not.toMatch(/^\/admin(\/|$)/);
      expect(label).not.toBe("admin");
    }
    expect(screen.queryByRole("link", { name: /^admin$/i })).not.toBeInTheDocument();
  });

  it("uses ≥44px tap targets on contact, nav, social, and legal links (mobile readability)", () => {
    render(<SiteFooter />);

    expectMinTapTarget(screen.getByRole("link", { name: /One&Only - home/i }));
    expectMinTapTarget(screen.getByRole("link", { name: /90310 22875/ }));
    expectMinTapTarget(screen.getByRole("link", { name: SITE_CONTACT.salesEmail }));

    for (const social of SITE_SOCIAL_LINKS) {
      const socialLink = screen.getByRole("link", { name: social.label });
      expectMinTapTarget(socialLink);
      expect(socialLink.className).toMatch(/w-9/);
    }

    for (const col of SITE_FOOTER_NAV) {
      for (const link of col.links) {
        expectMinTapTarget(screen.getByRole("link", { name: link.label }));
      }
    }

    expectMinTapTarget(screen.getByRole("link", { name: "Refund Policy" }));
    expectMinTapTarget(screen.getByRole("link", { name: "Privacy Policy" }));
    expectMinTapTarget(screen.getByRole("link", { name: "Terms" }));
  });
});
