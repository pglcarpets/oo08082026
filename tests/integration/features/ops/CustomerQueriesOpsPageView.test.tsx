import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import CustomerQueriesOpsPage from "@/features/ops/CustomerQueriesOpsPageView";

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
  status: "new",
  followup_channel: "email",
  followup_target: "anita@example.com",
  followup_notes: "Initial intake",
} as const;

function okJson(payload: unknown) {
  return Promise.resolve({
    ok: true,
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

  it("loads queries from the saved admin token", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");

    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation((input) => {
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) {
        return okJson({ items: [sampleQuery] });
      }
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });

    render(<CustomerQueriesOpsPage />);

    expect(await screen.findByText(sampleQuery.message)).toBeInTheDocument();
    expect(screen.getByDisplayValue(sampleQuery.email)).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/customer-queries/manage?"),
      expect.objectContaining({
        headers: { "x-admin-token": "secret-token" },
        cache: "no-store",
        credentials: "include",
      }),
    );
  });

  it("saves updated drafts through the manage endpoint", async () => {
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

    render(<CustomerQueriesOpsPage />);

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
    fireEvent.click(
      scoped.getByRole("button", { name: "Save" }),
    );

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

    const [, patchCall] = fetchSpy.mock.calls.find(([, init]) => init?.method === "PATCH") || [];
    expect(patchCall).toBeDefined();
    expect(JSON.parse((patchCall as RequestInit).body as string)).toEqual(
      expect.objectContaining({
        id: sampleQuery.id,
        status: "closed",
        followUpChannel: "phone",
        followUpTarget: "8888888888",
        followUpNotes: "Called and qualified.",
      }),
    );
  });

  it("shows a network error when the inbox fetch fails without a token", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("offline"));

    render(<CustomerQueriesOpsPage />);

    expect(await screen.findByText("Unable to load queries.")).toBeInTheDocument();
    expect(screen.getByText("Not synced yet")).toBeInTheDocument();
  });

  it("applies the admin token without persisting it", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation((input) => {
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) {
        return okJson({ items: [] });
      }
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });

    render(<CustomerQueriesOpsPage />);

    fireEvent.change(
      screen.getByPlaceholderText(/Paste CUSTOMER_QUERIES_ADMIN_TOKEN/i),
      { target: { value: "fresh-token" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Apply token" }));

    await waitFor(() =>
      expect(window.localStorage.getItem("customer_queries_admin_token")).toBeNull(),
    );
    expect(await screen.findByText("No queries yet")).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText(/Paste CUSTOMER_QUERIES_ADMIN_TOKEN/i),
      { target: { value: "" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Apply token" }));

    await waitFor(() =>
      expect(window.localStorage.getItem("customer_queries_admin_token")).toBeNull(),
    );
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("filters by status and surfaces fetch failures", async () => {
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
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: "Invalid token" }),
        } as Response);
      }
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });

    render(<CustomerQueriesOpsPage />);

    expect(await screen.findByText("Invalid token")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "spam" } });
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("status=spam"),
        expect.any(Object),
      ),
    );
    expect(await screen.findByText("No queries match this filter")).toBeInTheDocument();
  });

  it("shows save failures and renders rows without company or email", async () => {
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

    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation((input, init) => {
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) {
        return okJson({ items: [sparseQuery] });
      }
      if (input === "/api/customer-queries/manage" && init?.method === "PATCH") {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: "Save rejected" }),
        } as Response);
      }
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });

    render(<CustomerQueriesOpsPage />);

    const article = (await screen.findByText(sparseQuery.message)).closest("article");
    expect(article).not.toBeNull();
    expect(screen.getByText(/No email/)).toBeInTheDocument();
    expect(screen.getByText("not-a-date")).toBeInTheDocument();

    const scoped = within(article as HTMLElement);
    fireEvent.click(scoped.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Save rejected")).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("refreshes the inbox manually while a token is present", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");

    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation((input) => {
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) {
        return okJson({ items: [sampleQuery] });
      }
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });

    render(<CustomerQueriesOpsPage />);
    await screen.findByText(sampleQuery.message);

    const initialCalls = fetchSpy.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => expect(fetchSpy.mock.calls.length).toBeGreaterThan(initialCalls));
  });
});
