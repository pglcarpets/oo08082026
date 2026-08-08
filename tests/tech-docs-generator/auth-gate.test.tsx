import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../tech-docs-generator/src/auth/LoginPage", () => ({
  LoginPage: () => <div>LoginPage</div>,
}));

vi.mock("../../tech-docs-generator/src/lib/authEnv", () => ({
  isAdminSupabaseConfigured: () => true,
}));

const sessionMock = vi.hoisted(() => ({
  state: { status: "loading" as const },
}));

vi.mock("../../tech-docs-generator/src/auth/AuthProvider", () => ({
  useSession: () => sessionMock.state,
  signOutDocsSession: vi.fn(),
}));

import { AuthGate } from "../../tech-docs-generator/src/auth/AuthGate";

describe("AuthGate", () => {
  it("shows loading while session resolves", () => {
    sessionMock.state = { status: "loading" };
    render(
      <AuthGate>
        <div>Docs content</div>
      </AuthGate>,
    );
    expect(screen.getByText("Checking your session…")).toBeTruthy();
  });

  it("shows login when unauthenticated", () => {
    sessionMock.state = { status: "unauthenticated" };
    render(
      <AuthGate>
        <div>Docs content</div>
      </AuthGate>,
    );
    expect(screen.getByText("LoginPage")).toBeTruthy();
  });

  it("blocks non-admin signed-in users", () => {
    sessionMock.state = {
      status: "authenticated",
      user: { id: "u1", email: "member@example.com", isAdmin: false },
    };
    render(
      <AuthGate>
        <div>Docs content</div>
      </AuthGate>,
    );
    expect(screen.getByText("Admin access required")).toBeTruthy();
  });

  it("renders docs for admin users", () => {
    sessionMock.state = {
      status: "authenticated",
      user: { id: "u1", email: "admin@example.com", isAdmin: true },
    };
    render(
      <AuthGate>
        <div>Docs content</div>
      </AuthGate>,
    );
    expect(screen.getByText("Docs content")).toBeTruthy();
  });
});
