import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import PortalLayout, { metadata } from "@/app/(site)/portal/layout";

describe("app/(site)/portal/layout.tsx", () => {
  it("exports noindex portal metadata with absolute single-brand title", () => {
    expect(metadata.title).toEqual({ absolute: "Portal | One&Only" });
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.alternates?.canonical).toMatch(/\/portal\/?$/);
  });

  it("renders children directly", () => {
    render(
      <PortalLayout>
        <div data-testid="portal-child">Portal child</div>
      </PortalLayout>,
    );
    expect(screen.getByTestId("portal-child")).toBeInTheDocument();
  });
});
