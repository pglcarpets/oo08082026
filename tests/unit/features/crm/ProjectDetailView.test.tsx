import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import ProjectDetailView from "@/features/crm/ProjectDetailView";

const mockProjects = [
  {
    id: "proj1",
    clientId: "c1",
    name: "Project Alpha",
    notes: "Brief notes for Alpha",
    planIds: ["local1"],
    createdAt: "2026-06-25T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
];
const mockClients = [
  {
    id: "c1",
    name: "Client Acme",
    company: "Acme Corp",
    email: "acme@example.com",
    phone: "+12345678",
  },
];
const mockAssignPlan = vi.fn();
const mockRemovePlan = vi.fn();
const mockPush = vi.fn();
const mockBrowserApiFetch = vi.fn();

vi.mock("@/features/crm/stores/crmStore", () => ({
  useCrmStore: vi.fn(() => ({
    projects: mockProjects,
    clients: mockClients,
    assignPlanToProject: mockAssignPlan,
    removePlanFromProject: mockRemovePlan,
  })),
}));

vi.mock("@planner/lib/projectIndex", () => ({
  getSavedPlans: vi.fn(() => [
    {
      id: "local1",
      name: "Local Blueprint 1",
      furniture: [{}, {}],
      savedAt: "2026-06-26T00:00:00Z",
    },
  ]),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/features/shared/shell/GlobalNavHeader", () => ({
  GlobalNavHeader: () => <div data-testid="mock-global-nav-header">Header</div>,
}));

vi.mock("@/lib/api/browserApi", () => ({
  apiPath: (path: string) => (path.endsWith("/") ? path : `${path}/`),
  browserApiFetch: (...args: unknown[]) => mockBrowserApiFetch(...args),
}));

describe("ProjectDetailView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.spyOn(console, "error").mockImplementation(() => {});
    // happy-dom may omit window.alert
    window.alert = vi.fn() as typeof window.alert;

    mockBrowserApiFetch.mockImplementation(async (url: string, init?: RequestInit) => {
      const method = (init?.method ?? "GET").toUpperCase();
      if (method === "POST") {
        return {
          ok: true,
          json: async () => ({
            id: "p_new-cabinet-layout_abc123",
            name: "New Cabinet Layout",
          }),
        };
      }
      return {
        ok: true,
        json: async () => [
          {
            id: "online1",
            name: "Online Blueprint 1",
            objects_count: 5,
            updated_at: "2026-06-26T00:00:00Z",
          },
        ],
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders "Project not found" when project is missing', () => {
    render(<ProjectDetailView projectId="non-existent" />);

    expect(screen.getByText("Project not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Projects" })).toBeInTheDocument();
  });

  it("renders project detail header, metadata, client details, and associated plans", async () => {
    render(<ProjectDetailView projectId="proj1" />);

    await waitFor(() => {
      expect(mockBrowserApiFetch).toHaveBeenCalledWith("/api/Planner/projects/");
    });

    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    expect(screen.getByText("Brief notes for Alpha")).toBeInTheDocument();
    expect(screen.getByText("Client Acme")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("acme@example.com")).toBeInTheDocument();
    expect(screen.getByText("+12345678")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Local Blueprint 1")).toBeInTheDocument();
    });
    expect(screen.getByText("local")).toBeInTheDocument();
    expect(screen.getByText("2 items")).toBeInTheDocument();
  });

  it("unlinks assigned plans when unlink button is clicked", async () => {
    render(<ProjectDetailView projectId="proj1" />);

    await waitFor(() => {
      expect(screen.getByText("Local Blueprint 1")).toBeInTheDocument();
    });

    const unlinkBtn = screen.getByTitle("Unlink plan");
    fireEvent.click(unlinkBtn);

    expect(mockRemovePlan).toHaveBeenCalledWith("proj1", "local1");
  });

  it("handles linking an unassigned plan to the project", async () => {
    render(<ProjectDetailView projectId="proj1" />);

    await waitFor(() => {
      expect(screen.getByText("Local Blueprint 1")).toBeInTheDocument();
    });

    const linkBtn = screen.getByRole("button", { name: "Link Plan" });
    fireEvent.click(linkBtn);

    const onlineOption = screen.getByText("Online Blueprint 1");
    expect(onlineOption).toBeInTheDocument();
    expect(screen.getByText("online · 5 items")).toBeInTheDocument();

    fireEvent.click(onlineOption);

    expect(mockAssignPlan).toHaveBeenCalledWith("proj1", "online1");
  });

  it("creates a floor plan via Planner API and opens canvas", async () => {
    render(<ProjectDetailView projectId="proj1" />);

    await waitFor(() => {
      expect(screen.getByText("Local Blueprint 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Plan" }));
    fireEvent.change(screen.getByPlaceholderText("e.g. Executive Cabin Blueprint"), {
      target: { value: "New Cabinet Layout" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create & Launch" }));

    await waitFor(() => {
      expect(mockBrowserApiFetch).toHaveBeenCalledWith(
        "/api/Planner/projects/",
        expect.objectContaining({ method: "POST" }),
      );
    });

    await waitFor(() => {
      expect(mockAssignPlan).toHaveBeenCalledWith("proj1", "p_new-cabinet-layout_abc123");
      expect(mockPush).toHaveBeenCalledWith(
        "/planner/projects/p_new-cabinet-layout_abc123",
      );
    });
  });

  it("alerts when Planner create API fails", async () => {
    mockBrowserApiFetch.mockImplementation(async (url: string, init?: RequestInit) => {
      if ((init?.method ?? "GET").toUpperCase() === "POST") {
        return { ok: false, json: async () => ({ detail: "nope" }) };
      }
      return {
        ok: true,
        json: async () => [],
      };
    });

    render(<ProjectDetailView projectId="proj1" />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Create Plan" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Plan" }));
    fireEvent.change(screen.getByPlaceholderText("e.g. Executive Cabin Blueprint"), {
      target: { value: "Broken" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create & Launch" }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Could not create floor plan on the server.",
      );
    });
    expect(mockAssignPlan).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not render suite header in embedded or standalone view props", async () => {
    render(<ProjectDetailView projectId="proj1" embedded={false} />);
    expect(screen.queryByTestId("mock-global-nav-header")).not.toBeInTheDocument();

    render(<ProjectDetailView projectId="proj1" embedded />);
    expect(screen.queryByTestId("mock-global-nav-header")).not.toBeInTheDocument();
  });

  it("uses compact embedded chrome without standalone page header", async () => {
    render(<ProjectDetailView projectId="proj1" embedded />);

    expect(screen.queryByTestId("mock-global-nav-header")).not.toBeInTheDocument();
    expect(screen.queryByText("Project Detail")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 2, name: "Project Alpha" })).toBeInTheDocument();
    });
  });
});
