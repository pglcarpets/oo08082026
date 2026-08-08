import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { MemberSuiteShell } from "@/features/shared/shell/MemberSuiteShell";

vi.mock("@/features/shared/shell/GlobalNavHeader", () => ({
  GlobalNavHeader: () => <div data-testid="global-nav-header">Header</div>,
}));

describe("MemberSuiteShell", () => {
  it("renders portal variant with portal shell test id", () => {
    render(
      <MemberSuiteShell variant="portal">
        <div data-testid="child">Portal content</div>
      </MemberSuiteShell>,
    );

    expect(screen.getByTestId("portal-shell")).toHaveAttribute("data-variant", "portal");
    expect(screen.getByTestId("global-nav-header")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders dashboard variant with dashboard hub test id", () => {
    render(
      <MemberSuiteShell variant="dashboard">
        <div data-testid="child">Dashboard content</div>
      </MemberSuiteShell>,
    );

    expect(screen.getByTestId("dashboard-hub")).toHaveAttribute("data-variant", "dashboard");
    expect(screen.getByTestId("global-nav-header")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders crm-standalone variant shell hook", () => {
    render(
      <MemberSuiteShell variant="crm-standalone">
        <div data-testid="child">CRM content</div>
      </MemberSuiteShell>,
    );

    expect(screen.getByTestId("crm-standalone-shell")).toHaveAttribute(
      "data-variant",
      "crm-standalone",
    );
    expect(screen.getByTestId("global-nav-header")).toBeInTheDocument();
  });
});
