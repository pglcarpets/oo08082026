import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import ProjectsView from "@/features/crm/ProjectsView";
import ClientsView from "@/features/crm/ClientsView";
import QuotesView from "@/features/crm/QuotesView";

const mockUseCrmStore = vi.fn();

vi.mock("@/features/crm/stores/crmStore", () => ({
  useCrmStore: (selector?: (s: unknown) => unknown) => {
    const state = mockUseCrmStore();
    return typeof selector === "function" ? selector(state) : state;
  },
}));

vi.mock("@/features/crm/CrmWorkspaceBanner", () => ({
  CrmWorkspaceBanner: () => (
    <div data-testid="crm-workspace-banner">Browser-only CRM</div>
  ),
}));

vi.mock("@/features/shared/shell/GlobalNavHeader", () => ({
  GlobalNavHeader: () => <div data-testid="mock-global-nav-header">Header</div>,
}));

describe("Embedded CRM chrome", () => {
  beforeEach(() => {
    mockUseCrmStore.mockReturnValue({
      projects: [
        {
          id: "project-1",
          name: "Project Alpha",
          clientId: "client-1",
          status: "active",
          notes: "Demo project",
          planIds: [],
          createdAt: "2026-06-25T00:00:00Z",
          updatedAt: "2026-06-26T00:00:00Z",
        },
      ],
      clients: [
        {
          id: "client-1",
          name: "Client Acme",
          company: "Acme Corp",
          email: "client@example.com",
          phone: "",
          address: "",
          notes: "",
          createdAt: "2026-06-25T00:00:00Z",
        },
      ],
      quotes: [
        {
          id: "quote-1",
          title: "Quote Alpha",
          clientId: "client-1",
          projectId: "project-1",
          planId: "plan-1",
          items: [],
          totalAmount: 50000,
          status: "approved",
          createdAt: "2026-06-25T00:00:00Z",
          updatedAt: "2026-06-26T00:00:00Z",
        },
      ],
      addProject: vi.fn(),
      deleteProject: vi.fn(),
      addClient: vi.fn(),
      deleteClient: vi.fn(),
      addQuote: vi.fn(),
      updateQuote: vi.fn(),
      deleteQuote: vi.fn(),
      seedDemoData: vi.fn(),
      clearAll: vi.fn(),
      exportSnapshot: vi.fn(),
      importSnapshot: vi.fn(),
    });
  });

  it("renders the compact projects toolbar when embedded", () => {
    render(<ProjectsView embedded />);

    expect(screen.queryByTestId("mock-global-nav-header")).not.toBeInTheDocument();
    expect(screen.getByTestId("crm-workspace-banner")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /New Project/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 1, name: /Projects Tracker/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/in this browser/i)).toBeInTheDocument();
  });

  it("renders the compact clients toolbar when embedded", () => {
    render(<ClientsView embedded />);

    expect(screen.queryByTestId("mock-global-nav-header")).not.toBeInTheDocument();
    expect(screen.getByTestId("crm-workspace-banner")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /New Client/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 1, name: /Client Directory/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the compact quotes toolbar when embedded", () => {
    render(<QuotesView embedded />);

    expect(screen.queryByTestId("mock-global-nav-header")).not.toBeInTheDocument();
    expect(screen.getByTestId("crm-workspace-banner")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Quote/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 1, name: /Deals Pipeline/i }),
    ).not.toBeInTheDocument();
  });
});
