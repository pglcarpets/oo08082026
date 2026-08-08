/**
 * Name-mirror: features/shared/auth/lib/session
 */

import { describe, expect, it, vi } from "vitest";
import type {
  AuthUser,
  SessionState,
  SharedSession,
} from "@/features/shared/auth/lib/session";

const { mockUseSession } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
}));

vi.mock("@/features/shared/auth/lib/AuthProvider", () => ({
  AuthProvider: ({ children }: { children?: React.ReactNode }) => children ?? null,
  useSession: mockUseSession,
}));

describe("session re-exports", () => {
  it("exports AuthProvider and useSession for component imports", async () => {
    const mod = await import("@/features/shared/auth/lib/session");
    expect(typeof mod.AuthProvider).toBe("function");
    expect(mod.useSession).toBe(mockUseSession);
  });

  it("exposes SharedSession / SessionState type contracts at use-sites", () => {
    const user: AuthUser = { id: "u1", email: "a@example.com" };
    const session: SharedSession = {
      user: {
        id: user.id,
        email: user.email,
        role: "viewer",
      },
      token: "tok",
      isGuest: false,
    };
    const state: SessionState = { status: "authenticated", user };
    expect(session.user?.role).toBe("viewer");
    expect(state.status).toBe("authenticated");
  });
});
