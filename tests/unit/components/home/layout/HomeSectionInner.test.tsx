import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeSectionInner } from "@/components/home/layout/HomeSectionInner";

describe("HomeSectionInner", () => {
  it("renders home-shell-xl wrapper testid", () => {
    render(
      <HomeSectionInner>
        <p>Inner content</p>
      </HomeSectionInner>,
    );

    expect(screen.getByTestId("home-section-inner")).toHaveClass("home-shell-xl");
    expect(screen.getByText("Inner content")).toBeInTheDocument();
  });
});
