import { describe, expect, it, vi, beforeAll } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AI_ASSISTANT_WELCOME_MESSAGE } from "@/features/site/data/assistant";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/lib/consent", () => ({
  hasConsentChoice: () => true,
}));

import DynamicBotWrapper from "@/features/site/assistant/DynamicBotWrapper";

describe("DynamicBotWrapper", () => {
  beforeAll(async () => {
    await import("@/features/site/assistant/UnifiedAssistant");
  });

  it("renders the lazily loaded unified assistant", async () => {
    render(<DynamicBotWrapper />);
    expect(
      await screen.findByRole("button", { name: /open ai chatbot/i }),
    ).toBeInTheDocument();
  });

  it("loads assistant content when the chatbot is opened", async () => {
    render(<DynamicBotWrapper />);
    fireEvent.click(await screen.findByRole("button", { name: /open ai chatbot/i }));

    expect(screen.getByText(AI_ASSISTANT_WELCOME_MESSAGE)).toBeInTheDocument();
  });
});
