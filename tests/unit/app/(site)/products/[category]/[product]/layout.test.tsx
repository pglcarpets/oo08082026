import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import ProductDetailLayout from "@/app/(site)/products/[category]/[product]/layout";

describe("app/(site)/products/[category]/[product]/layout.tsx", () => {
  it("renders children (PDP layout pass-through)", () => {
    render(
      <ProductDetailLayout>
        <div data-testid="pdp-child">Product detail</div>
      </ProductDetailLayout>,
    );
    expect(screen.getByTestId("pdp-child")).toBeInTheDocument();
    expect(screen.getByText("Product detail")).toBeInTheDocument();
  });
});
