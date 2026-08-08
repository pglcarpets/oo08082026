import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeCatalogLayout } from "@/components/home/layout/HomeCatalogLayout";

describe("HomeCatalogLayout", () => {
  it("wraps children in marketing layout and home section", () => {
    render(
      <HomeCatalogLayout>
        <p>Catalog content</p>
      </HomeCatalogLayout>,
    );

    expect(screen.getByTestId("home-marketing-layout")).toBeInTheDocument();
    expect(screen.getByTestId("home-section")).toBeInTheDocument();
    expect(screen.getByText("Catalog content")).toBeInTheDocument();
  });
});
