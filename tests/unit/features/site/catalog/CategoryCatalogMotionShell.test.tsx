import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { CategoryCatalogMotionShell } from "@/features/site/catalog/CategoryCatalogMotionShell";

vi.mock("@gsap/react", () => ({
  useGSAP: () => undefined,
}));

vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    context: vi.fn(() => ({ revert: vi.fn() })),
    from: vi.fn(),
    to: vi.fn(),
  },
}));

vi.mock("@/lib/helpers/gsapMotion", () => ({
  registerGsapPlugins: vi.fn(),
  gsapReducedMotion: () => true,
  GSAP_EASE_OUT: "power3.out",
  GSAP_REVEAL: { y: 28, opacity: 0, duration: 0.85, stagger: 0.11 },
  GSAP_SCROLL_REVEAL: { y: 32, opacity: 0, duration: 0.75, stagger: 0.09 },
}));

describe("CategoryCatalogMotionShell", () => {
  it("renders children inside a category catalog root", () => {
    render(
      <CategoryCatalogMotionShell className="catalog-lane">
        <p data-catalog-reveal>Header</p>
        <article data-catalog-card>Card</article>
      </CategoryCatalogMotionShell>,
    );

    expect(screen.getByTestId("category-catalog")).toBeInTheDocument();
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Card")).toBeInTheDocument();
  });
});
