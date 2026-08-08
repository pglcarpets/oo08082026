/**
 * Name-mirror: components/home/layout/SiteWorkspaceShell
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { SiteWorkspaceShell } from "@/components/home/layout/SiteWorkspaceShell";

describe("SiteWorkspaceShell", () => {
  it("renders children inside the workspace shell surface", () => {
    render(
      <SiteWorkspaceShell>
        <p>Workspace body</p>
      </SiteWorkspaceShell>,
    );

    const shell = screen.getByTestId("site-workspace-shell");
    expect(shell).toBeInTheDocument();
    expect(shell).toHaveClass("min-h-screen");
    expect(shell).toHaveClass("w-full");
    expect(screen.getByText("Workspace body")).toBeInTheDocument();
    expect(shell.contains(screen.getByText("Workspace body"))).toBe(true);
  });
});
