import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { CrmDemoBanner } from "@/features/crm/CrmDemoBanner";

const mockIsCrmDemoModeEnabled = vi.fn();

vi.mock("@/features/crm/stores/crmDemoSeed", () => ({
  isCrmDemoModeEnabled: () => mockIsCrmDemoModeEnabled(),
}));

describe("CrmDemoBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders demo warning copy when demo mode is enabled", () => {
    mockIsCrmDemoModeEnabled.mockReturnValue(true);

    render(<CrmDemoBanner />);

    expect(screen.getByRole("status")).toHaveTextContent("Demo workspace");
    expect(
      screen.getByText(/persist in this browser only/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      /Do not rely on this data for\s+production workflows/i,
    );
  });

  it("renders nothing when demo mode is disabled", () => {
    mockIsCrmDemoModeEnabled.mockReturnValue(false);

    const { container } = render(<CrmDemoBanner />);

    expect(container).toBeEmptyDOMElement();
  });
});
