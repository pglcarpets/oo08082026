/**
 * Name-mirror: features/shared/entry/ProductEntryPage
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductEntryPage } from "@/features/shared/entry/ProductEntryPage";

const baseProps = {
  title: "Workspace Planner",
  eyebrow: "Unified product",
  description: "Plan layouts with catalog furniture and export.",
  primaryHref: "/ooplanner",
  primaryLabel: "Open planner",
  secondaryHref: "/choose-product",
  secondaryLabel: "Back to chooser",
  recentLabel: "Resume your latest draft.",
  statusLabel: "Ready to launch",
  restrictions: ["Save disabled", "Export disabled"],
  capabilities: ["2D editing", "3D preview"],
};

describe("ProductEntryPage", () => {
  it("renders guest limitations copy and capability list", () => {
    render(
      <ProductEntryPage {...baseProps} guestMode authenticated={false} />,
    );

    expect(screen.getByRole("heading", { name: baseProps.title })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Restricted actions remain visible inside the live tool and explain why they are unavailable/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Save disabled")).toBeInTheDocument();
    expect(screen.getByText("2D editing")).toBeInTheDocument();
  });

  it("renders member messaging and primary launch link", () => {
    render(<ProductEntryPage {...baseProps} guestMode={false} authenticated />);

    expect(
      screen.getByText(
        /Member access unlocks the full output and persistence flow after you launch the tool/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: baseProps.primaryLabel })).toHaveAttribute(
      "href",
      baseProps.primaryHref,
    );
    expect(screen.getByRole("link", { name: baseProps.secondaryLabel })).toHaveAttribute(
      "href",
      baseProps.secondaryHref,
    );
  });

  it("renders neutral exploration copy for unauthenticated non-guest", () => {
    render(
      <ProductEntryPage {...baseProps} guestMode={false} authenticated={false} />,
    );
    expect(
      screen.getByText(
        /Guests can still explore the live product surface, but output and persistence actions stay disabled/,
      ),
    ).toBeInTheDocument();
  });
});
