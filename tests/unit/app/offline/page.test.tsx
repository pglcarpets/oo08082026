import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import OfflinePage from "@/app/offline/page";

vi.mock("@/app/offline/ReloadButton", () => ({
  default: () => <button data-testid="mock-reload">Reload Button</button>,
}));

describe("OfflinePage", () => {
  it("renders offline error panels and the reload button", async () => {
    const ui = await OfflinePage({});
    const { getByText, getByTestId } = render(ui);
    expect(getByText("You are offline")).toBeDefined();
    expect(getByText(/We cannot reach the network right now/)).toBeDefined();
    expect(getByTestId("mock-reload")).toBeDefined();
  });
});
