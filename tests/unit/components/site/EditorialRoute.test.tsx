/**
 * Name-mirror: components/site/EditorialRoute
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  EditorialArrowLink,
  EditorialCta,
  EditorialHero,
} from "@/components/site/EditorialRoute";

describe("EditorialRoute", () => {
  describe("EditorialHero", () => {
    it("renders lead and accent in the hero heading", () => {
      render(<EditorialHero lead="See how work" accent="comes together." />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("See how work comes together.");
      expect(heading.querySelector(".text-accent-italic")).toHaveTextContent(
        "comes together.",
      );
    });
  });

  describe("EditorialArrowLink", () => {
    it("renders a labelled link with href and optional className", () => {
      render(
        <EditorialArrowLink href="/contact" className="mt-8">
          Talk to us
        </EditorialArrowLink>,
      );

      const link = screen.getByRole("link", { name: "Talk to us" });
      expect(link).toHaveAttribute("href", "/contact");
      expect(link).toHaveClass("mt-8");
      expect(link).toHaveClass("typ-label");
    });
  });

  describe("EditorialCta", () => {
    it("renders heading copy and primary CTA link", () => {
      render(
        <EditorialCta
          lead="Ready to plan"
          accent="your space?"
          href="/planner"
          label="Open planner"
        />,
      );

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("Ready to plan your space?");
      expect(heading.querySelector(".text-accent-italic")).toHaveTextContent(
        "your space?",
      );

      const cta = screen.getByRole("link", { name: "Open planner" });
      expect(cta).toHaveAttribute("href", "/planner");
      expect(cta).toHaveClass("btn-primary");
    });
  });
});
