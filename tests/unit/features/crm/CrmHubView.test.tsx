import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import CrmHubView from "@/features/crm/CrmHubView";

const mockState = {
  clients: [
    {
      id: "c1",
      name: "Client Acme",
      company: "Acme",
      email: "a@x.com",
      phone: "",
      address: "",
      notes: "",
      createdAt: "2026-01-01",
    },
  ],
  projects: [
    {
      id: "p1",
      name: "HQ Fit-out",
      clientId: "c1",
      status: "active" as const,
      notes: "Phase 1",
      planIds: ["plan-1"],
      createdAt: "2026-01-01",
      updatedAt: "2026-06-01",
    },
  ],
  quotes: [
    {
      id: "q1",
      title: "Phase 1 quote",
      clientId: "c1",
      projectId: "p1",
      planId: "plan-1",
      items: [],
      totalAmount: 250000,
      status: "sent" as const,
      createdAt: "2026-01-01",
      updatedAt: "2026-06-02",
    },
  ],
  seedDemoData: vi.fn(),
  clearAll: vi.fn(),
  exportSnapshot: vi.fn(() => ({ version: 1, exportedAt: "", clients: [], projects: [], quotes: [] })),
  importSnapshot: vi.fn(() => true),
};

vi.mock("@/features/crm/stores/crmStore", () => ({
  useCrmStore: (selector?: (s: typeof mockState) => unknown) =>
    typeof selector === "function" ? selector(mockState) : mockState,
}));

describe("CrmHubView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders pipeline KPIs, demo honesty, and recent activity", () => {
    render(<CrmHubView />);
    expect(screen.getByLabelText("CRM summary")).toBeInTheDocument();
    expect(screen.getByText(/Browser-only CRM demo/i)).toBeInTheDocument();
    expect(screen.getByText(/localStorage/i)).toBeInTheDocument();
    expect(screen.getByText(/Not a production CRM/i)).toBeInTheDocument();
    expect(screen.getByText("HQ Fit-out")).toBeInTheDocument();
    expect(screen.getByText("Phase 1 quote")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /New client/i })).toHaveAttribute(
      "href",
      "/admin/crm/clients",
    );
    expect(screen.getByRole("link", { name: /Customer queries/i })).toHaveAttribute(
      "href",
      "/admin/customer-queries",
    );
  });
});
