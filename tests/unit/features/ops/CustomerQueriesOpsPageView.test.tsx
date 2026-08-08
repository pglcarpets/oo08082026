import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import CustomerQueriesOpsPageView from "@/features/ops/CustomerQueriesOpsPageView";

const sampleQuery = {
  id: "query-1",
  created_at: "2026-05-27T10:00:00.000Z",
  updated_at: "2026-05-27T10:00:00.000Z",
  source: "homepage-chatbot",
  source_path: "/",
  name: "Anita Sharma",
  company: "Acme Corp",
  email: "anita@example.com",
  phone: "9999999999",
  preferred_contact: "email",
  message: "Need 60 workstations for a Patna office.",
  requirement: "workstations",
  budget: "25 lakh",
  timeline: "1-3 months",
  status: "new" as const,
  followup_channel: "email" as const,
  followup_target: "anita@example.com",
  followup_notes: "Initial intake",
};

function okJson(payload: unknown): Promise<Response> {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => payload,
  } as Response);
}

function errorJson(status: number, payload: unknown): Promise<Response> {
  return Promise.resolve({
    ok: false,
    status,
    json: async () => payload,
  } as Response);
}

describe("CustomerQueriesOpsPageView", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders primary heading, subtitle, filter label, and actions when not embedded", async () => {
    vi.spyOn(global, "fetch").mockImplementation(() => okJson({ items: [] }));

    render(<CustomerQueriesOpsPageView />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Customer queries" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Live server inbox with 10-second auto-refresh/i)).toBeInTheDocument();
    expect(screen.getByText("Admin token")).toBeInTheDocument();
    expect(screen.getByText("Filter")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply token" })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Paste CUSTOMER_QUERIES_ADMIN_TOKEN/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(await screen.findByText("No queries yet")).toBeInTheDocument();
  });

  it("uses admin shell heading and hides token controls when embedded", async () => {
    vi.spyOn(global, "fetch").mockImplementation(() => okJson({ items: [] }));

    render(<CustomerQueriesOpsPageView embedded />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Customer queries" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Live server inbox from contact forms/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Server-backed inbox/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Admin token")).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/Paste CUSTOMER_QUERIES_ADMIN_TOKEN/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Apply token" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByText("Filter")).toBeInTheDocument();
    expect(await screen.findByText("No queries yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open public contact form/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open CRM hub/i })).toBeInTheDocument();
  });

  it("shows network error state when the inbox fetch rejects", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("offline"));

    render(<CustomerQueriesOpsPageView />);

    expect(await screen.findByText("Unable to load queries.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Could not load queries");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getByText("Not synced yet")).toBeInTheDocument();
    expect(screen.queryByText("No queries yet")).not.toBeInTheDocument();
  });

  it("shows API error message when the manage endpoint rejects the load", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "bad-token");
    vi.spyOn(global, "fetch").mockImplementation(() =>
      errorJson(401, { error: "Invalid token" }),
    );

    render(<CustomerQueriesOpsPageView />);

    expect(await screen.findByText("Invalid token")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Sign-in or token required");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getByText("Not synced yet")).toBeInTheDocument();
  });

  it("renders envelope error objects as human-readable alert text when embedded", async () => {
    vi.spyOn(global, "fetch").mockImplementation(() =>
      errorJson(401, {
        success: false,
        error: { code: "AUTH_REQUIRED", message: "Unauthorized" },
      }),
    );

    render(<CustomerQueriesOpsPageView embedded />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Unauthorized");
    expect(alert).toHaveTextContent("Sign-in or token required");
    expect(screen.getByRole("link", { name: /Open CRM hub/i })).toBeInTheDocument();
  });

  it("shows empty inbox after a successful load with no items", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");
    vi.spyOn(global, "fetch").mockImplementation(() => okJson({ items: [] }));

    render(<CustomerQueriesOpsPageView />);

    expect(await screen.findByText("No queries yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open public contact form/i })).toBeInTheDocument();
    expect(screen.getByText(/^Last sync:/)).toBeInTheDocument();
  });

  it("loads query rows and renders contact fields when a token is stored", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation((input) => {
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) {
        return okJson({ items: [sampleQuery] });
      }
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });

    render(<CustomerQueriesOpsPageView />);

    expect(await screen.findByRole("heading", { level: 2, name: sampleQuery.name })).toBeInTheDocument();
    expect(screen.getByText(sampleQuery.message)).toBeInTheDocument();
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    expect(screen.getByDisplayValue(sampleQuery.email)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Follow-up channel")).toBeInTheDocument();
    expect(screen.getByText("Follow-up target")).toBeInTheDocument();
    expect(screen.getByText("Follow-up notes")).toBeInTheDocument();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/customer-queries/manage?"),
      expect.objectContaining({
        headers: { "x-admin-token": "secret-token" },
        cache: "no-store",
        credentials: "include",
      }),
    );
  });

  it("applies an admin token in memory and reloads the inbox", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation((input) => {
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) {
        return okJson({ items: [] });
      }
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });

    render(<CustomerQueriesOpsPageView />);

    fireEvent.change(
      screen.getByPlaceholderText(/Paste CUSTOMER_QUERIES_ADMIN_TOKEN/i),
      { target: { value: "fresh-token" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Apply token" }));

    await waitFor(() =>
      expect(window.localStorage.getItem("customer_queries_admin_token")).toBeNull(),
    );
    expect(await screen.findByText("No queries yet")).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/customer-queries/manage?"),
      expect.objectContaining({
        headers: { "x-admin-token": "fresh-token" },
      }),
    );
  });

  it("clears the admin token from storage when Apply token is empty", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation((input, init) => {
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) {
        const headers = init?.headers as Record<string, string> | undefined;
        // After clear, reload may run without admin token header.
        if (!headers?.["x-admin-token"]) {
          return okJson({ items: [] });
        }
        return okJson({ items: [sampleQuery] });
      }
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });

    render(<CustomerQueriesOpsPageView />);
    expect(await screen.findByText(sampleQuery.message)).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText(/Paste CUSTOMER_QUERIES_ADMIN_TOKEN/i),
      { target: { value: "   " } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Apply token" }));

    await waitFor(() =>
      expect(window.localStorage.getItem("customer_queries_admin_token")).toBeNull(),
    );
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/api/customer-queries/manage?"),
        expect.objectContaining({
          headers: undefined,
        }),
      ),
    );
    expect(await screen.findByText("No queries yet")).toBeInTheDocument();
    expect(screen.queryByText(sampleQuery.message)).not.toBeInTheDocument();
  });

  it("saves draft status and follow-up fields through PATCH", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");

    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation((input, init) => {
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) {
        return okJson({ items: [sampleQuery] });
      }
      if (input === "/api/customer-queries/manage" && init?.method === "PATCH") {
        return okJson({
          item: {
            ...sampleQuery,
            status: "closed",
            followup_channel: "phone",
            followup_target: "8888888888",
            followup_notes: "Called and qualified.",
          },
        });
      }
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });

    render(<CustomerQueriesOpsPageView />);

    const article = (await screen.findByText(sampleQuery.message)).closest("article");
    expect(article).not.toBeNull();
    const scoped = within(article as HTMLElement);

    const [statusSelect, channelSelect] = scoped.getAllByRole("combobox");
    fireEvent.change(statusSelect, { target: { value: "closed" } });
    fireEvent.change(channelSelect, { target: { value: "phone" } });
    fireEvent.change(scoped.getByPlaceholderText("email / phone"), {
      target: { value: "8888888888" },
    });
    fireEvent.change(scoped.getByPlaceholderText("Call summary, next action, etc."), {
      target: { value: "Called and qualified." },
    });
    fireEvent.click(scoped.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/customer-queries/manage",
        expect.objectContaining({
          method: "PATCH",
          credentials: "include",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "x-admin-token": "secret-token",
          }),
        }),
      ),
    );

    const patchCall = fetchSpy.mock.calls.find(([, init]) => init?.method === "PATCH");
    expect(patchCall).toBeDefined();
    const patchInit = patchCall?.[1] as RequestInit | undefined;
    expect(patchInit?.body).toBeDefined();
    expect(JSON.parse(String(patchInit?.body))).toEqual(
      expect.objectContaining({
        id: sampleQuery.id,
        status: "closed",
        followUpChannel: "phone",
        followUpTarget: "8888888888",
        followUpNotes: "Called and qualified.",
      }),
    );
  });

  it("surfaces save failure errors from the manage endpoint", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");

    vi.spyOn(global, "fetch").mockImplementation((input, init) => {
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) {
        return okJson({ items: [sampleQuery] });
      }
      if (input === "/api/customer-queries/manage" && init?.method === "PATCH") {
        return errorJson(400, { error: "Save rejected" });
      }
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });

    render(<CustomerQueriesOpsPageView />);

    const article = (await screen.findByText(sampleQuery.message)).closest("article");
    expect(article).not.toBeNull();
    fireEvent.click(
      within(article as HTMLElement).getByRole("button", { name: "Save" }),
    );

    expect(await screen.findByText("Save rejected")).toBeInTheDocument();
  });

  it("filters by status and refetches with the status query param", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");

    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation((input) => {
      if (
        typeof input === "string" &&
        input.includes("/api/customer-queries/manage?") &&
        input.includes("status=spam")
      ) {
        return okJson({ items: [] });
      }
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) {
        return okJson({ items: [sampleQuery] });
      }
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });

    render(<CustomerQueriesOpsPageView />);
    expect(await screen.findByText(sampleQuery.message)).toBeInTheDocument();

    // Page filter is the first combobox; row status/channel selects follow when items load.
    const filterSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(filterSelect, { target: { value: "spam" } });

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("status=spam"),
        expect.objectContaining({
          headers: { "x-admin-token": "secret-token" },
        }),
      ),
    );
    expect(await screen.findByText("No queries match this filter")).toBeInTheDocument();
  });

  it("refetches the inbox when Refresh is clicked", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");

    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation((input) => {
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) {
        return okJson({ items: [sampleQuery] });
      }
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });

    render(<CustomerQueriesOpsPageView />);
    await screen.findByText(sampleQuery.message);

    const initialCalls = fetchSpy.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => expect(fetchSpy.mock.calls.length).toBeGreaterThan(initialCalls));
  });

  it("renders sparse contact placeholders when email and phone are missing", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");
    const sparseQuery = {
      ...sampleQuery,
      id: "query-2",
      company: null,
      email: null,
      phone: null,
      created_at: "not-a-date",
      message: "Phone-only walk-in enquiry.",
    };

    vi.spyOn(global, "fetch").mockImplementation((input) => {
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) {
        return okJson({ items: [sparseQuery] });
      }
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });

    render(<CustomerQueriesOpsPageView />);

    expect(await screen.findByText(sparseQuery.message)).toBeInTheDocument();
    expect(screen.getByText(/No email/)).toBeInTheDocument();
    expect(screen.getByText(/No phone/)).toBeInTheDocument();
    expect(screen.getByText("not-a-date")).toBeInTheDocument();
  });
});
