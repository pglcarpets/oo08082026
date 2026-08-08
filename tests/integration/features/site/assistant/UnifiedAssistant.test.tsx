import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { UnifiedAssistant } from "@/features/site/assistant/UnifiedAssistant";
import {
  AI_ASSISTANT_STARTERS,
  AI_ASSISTANT_WELCOME_MESSAGE,
  AI_CHATBOT_COPY,
  GUIDED_PLANNER_COPY,
  MOBILE_ASSISTANT_COPY,
} from "@/features/site/data/assistant";
import { invalidateCsrfToken } from "@/lib/api/browserApi";

const mockPathname = vi.fn(() => "/");
const mockHasConsentChoice = vi.fn(() => true);

function isCsrfUrl(input: RequestInfo | URL): boolean {
  const url = String(input);
  return url.includes("/api/csrf");
}

function isAdvisorUrl(input: RequestInfo | URL): boolean {
  const url = String(input);
  return url.includes("/api/ai-advisor");
}

function mockAdvisorFetch(handler: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  return vi.spyOn(global, "fetch").mockImplementation((input, init) => {
    if (isCsrfUrl(input)) {
      return okJson({ token: "test-csrf-token" });
    }
    if (isAdvisorUrl(input)) {
      return handler(input, init);
    }
    throw new Error(`Unexpected fetch: ${String(input)}`);
  });
}

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

vi.mock("@/lib/consent", () => ({
  hasConsentChoice: () => mockHasConsentChoice(),
}));

const executeContactAction = vi.fn();

vi.mock("next-safe-action/hooks", () => ({
  useAction: () => ({
    executeAsync: (input: unknown) => executeContactAction(input),
    isExecuting: false,
    status: "idle",
    result: {},
    reset: vi.fn(),
    execute: vi.fn(),
    isIdle: true,
    isPending: false,
    isTransitioning: false,
    hasSucceeded: false,
    hasErrored: false,
    hasNavigated: false,
    input: undefined,
  }),
}));

function okJson(payload: unknown, init?: { ok?: boolean; contentType?: string }) {
  return Promise.resolve({
    ok: init?.ok ?? true,
    json: async () => payload,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type" ? init?.contentType ?? "application/json" : null,
    },
  } as Response);
}

function ndjsonStream(lines: string[]) {
  const encoder = new TextEncoder();
  let index = 0;
  const body = new ReadableStream({
    pull(controller) {
      if (index < lines.length) {
        controller.enqueue(encoder.encode(`${lines[index]}\n`));
        index += 1;
      } else {
        controller.close();
      }
    },
  });

  return Promise.resolve({
    ok: true,
    json: async () => ({}),
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type" ? "application/x-ndjson" : null,
    },
    body,
  } as Response);
}

const advisorResult = {
  recommendations: [
    {
      productId: "prod-1",
      productUrlKey: "ergo-chair",
      productName: "Ergo Chair",
      category: "seating",
      why: "Strong ergonomic support for long shifts.",
      budgetEstimate: "â‚¹12,000",
    },
  ],
  totalBudget: "â‚¹7,20,000",
  summary: "Curated seating mix for a 60-person operations floor.",
  nextActions: ["Confirm delivery timeline", "Book a layout review"],
  warnings: ["Lead time may extend during peak season"],
  pricingMode: "band" as const,
};

function desktopChatLauncher() {
  return screen.getByRole("button", { name: "Open AI chatbot" });
}

async function waitForAssistantMount() {
  await waitFor(() => expect(desktopChatLauncher()).toBeInTheDocument());
}

async function openGuidedPlanner() {
  await waitForAssistantMount();
  act(() => {
    window.dispatchEvent(new CustomEvent("oando-assistant:open", { detail: {} }));
  });
  await screen.findByRole("dialog", { name: "Guided planner" });
}

async function openAiChatbot() {
  await waitForAssistantMount();
  act(() => {
    window.dispatchEvent(new CustomEvent("oando-chatbot:open"));
  });
  await screen.findByRole("dialog", { name: "AI chatbot" });
}

function fillGuidedSteps(options?: { phone?: string }) {
  fireEvent.click(screen.getByRole("button", { name: "Workstations" }));
  fireEvent.change(screen.getByPlaceholderText(GUIDED_PLANNER_COPY.placeholders.seats), {
    target: { value: "60 workstations" },
  });
  fireEvent.click(screen.getByRole("button", { name: GUIDED_PLANNER_COPY.continue }));

  fireEvent.change(screen.getByPlaceholderText(GUIDED_PLANNER_COPY.placeholders.company), {
    target: { value: "Acme Corp" },
  });
  fireEvent.change(screen.getByPlaceholderText(GUIDED_PLANNER_COPY.placeholders.city), {
    target: { value: "Patna, Bihar" },
  });
  fireEvent.click(screen.getByRole("button", { name: "1-3 months" }));
  fireEvent.change(screen.getByPlaceholderText(GUIDED_PLANNER_COPY.placeholders.budget), {
    target: { value: "25 lakh" },
  });
  fireEvent.change(screen.getByPlaceholderText(GUIDED_PLANNER_COPY.placeholders.notes), {
    target: { value: "Need phased rollout." },
  });
  fireEvent.click(screen.getByRole("button", { name: GUIDED_PLANNER_COPY.continue }));

  fireEvent.change(screen.getByPlaceholderText(GUIDED_PLANNER_COPY.placeholders.name), {
    target: { value: "Anita Sharma" },
  });
  fireEvent.change(screen.getByPlaceholderText(GUIDED_PLANNER_COPY.placeholders.email), {
    target: { value: "anita@example.com" },
  });
  if (options?.phone) {
    fireEvent.change(screen.getByPlaceholderText(GUIDED_PLANNER_COPY.placeholders.phone), {
      target: { value: options.phone },
    });
  }
}

describe("UnifiedAssistant", () => {
  beforeEach(() => {
    invalidateCsrfToken();
    mockPathname.mockReturnValue("/");
    mockHasConsentChoice.mockReturnValue(true);
    executeContactAction.mockReset();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("min-width: 640px"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the AI chatbot from the desktop launcher and shows the welcome message", async () => {
    render(<UnifiedAssistant />);
    await waitForAssistantMount();
    await act(async () => {});

    fireEvent.click(screen.getByRole("button", { name: /open ai chatbot/i }));

    expect(screen.getByRole("dialog", { name: "AI chatbot" })).toBeInTheDocument();
    expect(screen.getByText(AI_ASSISTANT_WELCOME_MESSAGE)).toBeInTheDocument();
  });

  it("responds to global open events for guided planner, AI tab, and consent changes", async () => {
    mockHasConsentChoice.mockReturnValue(false);
    render(<UnifiedAssistant />);

    await openGuidedPlanner();
    fireEvent.click(screen.getByRole("button", { name: "Close guided planner" }));

    await waitForAssistantMount();
    act(() => {
      window.dispatchEvent(
        new CustomEvent("oando-assistant:open", { detail: { tab: "ai" } }),
      );
    });
    expect(await screen.findByRole("dialog", { name: "AI chatbot" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close AI chatbot" }));

    act(() => {
      window.dispatchEvent(new CustomEvent("oando-cookie-consent"));
    });
    expect(desktopChatLauncher()).toHaveClass("site-fab-launcher--assistant");
  });

  it("completes the guided planner intake and saves the lead", async () => {
    executeContactAction.mockResolvedValue({
      data: {
        queryId: "lead-123",
        followUp: { email: null, whatsapp: null },
      },
    });

    render(<UnifiedAssistant />);
    await openGuidedPlanner();

    fillGuidedSteps({ phone: "919999999999" });
    fireEvent.click(screen.getByRole("button", { name: GUIDED_PLANNER_COPY.finish }));

    expect(await screen.findByText(GUIDED_PLANNER_COPY.submittedTitle)).toBeInTheDocument();
    expect(screen.getByText(/Reference: lead-123/)).toBeInTheDocument();

    expect(executeContactAction).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Anita Sharma",
        email: "anita@example.com",
        phone: "919999999999",
        preferredContact: "phone",
        source: "homepage-chatbot",
        website: "",
        consent: true,
        sourcePath: "/",
      }),
    );

    const guidedDialog = screen.getByRole("dialog", { name: "Guided planner" });
    fireEvent.click(
      within(guidedDialog).getByRole("button", {
        name: GUIDED_PLANNER_COPY.submittedFollowUp,
      }),
    );
    expect(screen.getByRole("dialog", { name: "AI chatbot" })).toBeInTheDocument();

    await openGuidedPlanner();
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Guided planner" })).getByRole("button", {
        name: GUIDED_PLANNER_COPY.submittedReset,
      }),
    );
    expect(screen.getByText(GUIDED_PLANNER_COPY.stepOneIntro)).toBeInTheDocument();
  });

  it("shows guided planner save failures and supports stepping back", async () => {
    executeContactAction
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ serverError: "Server busy" });

    render(<UnifiedAssistant />);
    await openGuidedPlanner();
    fillGuidedSteps();

    fireEvent.click(screen.getByRole("button", { name: GUIDED_PLANNER_COPY.finish }));
    expect(await screen.findByText(GUIDED_PLANNER_COPY.errors.network)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: GUIDED_PLANNER_COPY.finish }));
    expect(await screen.findByText("Server busy")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: GUIDED_PLANNER_COPY.back }));
    expect(screen.getByText(GUIDED_PLANNER_COPY.stepTwoIntro)).toBeInTheDocument();
  });

  it("streams NDJSON advisor replies with recommendations, warnings, and refiners", async () => {
    mockAdvisorFetch(() =>
      ndjsonStream([
        JSON.stringify({ type: "delta", text: '{"summary":"Streaming ' }),
        JSON.stringify({ type: "delta", text: 'workspace plan"' }),
        JSON.stringify({ type: "result", result: advisorResult }),
      ]),
    );

    render(<UnifiedAssistant />);
    await openAiChatbot();

    const dialog = screen.getByRole("dialog", { name: "AI chatbot" });
    const conversation = within(dialog).getByRole("log", {
      name: "Assistant conversation",
    });
    fireEvent.change(within(dialog).getByPlaceholderText(AI_CHATBOT_COPY.placeholder), {
      target: { value: "Need seating for 60 users" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: AI_CHATBOT_COPY.send }));

    await waitFor(() =>
      expect(within(conversation).getAllByText(advisorResult.summary).length).toBeGreaterThan(
        0,
      ),
    );
    expect(within(dialog).getByText(AI_CHATBOT_COPY.bandLabel)).toBeInTheDocument();
    expect(within(dialog).getByText(advisorResult.warnings[0])).toBeInTheDocument();
    expect(within(dialog).getByText(advisorResult.nextActions[0])).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "View" })).toHaveAttribute(
      "href",
      expect.stringContaining("ergo-chair"),
    );

    fireEvent.click(within(dialog).getByRole("button", { name: "Lower budget" }));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/ai-advisor/",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("lower-budget alternatives"),
        }),
      ),
    );
  });

  it("handles JSON advisor responses, starters, surprise prompts, reset, and planner switch", async () => {
    mockAdvisorFetch(() =>
      okJson({
        ...advisorResult,
        pricingMode: "on-request",
      }),
    );

    render(<UnifiedAssistant />);
    await openAiChatbot();

    const dialog = screen.getByRole("dialog", { name: "AI chatbot" });
    const conversation = within(dialog).getByRole("log", {
      name: "Assistant conversation",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: AI_ASSISTANT_STARTERS[0] }));

    await waitFor(() =>
      expect(within(conversation).getAllByText(advisorResult.summary).length).toBeGreaterThan(
        0,
      ),
    );
    expect(within(dialog).getByText(AI_CHATBOT_COPY.totalLabel)).toBeInTheDocument();

    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    fireEvent.click(within(dialog).getByRole("button", { name: /try a sample/i }));
    randomSpy.mockRestore();
    // CSRF bootstrap once + starter + sample
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));

    fireEvent.click(within(dialog).getByRole("button", { name: AI_CHATBOT_COPY.switchToPlanner }));
    expect(screen.getByRole("dialog", { name: "Guided planner" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close guided planner" }));

    await openAiChatbot();
    const chatDialog = screen.getByRole("dialog", { name: "AI chatbot" });
    fireEvent.click(within(chatDialog).getByRole("button", { name: AI_CHATBOT_COPY.reset }));
    expect(within(chatDialog).getByText(AI_ASSISTANT_WELCOME_MESSAGE)).toBeInTheDocument();
  });

  it("surfaces advisor failures for stream errors, missing results, and JSON errors", async () => {
    const advisorResponses = [
      () => ndjsonStream([JSON.stringify({ type: "error", message: "Model unavailable" })]),
      () => ndjsonStream([]),
      () => okJson({ error: "Bad prompt" }, { ok: false }),
    ];
    let advisorCall = 0;
    mockAdvisorFetch(() => {
      const next = advisorResponses[advisorCall] ?? advisorResponses[advisorResponses.length - 1];
      advisorCall += 1;
      return next();
    });

    render(<UnifiedAssistant />);
    await openAiChatbot();

    const dialog = screen.getByRole("dialog", { name: "AI chatbot" });
    const textarea = within(dialog).getByPlaceholderText(AI_CHATBOT_COPY.placeholder);
    const submit = () => {
      fireEvent.change(textarea, { target: { value: "Test query" } });
      fireEvent.click(within(dialog).getByRole("button", { name: AI_CHATBOT_COPY.send }));
    };

    submit();
    expect(await within(dialog).findByText("Model unavailable")).toBeInTheDocument();

    submit();
    expect(
      await within(dialog).findByText(AI_CHATBOT_COPY.advisorUnavailable),
    ).toBeInTheDocument();

    submit();
    expect(await within(dialog).findByText("Bad prompt")).toBeInTheDocument();
  });

  it("shows a timeout message when the advisor request is aborted", async () => {
    vi.useFakeTimers();
    mockAdvisorFetch((_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      }),
    );

    render(<UnifiedAssistant />);
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.click(desktopChatLauncher()!);

    const dialog = screen.getByRole("dialog", { name: "AI chatbot" });
    fireEvent.change(within(dialog).getByPlaceholderText(AI_CHATBOT_COPY.placeholder), {
      target: { value: "Test query" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: AI_CHATBOT_COPY.send }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    expect(within(dialog).getAllByText(/timed out after 10 seconds/i).length).toBeGreaterThan(
      0,
    );
    vi.useRealTimers();
  });

  it("uses the mobile launcher and hides floating actions on product and compare routes", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("max-width: 639px"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { rerender } = render(<UnifiedAssistant />);

    fireEvent.click(screen.getByRole("button", { name: MOBILE_ASSISTANT_COPY.launcher }));
    fireEvent.click(screen.getByRole("button", { name: MOBILE_ASSISTANT_COPY.planner }));
    expect(screen.getByRole("dialog", { name: "Guided planner" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close guided planner" }));

    fireEvent.click(screen.getByRole("button", { name: MOBILE_ASSISTANT_COPY.launcher }));
    fireEvent.click(screen.getByRole("button", { name: MOBILE_ASSISTANT_COPY.chatbot }));
    expect(screen.getByRole("dialog", { name: "AI chatbot" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close AI chatbot" }));

    mockPathname.mockReturnValue("/products/chairs");
    rerender(<UnifiedAssistant />);
    expect(
      screen.queryByRole("button", { name: MOBILE_ASSISTANT_COPY.launcher }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /open ai chatbot/i })).not.toBeInTheDocument();

    mockPathname.mockReturnValue("/compare");
    rerender(<UnifiedAssistant />);
    expect(
      screen.queryByRole("button", { name: MOBILE_ASSISTANT_COPY.launcher }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /open ai chatbot/i })).not.toBeInTheDocument();
  });
});

