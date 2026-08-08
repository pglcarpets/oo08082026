import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Field } from "@/components/ui/Field";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Toolbar } from "@/components/ui/Toolbar";

describe("editor primitives", () => {
  it("keeps icon actions named and FOCSS styled", () => {
    render(<IconButton label="Delete">×</IconButton>);
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toHaveAttribute("data-slot", "button");
    expect(button.className).toContain("admin-btn");
  });

  it("associates field labels with shared inputs", () => {
    render(
      <Field label="Width" htmlFor="width" description="Millimetres">
        <Input id="width" />
      </Field>,
    );
    expect(screen.getByLabelText("Width")).toHaveAttribute("data-slot", "input");
    expect(screen.getByText("Millimetres")).toHaveClass("admin-field__help");
  });

  it("clamps number stepper changes", () => {
    const onValueChange = vi.fn();
    render(
      <NumberStepper id="count" value={2} min={1} max={2} onValueChange={onValueChange} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Increase" }));
    expect(onValueChange).toHaveBeenCalledWith(2);
  });

  it("renders FOCSS panel and toolbar structure", () => {
    render(
      <Panel aria-label="Inspector">
        <PanelHeader>Inspector</PanelHeader>
        <Toolbar aria-label="Actions" />
      </Panel>,
    );
    expect(screen.getByRole("region", { name: "Inspector" })).toHaveAttribute(
      "data-slot",
      "panel",
    );
    expect(screen.getByRole("toolbar", { name: "Actions" })).toHaveAttribute(
      "data-slot",
      "toolbar",
    );
  });
});
