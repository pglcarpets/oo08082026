import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import DesignKitPageView from "@/features/admin/design-kit/DesignKitPageView";

describe("DesignKitPageView", () => {
  it("renders the design kit page with site and product sections", () => {
    render(<DesignKitPageView />);

    expect(screen.getByTestId("design-kit-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Oando design kit" })).toBeInTheDocument();

    expect(screen.getByTestId("design-kit-site")).toBeInTheDocument();
    expect(screen.getByTestId("design-kit-site-surfaces")).toBeInTheDocument();
    expect(screen.getByTestId("design-kit-product")).toBeInTheDocument();
    expect(screen.getByTestId("design-kit-forms")).toBeInTheDocument();
    expect(screen.getByTestId("design-kit-surfaces")).toBeInTheDocument();
    expect(screen.getByTestId("design-kit-buttons")).toBeInTheDocument();
    expect(screen.getByTestId("design-kit-density")).toBeInTheDocument();
    expect(screen.getByTestId("design-kit-states")).toBeInTheDocument();
    expect(screen.getByTestId("design-kit-feedback")).toBeInTheDocument();

    // Site material swatches
    expect(screen.getByText("Scheme page paper")).toBeInTheDocument();
    // Bronze appears in both the site material board and the product token board.
    expect(
      screen.getAllByText("Bronze accent", { selector: ".design-kit-swatch-label" }),
    ).toHaveLength(2);

    // Product buttons: every variant + size rendered. Variants are shown on both
    // the density board and the variant board, so assert presence, not uniqueness.
    for (const name of [
      "default",
      "primary",
      "outline",
      "secondary",
      "ghost",
      "destructive",
      "link",
      "xs",
      "lg",
      "Settings",
    ]) {
      expect(
        screen.getAllByRole("button", { name }).length,
        `button "${name}" must render`,
      ).toBeGreaterThan(0);
    }

    // Workspace states
    expect(screen.getByTestId("design-kit-state-empty")).toHaveTextContent("No selection");
    expect(screen.getByTestId("design-kit-state-loading")).toHaveTextContent("Loading catalog…");
    expect(screen.getByTestId("design-kit-state-error")).toHaveTextContent(
      "Could not load inventory",
    );

    // Form controls
    expect(screen.getByLabelText("Product name")).toHaveValue("Workstation L-Shape");
    expect(screen.getByLabelText("SKU")).toHaveAttribute("aria-invalid");
    expect(screen.getByLabelText("Revision")).toBeDisabled();
    expect(screen.getByLabelText("Include in publish")).toBeChecked();
    expect(screen.getByLabelText("Live preview")).toBeChecked();

    // Feedback surfaces
    expect(screen.getByText("Publish ready")).toBeInTheDocument();
    expect(screen.getByText("Publish blocked")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="badge"]')?.textContent).toBe("Default");

    expect(screen.getByRole("link", { name: "Explore planner" })).toHaveAttribute(
      "href",
      "/ooplanner/",
    );
  });
});
