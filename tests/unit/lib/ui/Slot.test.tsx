/**
 * Name-mirror coverage for lib/ui/Slot.
 */
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Slot } from "@/lib/ui/Slot";

describe("Slot", () => {
  it("returns null when children is not a valid React element", () => {
    const { container } = render(<Slot>plain text</Slot>);
    expect(container.firstChild).toBeNull();
  });

  it("merges className onto the child element", () => {
    render(
      <Slot className="outer">
        <button type="button" className="inner">
          Go
        </button>
      </Slot>,
    );
    const button = screen.getByRole("button", { name: "Go" });
    expect(button.className).toContain("outer");
    expect(button.className).toContain("inner");
  });

  it("forwards props and refs to the child", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Slot data-testid="slot-child" aria-label="slotted">
        <button type="button" ref={ref}>
          Action
        </button>
      </Slot>,
    );

    const button = screen.getByRole("button", { name: "slotted" });
    expect(button).toHaveAttribute("data-testid", "slot-child");
    expect(button).toHaveAttribute("aria-label", "slotted");
    expect(button.textContent).toBe("Action");
    expect(ref.current).toBe(button);
  });

  it("exposes displayName Slot", () => {
    expect(Slot.displayName).toBe("Slot");
  });
});
