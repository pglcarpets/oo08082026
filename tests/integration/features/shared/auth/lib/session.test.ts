import { describe, expect, it, vi } from "vitest";

vi.mock("@/platform/supabase/client", () => ({
  createAuthClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  }),
}));

import { AuthProvider, useSession } from "@/features/shared/auth/lib/session";
import type {
  AuthUser,
  SessionState,
  SharedSession,
} from "@/features/shared/auth/lib/session";

describe("session re-exports", () => {
  it("re-exports auth provider utilities and types", () => {
    expect(AuthProvider).toBeTypeOf("function");
    expect(useSession).toBeTypeOf("function");

    const loading: SessionState = { status: "loading" };
    const authenticated: SessionState = {
      status: "authenticated",
      user: { id: "1", email: "ada@example.com" },
    };
    const user: AuthUser = { id: "1", email: "ada@example.com" };
    const shared: SharedSession = { user: null, token: null };

    expect(loading.status).toBe("loading");
    expect(authenticated.status).toBe("authenticated");
    expect(user.email).toBe("ada@example.com");
    expect(shared.token).toBeNull();
  });
});