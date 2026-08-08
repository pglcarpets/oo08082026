import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CustomerQueryForm } from "@/components/contact/CustomerQueryForm";
import { trackContactSubmission } from "@/lib/analytics/siteEvents";
import { CONTACT_FORM_CONTEXT_COPY } from "@/features/site/data/routeCopy";

const executeAsync = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/contact",
}));

vi.mock("@/lib/analytics/siteEvents", () => ({
  trackContactSubmission: vi.fn(),
}));

vi.mock("next-safe-action/hooks", () => ({
  useAction: (
    _action: unknown,
    opts?: {
      onSuccess?: (args: { data: unknown; input: unknown }) => void;
      onError?: (args: { error: unknown; input: unknown }) => void;
    },
  ) => ({
    executeAsync: async (input: unknown) => {
      try {
        const result = (await executeAsync(input)) as
          | {
              data?: {
                queryId: string;
                followUp: { email: string | null; whatsapp: string | null };
              };
              serverError?: string;
              validationErrors?: Record<string, unknown>;
            }
          | undefined;
        if (result?.data) {
          await opts?.onSuccess?.({ data: result.data, input });
        } else if (result?.serverError || result?.validationErrors) {
          await opts?.onError?.({
            error: {
              serverError: result.serverError,
              validationErrors: result.validationErrors,
            },
            input,
          });
        }
        return result ?? {};
      } catch (thrownError) {
        await opts?.onError?.({
          error: { thrownError },
          input,
        });
        throw thrownError;
      }
    },
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

function fillRequiredFields(options?: { channel?: "email" | "phone" }) {
  fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "John Doe" } });
  fireEvent.change(screen.getByLabelText(/Message/i), {
    target: { value: "I need a workstation" },
  });
  if (options?.channel === "phone") {
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "+919835630940" },
    });
  } else {
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "john@example.com" },
    });
  }
  fireEvent.click(screen.getByTestId("contact-form-consent"));
}

describe("CustomerQueryForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeAsync.mockReset();
  });

  afterEach(() => {
    // clearAllMocks only — restoreAllMocks would wipe the module-level useAction mock.
    vi.clearAllMocks();
  });

  it("renders labeled fields with initial empty state", () => {
    render(<CustomerQueryForm />);

    expect(screen.getByLabelText(/^Name/i)).toHaveValue("");
    expect(screen.getByLabelText(/^Company$/i)).toHaveValue("");
    expect(screen.getByLabelText(/^Email$/i)).toHaveValue("");
    expect(screen.getByLabelText(/Phone/i)).toHaveValue("");
    expect(screen.getByLabelText(/Preferred Contact/i)).toHaveValue("any");
    expect(screen.getByLabelText(/^Message/i)).toHaveValue("");
    expect(screen.getByTestId("contact-form-consent")).not.toBeChecked();
    expect(screen.getByTestId("contact-form-submit")).toBeDisabled();
  });

  it("associates required labels with controls and privacy policy", () => {
    render(<CustomerQueryForm />);

    // FormItem generates its own control id (`_r_N_-form-item`) and wires the
    // label's htmlFor to it, so assert the *association* rather than a literal
    // id — that is what actually carries the accessibility guarantee.
    for (const label of [/Name/i, /Message/i, /Preferred Contact/i]) {
      const control = screen.getByLabelText(label);
      expect(control).toBeInTheDocument();
      expect(control.getAttribute("id")).toBeTruthy();
    }
    expect(screen.getByTestId("contact-form-consent")).toHaveAttribute(
      "id",
      "contact-consent",
    );
    expect(screen.getByRole("link", { name: /Privacy policy/i })).toHaveAttribute(
      "href",
      "/privacy/",
    );
    const honeypot = screen.getByTestId("contact-form-honeypot");
    expect(honeypot).toHaveAttribute("name", "website");
    expect(honeypot).toHaveAttribute("tabIndex", "-1");
    expect(honeypot).toHaveAttribute("autocomplete", "off");
  });

  it("validates required fields and consent before submitting", async () => {
    render(<CustomerQueryForm />);
    const submitBtn = screen.getByTestId("contact-form-submit");
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: "John Doe" },
    });
    await waitFor(() => {
      expect(submitBtn).toBeDisabled();
    });

    fireEvent.change(screen.getByLabelText(/Message/i), {
      target: { value: "Hello workspace" },
    });
    await waitFor(() => {
      expect(submitBtn).toBeDisabled();
    });

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "john@example.com" },
    });
    await waitFor(() => {
      expect(submitBtn).toBeDisabled();
    });

    fireEvent.click(screen.getByTestId("contact-form-consent"));
    await waitFor(() => {
      expect(submitBtn).toBeEnabled();
    });
  });

  it("enables submit with phone-only contact channel and consent", async () => {
    render(<CustomerQueryForm />);
    fillRequiredFields({ channel: "phone" });
    await waitFor(() => {
      expect(screen.getByTestId("contact-form-submit")).toBeEnabled();
    });
  });

  it("submits correctly on success and shows status region", async () => {
    executeAsync.mockResolvedValue({
      data: {
        queryId: "Q-12345",
        followUp: {
          email: "mailto:ops@oando.co.in",
          whatsapp: "https://wa.me/xyz",
        },
      },
    });

    render(<CustomerQueryForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByTestId("contact-form-submit"));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/Query submitted/i);
      expect(screen.getByText("Q-12345")).toBeInTheDocument();
    });

    expect(executeAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "John Doe",
        email: "john@example.com",
        message: "I need a workstation",
        source: "website-contact",
        sourcePath: "/contact",
        website: "",
        consent: true,
      }),
    );

    expect(trackContactSubmission).toHaveBeenCalledWith({
      pathname: "/contact",
      surface: "contact-page-form",
      source: "website-contact",
      status: "success",
    });

    expect(screen.getByRole("link", { name: "Reply by Email" })).toHaveAttribute(
      "href",
      "mailto:ops@oando.co.in",
    );
    expect(
      screen.getByRole("link", { name: "Reply on WhatsApp" }),
    ).toHaveAttribute("href", "https://wa.me/xyz");

    expect(screen.getByLabelText(/Name/i)).toHaveValue("");
    expect(screen.getByTestId("contact-form-consent")).not.toBeChecked();
  });

  it("seeds context message when intent is quote and source is compare", async () => {
    render(<CustomerQueryForm intent="quote" source="compare" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Message/i)).toHaveValue(
        CONTACT_FORM_CONTEXT_COPY.quote.compare.seededMessage,
      );
    });

    expect(
      screen.getByText(CONTACT_FORM_CONTEXT_COPY.quote.compare.title),
    ).toBeInTheDocument();
  });

  it("seeds quote-cart context and posts attributed source", async () => {
    executeAsync.mockResolvedValue({
      data: {
        queryId: "Q-CART-1",
        followUp: { email: null, whatsapp: null },
      },
    });

    render(<CustomerQueryForm intent="quote" source="quote-cart" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Message/i)).toHaveValue(
        CONTACT_FORM_CONTEXT_COPY.quote["quote-cart"].seededMessage,
      );
    });

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: "Cart Buyer" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "cart@example.com" },
    });
    fireEvent.click(screen.getByTestId("contact-form-consent"));
    fireEvent.click(screen.getByTestId("contact-form-submit"));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("Q-CART-1");
    });

    expect(executeAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "website-contact-quote-cart",
        sourcePath: "/contact?intent=quote&source=quote-cart",
        requirement: CONTACT_FORM_CONTEXT_COPY.quote["quote-cart"].requirement,
      }),
    );
  });

  it("handles server errors from the action", async () => {
    executeAsync.mockResolvedValue({
      serverError: "Form validation failed",
    });

    render(<CustomerQueryForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByTestId("contact-form-submit"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Form validation failed",
      );
    });

    expect(trackContactSubmission).toHaveBeenCalledWith({
      pathname: "/contact",
      surface: "contact-page-form",
      source: "website-contact",
      status: "error",
    });
  });

  it("surfaces nested-style server messages from action serverError", async () => {
    executeAsync.mockResolvedValue({
      serverError: "Name and message are required.",
    });

    render(<CustomerQueryForm />);
    fillRequiredFields();
    fireEvent.click(screen.getByTestId("contact-form-submit"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Name and message are required.",
      );
    });
  });

  it("falls back when action returns empty data without serverError", async () => {
    executeAsync.mockResolvedValue({});

    render(<CustomerQueryForm />);
    fillRequiredFields();
    fireEvent.click(screen.getByTestId("contact-form-submit"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Unable to submit right now.",
      );
    });
  });

  it("handles network errors", async () => {
    executeAsync.mockRejectedValue(new Error("Network error"));

    render(<CustomerQueryForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByTestId("contact-form-submit"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Network error. Please try again.",
      );
    });

    expect(trackContactSubmission).toHaveBeenCalledWith({
      pathname: "/contact",
      surface: "contact-page-form",
      source: "website-contact",
      status: "error",
    });
  });

  it("treats honest honeypot success envelope as success (no error alert)", async () => {
    executeAsync.mockResolvedValue({
      data: {
        queryId: "submitted",
        followUp: { email: null, whatsapp: null },
      },
    });

    render(<CustomerQueryForm />);
    fillRequiredFields();
    fireEvent.change(screen.getByTestId("contact-form-honeypot"), {
      target: { value: "http://spam.example" },
    });
    fireEvent.click(screen.getByTestId("contact-form-submit"));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/Query submitted/i);
      expect(screen.getByText("submitted")).toBeInTheDocument();
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    expect(executeAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        website: "http://spam.example",
      }),
    );
  });

  it("surfaces rate-limit message from action serverError", async () => {
    executeAsync.mockResolvedValue({
      serverError: "Too many submissions. Please try again after some time.",
    });

    render(<CustomerQueryForm />);
    fillRequiredFields();
    fireEvent.click(screen.getByTestId("contact-form-submit"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Too many submissions. Please try again after some time.",
      );
    });
  });

  it("accepts success data with followUp email link", async () => {
    executeAsync.mockResolvedValue({
      data: {
        queryId: "query-live-1",
        followUp: {
          email: "mailto:buyer@example.com?subject=Query%20query-live-1",
          whatsapp: null,
        },
      },
    });

    render(<CustomerQueryForm />);
    fillRequiredFields();
    fireEvent.click(screen.getByTestId("contact-form-submit"));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("query-live-1");
    });
    expect(screen.getByRole("link", { name: "Reply by Email" })).toHaveAttribute(
      "href",
      "mailto:buyer@example.com?subject=Query%20query-live-1",
    );
  });
});
