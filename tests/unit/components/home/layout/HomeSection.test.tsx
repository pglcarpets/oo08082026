import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeSection } from "@/components/home/layout/HomeSection";

describe("HomeSection", () => {
  it("renders variant section class and testid", () => {
    render(
      <HomeSection variant="soft" spacing="sm" borderY>
        <p>Section body</p>
      </HomeSection>,
    );

    const section = screen.getByTestId("home-section");
    expect(section).toHaveClass("home-section");
    expect(section).toHaveClass("home-section--soft");
    expect(section).toHaveClass("border-t");
    expect(section).toHaveClass("border-b");
    expect(section).toHaveClass("section-y-sm");
    expect(screen.getByText("Section body")).toBeInTheDocument();
  });
});
