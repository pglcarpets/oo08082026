// @vitest-environment happy-dom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExportMenu } from "@studio/components/ui/StudioExportMenu";

afterEach(() => {
  cleanup();
});

const ITEMS = [
  { id: "svg", label: "SVG", onSelect: vi.fn(), testId: "btn-export-svg" },
  { id: "png", label: "PNG", onSelect: vi.fn(), testId: "btn-export-png" },
];

describe("studio: ExportMenu", () => {
  it("keeps export actions in the DOM for automation (hidden until opened)", () => {
    render(<ExportMenu items={ITEMS} />);

    const panel = screen.getByTestId("export-menu-panel");
    expect(panel).toHaveAttribute("hidden");

    expect(screen.getByTestId("btn-export-svg")).toBeInTheDocument();
    expect(screen.getByTestId("btn-export-png")).toBeInTheDocument();
  });

  it("opens on trigger click and runs export handler", async () => {
    const user = userEvent.setup();
    const onSvg = vi.fn();
    render(
      <ExportMenu
        items={[{ id: "svg", label: "SVG", onSelect: onSvg, testId: "btn-export-svg" }]}
      />,
    );

    await user.click(screen.getByTestId("btn-export-menu"));
    expect(screen.getByTestId("export-menu-panel")).not.toHaveAttribute("hidden");

    await user.click(screen.getByTestId("btn-export-svg"));
    expect(onSvg).toHaveBeenCalledOnce();
    expect(screen.getByTestId("export-menu-panel")).toHaveAttribute("hidden");
  });

  it("opens from keyboard on ArrowDown and selects with Enter", async () => {
    const user = userEvent.setup();
    const onPng = vi.fn();
    render(
      <ExportMenu
        items={[
          { id: "svg", label: "SVG", onSelect: vi.fn(), testId: "btn-export-svg" },
          { id: "png", label: "PNG", onSelect: onPng, testId: "btn-export-png" },
        ]}
      />,
    );

    const trigger = screen.getByTestId("btn-export-menu");
    trigger.focus();
    await user.keyboard("{ArrowDown}");

    expect(screen.getByTestId("export-menu-panel")).not.toHaveAttribute("hidden");
    expect(screen.getByTestId("btn-export-svg")).toHaveFocus();

    await user.keyboard("{ArrowDown}{Enter}");
    expect(onPng).toHaveBeenCalledOnce();
    expect(trigger).toHaveFocus();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<ExportMenu items={ITEMS} />);

    const trigger = screen.getByTestId("btn-export-menu");
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByTestId("export-menu-panel")).not.toHaveAttribute("hidden");

    await user.keyboard("{Escape}");
    expect(screen.getByTestId("export-menu-panel")).toHaveAttribute("hidden");
    expect(trigger).toHaveFocus();
  });

  it("renders grouped sections with headings", async () => {
    const user = userEvent.setup();
    const onGlb = vi.fn();
    render(
      <ExportMenu
        sections={[
          {
            id: "plan",
            heading: "Plan",
            items: [{ id: "svg", label: "SVG", onSelect: vi.fn(), testId: "btn-export-svg" }],
          },
          {
            id: "3d",
            heading: "3D",
            items: [{ id: "glb", label: "GLB", onSelect: onGlb, testId: "btn-export-glb" }],
          },
        ]}
      />,
    );

    await user.click(screen.getByTestId("btn-export-menu"));
    expect(screen.getByText("Plan")).toBeInTheDocument();
    expect(screen.getByText("3D")).toBeInTheDocument();

    await user.click(screen.getByTestId("btn-export-glb"));
    expect(onGlb).toHaveBeenCalledOnce();
  });
});
