import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import DashboardLayout, { metadata } from "@/app/(site)/dashboard/layout";

vi.mock("@/features/shared/shell/MemberSuiteShell", () => ({
  MemberSuiteShell: ({
    variant,
    children,
  }: {
    variant: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="member-suite-shell" data-variant={variant}>
      <div data-testid="global-nav-header" />
      {children}
    </div>
  ),
}));

describe("app/(site)/dashboard/layout.tsx", () => {
  it("exports noindex dashboard metadata with absolute single-brand title", () => {
    expect(metadata.title).toMatchObject({
      absolute: expect.stringContaining("Member dashboard"),
    });
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.alternates?.canonical).toMatch(/\/dashboard\/?$/);
  });

  it("wraps children in MemberSuiteShell dashboard variant", () => {
    render(
      <DashboardLayout>
        <div data-testid="dashboard-child">Dashboard child</div>
      </DashboardLayout>,
    );

    expect(screen.getByTestId("member-suite-shell")).toHaveAttribute(
      "data-variant",
      "dashboard",
    );
    expect(screen.getByTestId("global-nav-header")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-child")).toBeInTheDocument();
  });
});
