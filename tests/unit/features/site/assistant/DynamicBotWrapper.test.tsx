import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import DynamicBotWrapper from "@/features/site/assistant/DynamicBotWrapper";

vi.mock("@/features/site/assistant/UnifiedAssistant", () => ({
  UnifiedAssistant: () => <div data-testid="unified-assistant" />,
}));

describe("DynamicBotWrapper", () => {
  it("renders UnifiedAssistant", async () => {
    render(<DynamicBotWrapper />);
    await waitFor(() => {
      expect(screen.getByTestId("unified-assistant")).toBeInTheDocument();
    });
  });
});
