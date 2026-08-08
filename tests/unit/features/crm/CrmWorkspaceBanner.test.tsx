import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CrmWorkspaceBanner } from "@/features/crm/CrmWorkspaceBanner";

const seedDemoData = vi.fn();
const clearAll = vi.fn();
const exportSnapshot = vi.fn(() => ({
  version: 1 as const,
  exportedAt: "2026-01-01",
  clients: [],
  projects: [],
  quotes: [],
}));
const importSnapshot = vi.fn(() => true);

let clients: unknown[] = [];
let projects: unknown[] = [];
let quotes: unknown[] = [];

vi.mock("@/features/crm/stores/crmStore", () => ({
  useCrmStore: (selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      clients,
      projects,
      quotes,
      seedDemoData,
      clearAll,
      exportSnapshot,
      importSnapshot,
    };
    return typeof selector === "function" ? selector(state) : state;
  },
  // getState used by import handler
  getState: () => ({ importSnapshot }),
}));

// patch getState on the module mock after import via useCrmStore.getState
vi.mock("@/features/crm/stores/crmDemoSeed", () => ({
  isCrmDemoModeEnabled: () => false,
}));

describe("CrmWorkspaceBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clients = [];
    projects = [];
    quotes = [];
  });

  it("shows load sample data when empty", () => {
    render(<CrmWorkspaceBanner />);
    expect(screen.getByText(/Browser-only CRM demo/i)).toBeInTheDocument();
    expect(screen.getByText(/localStorage/i)).toBeInTheDocument();
    expect(screen.getByText(/Not a production CRM/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Load sample data/i }));
    expect(seedDemoData).toHaveBeenCalled();
  });

  it("AF-08 honesty: always labels browser-only storage and denies production CRM", () => {
    clients = [{ id: "c1" }];
    render(<CrmWorkspaceBanner />);
    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent(/Browser-only CRM demo/i);
    expect(banner).toHaveTextContent(/localStorage/i);
    expect(banner).toHaveTextContent(/do not sync/i);
    expect(banner).toHaveTextContent(/Not a production CRM/i);
    expect(banner).not.toHaveTextContent(/multi-tenant|production workspace/i);
  });

  it("shows export and clear when data exists", () => {
    clients = [{ id: "c1" }];
    render(<CrmWorkspaceBanner />);
    expect(screen.getByRole("button", { name: /Export JSON/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Clear all/i })).toBeInTheDocument();
  });
});
