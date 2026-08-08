import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeMarketingLayout } from "@/components/home/layout/HomeMarketingLayout";

vi.mock("@/components/shared/ContactTeaser", () => ({
  ContactTeaser: () => <div data-testid="ContactTeaser" />,
}));

describe("HomeMarketingLayout", () => {
  it("renders homepage outer shell testid and overflow wrapper", () => {
    const { container } = render(
      <HomeMarketingLayout>
        <p>Page body</p>
      </HomeMarketingLayout>,
    );

    expect(screen.getByTestId("home-marketing-layout")).toHaveClass(
      "home-marketing-layout",
      "overflow-x-clip", "overflow-y-visible",
    );
    expect(screen.getByText("Page body")).toBeInTheDocument();
    expect(container.querySelector(".min-h-screen")).toBeDefined();
    expect(screen.queryByTestId("ContactTeaser")).not.toBeInTheDocument();
  });

  it("optionally renders ContactTeaser", () => {
    render(
      <HomeMarketingLayout contactTeaser>
        <p>Page body</p>
      </HomeMarketingLayout>,
    );

    expect(screen.getByTestId("ContactTeaser")).toBeInTheDocument();
  });
});
