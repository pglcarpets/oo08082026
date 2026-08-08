import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signOut, replace, refresh } = vi.hoisted(() => ({
  signOut: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/platform/supabase/client", () => ({
  createAuthClient: () => ({
    auth: { signOut },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
  usePathname: () => "/dashboard",
}));

import { DashboardClient } from "@/features/shared/dashboard/DashboardClient";

describe("DashboardClient", () => {
  beforeEach(() => {
    signOut.mockReset();
    replace.mockReset();
    refresh.mockReset();
    signOut.mockResolvedValue({ error: null });
    window.localStorage.clear();
  });

  it("renders the signed-in dashboard with planner summary when drafts exist", async () => {
    window.localStorage.setItem(
      "planner_project_index",
      JSON.stringify([{ id: "draft-1" }, { id: "draft-2" }]),
    );

    render(<DashboardClient userEmail="ada@example.com" />);

    expect(screen.getByText(/Signed in as ada@example.com/)).toBeInTheDocument();
    expect(
      await screen.findByText(/2 saved local planner sessions ready to resume/),
    ).toBeInTheDocument();
    expect(screen.getByText("Recent work available")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Open canvas$/i })).toHaveAttribute(
      "href",
      "/ooplanner",
    );
  });

  it("uses singular copy for a single saved draft", async () => {
    window.localStorage.setItem(
      "planner_project_index",
      JSON.stringify([{ id: "draft-1" }]),
    );

    render(<DashboardClient userEmail="ada@example.com" />);

    expect(
      await screen.findByText(/1 saved local planner session ready to resume/),
    ).toBeInTheDocument();
  });

  it("shows the empty-state planner summary when no drafts are stored", async () => {
    render(<DashboardClient userEmail="ada@example.com" />);

    expect(
      await screen.findByText(/No saved local planner sessions yet/),
    ).toBeInTheDocument();
    expect(screen.getByText("Ready for first draft")).toBeInTheDocument();
  });

  it("handles invalid local storage gracefully", async () => {
    window.localStorage.setItem("planner_project_index", "not-json");

    render(<DashboardClient userEmail="ada@example.com" />);

    expect(
      await screen.findByText(/No saved local planner sessions yet/),
    ).toBeInTheDocument();
  });

  it("handles non-array planner index payloads", async () => {
    window.localStorage.setItem("planner_project_index", JSON.stringify({}));

    render(<DashboardClient userEmail="ada@example.com" />);

    expect(
      await screen.findByText(/No saved local planner sessions yet/),
    ).toBeInTheDocument();
  });

  it("signs out, clears the guest cookie, and returns to access", async () => {
    render(<DashboardClient userEmail="ada@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(replace).toHaveBeenCalledWith("/access");
      expect(refresh).toHaveBeenCalled();
    });
  });
});