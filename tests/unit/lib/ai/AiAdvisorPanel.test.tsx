import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { AiAdvisorPanel } from "@/lib/ai/AiAdvisorPanel";
import { useAiAdvisor } from "@/lib/ai/useAiAdvisor";

vi.mock("@/lib/ai/useAiAdvisor", () => ({
  useAiAdvisor: vi.fn(),
}));

const mockedUseAiAdvisor = vi.mocked(useAiAdvisor);

describe("AiAdvisorPanel", () => {
  const mockSendMessage = vi.fn();
  const mockClearMessages = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAiAdvisor.mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
    });
  });

  it("should render trigger button initially when closed", () => {
    render(<AiAdvisorPanel />);
    const triggerBtn = screen.getByRole("button", {
      name: /Open AI Layout Advisor/i,
    });
    expect(triggerBtn).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("should open the panel dialog when trigger button is clicked", () => {
    render(<AiAdvisorPanel />);
    const triggerBtn = screen.getByRole("button", {
      name: /Open AI Layout Advisor/i,
    });
    fireEvent.click(triggerBtn);

    expect(
      screen.getByRole("dialog", { name: /AI Layout Advisor/i }),
    ).toBeDefined();
  });

  it("should display quick prompts when messages array is empty", () => {
    render(<AiAdvisorPanel />);
    fireEvent.click(
      screen.getByRole("button", { name: /Open AI Layout Advisor/i }),
    );

    expect(
      screen.getByText(/Suggest a layout for 8 people in 600 sq ft/i),
    ).toBeDefined();
    fireEvent.click(
      screen.getByText(/Suggest a layout for 8 people in 600 sq ft/i),
    );
    expect(mockSendMessage).toHaveBeenCalledWith(
      "Suggest a layout for 8 people in 600 sq ft",
    );
  });

  it("should display messages when messages array is populated", () => {
    mockedUseAiAdvisor.mockReturnValue({
      messages: [
        { id: "1", role: "user", content: "hello", timestamp: 1 },
        { id: "2", role: "assistant", content: "hi there", timestamp: 2 },
      ],
      isLoading: false,
      error: null,
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
    });

    render(<AiAdvisorPanel />);
    fireEvent.click(
      screen.getByRole("button", { name: /Open AI Layout Advisor/i }),
    );

    expect(screen.getByText("hello")).toBeDefined();
    expect(screen.getByText("hi there")).toBeDefined();
  });

  it("should display thinking state when loading", () => {
    mockedUseAiAdvisor.mockReturnValue({
      messages: [],
      isLoading: true,
      error: null,
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
    });

    render(<AiAdvisorPanel />);
    fireEvent.click(
      screen.getByRole("button", { name: /Open AI Layout Advisor/i }),
    );

    expect(screen.getByText("Thinking...")).toBeDefined();
  });

  it("should display error message when error is present", () => {
    mockedUseAiAdvisor.mockReturnValue({
      messages: [],
      isLoading: false,
      error: "Something went wrong",
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
    });

    render(<AiAdvisorPanel />);
    fireEvent.click(
      screen.getByRole("button", { name: /Open AI Layout Advisor/i }),
    );

    expect(screen.getByText("Something went wrong")).toBeDefined();
  });

  it("should call sendMessage on form submit", () => {
    render(<AiAdvisorPanel />);
    fireEvent.click(
      screen.getByRole("button", { name: /Open AI Layout Advisor/i }),
    );

    const input = screen.getByPlaceholderText(
      "Ask about layout, furniture, zones...",
    );
    fireEvent.change(input, { target: { value: "custom layout" } });

    const sendBtn = screen.getByRole("button", { name: /Send message/i });
    fireEvent.click(sendBtn);

    expect(mockSendMessage).toHaveBeenCalledWith("custom layout");
  });

  it("should close the panel when close button is clicked", () => {
    render(<AiAdvisorPanel />);
    fireEvent.click(
      screen.getByRole("button", { name: /Open AI Layout Advisor/i }),
    );

    const closeBtn = screen.getByRole("button", { name: /Close AI Advisor/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("should clear messages when trash button is clicked", () => {
    render(<AiAdvisorPanel />);
    fireEvent.click(
      screen.getByRole("button", { name: /Open AI Layout Advisor/i }),
    );

    const clearBtn = screen.getByRole("button", {
      name: /Clear conversation/i,
    });
    fireEvent.click(clearBtn);

    expect(mockClearMessages).toHaveBeenCalled();
  });
});
