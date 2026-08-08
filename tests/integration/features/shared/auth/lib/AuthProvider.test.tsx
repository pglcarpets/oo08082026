import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => {
  let authCallback: ((event: string, session: unknown) => void) | null = null;

  return {
    getSession: vi.fn(),
    unsubscribe: vi.fn(),
    onAuthStateChange: vi.fn((callback: (event: string, session: unknown) => void) => {
      authCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      };
    }),
    emitAuthState(session: unknown) {
      authCallback?.("SIGNED_IN", session);
    },
    clearAuthCallback() {
      authCallback = null;
    },
  };
});

vi.mock("@/platform/supabase/client", () => ({
  createAuthClient: () => ({
    auth: {
      getSession: authMocks.getSession,
      onAuthStateChange: authMocks.onAuthStateChange,
    },
  }),
}));

import {
  AuthProvider,
  useSession,
} from "@/features/shared/auth/lib/AuthProvider";

function SessionProbe() {
  const session = useSession();
  return <div data-testid="session-status">{session.status}</div>;
}

describe("AuthProvider", () => {
  beforeEach(() => {
    authMocks.clearAuthCallback();
    authMocks.getSession.mockReset();
    authMocks.onAuthStateChange.mockClear();
    authMocks.getSession.mockResolvedValue({ data: { session: null } });
  });

  it("resolves to unauthenticated when no session is cached", async () => {
    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    expect(screen.getByTestId("session-status")).toHaveTextContent("loading");

    await waitFor(() => {
      expect(screen.getByTestId("session-status")).toHaveTextContent(
        "unauthenticated",
      );
    });
  });

  it("hydrates authenticated state from getSession", async () => {
    authMocks.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: "user-1", email: "ada@example.com" },
        },
      },
    });

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("session-status")).toHaveTextContent(
        "authenticated",
      );
    });
  });

  it("falls back to unauthenticated when getSession rejects", async () => {
    authMocks.getSession.mockRejectedValue(new Error("network down"));

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("session-status")).toHaveTextContent(
        "unauthenticated",
      );
    });
  });

  it("prefers onAuthStateChange over a later getSession resolution", async () => {
    let resolveSession: (value: unknown) => void = () => {};
    authMocks.getSession.mockReturnValue(
      new Promise((resolve) => {
        resolveSession = resolve;
      }),
    );

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    await act(async () => {
      authMocks.emitAuthState({
        user: { id: "live-user", email: "live@example.com" },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("session-status")).toHaveTextContent(
        "authenticated",
      );
    });

    await act(async () => {
      resolveSession({
        data: {
          session: {
            user: { id: "stale-user", email: "stale@example.com" },
          },
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("session-status")).toHaveTextContent(
        "authenticated",
      );
    });
  });

  it("moves to unauthenticated when auth state clears", async () => {
    authMocks.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: "user-1", email: "ada@example.com" },
        },
      },
    });

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("session-status")).toHaveTextContent(
        "authenticated",
      );
    });

    await act(async () => {
      authMocks.emitAuthState(null);
    });

    await waitFor(() => {
      expect(screen.getByTestId("session-status")).toHaveTextContent(
        "unauthenticated",
      );
    });
  });

  it("defaults missing user email to an empty string", async () => {
    authMocks.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: "user-1", email: undefined },
        },
      },
    });

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("session-status")).toHaveTextContent(
        "authenticated",
      );
    });
  });

  it("ignores late getSession results after unmount", async () => {
    let resolveSession: (value: unknown) => void = () => {};
    authMocks.getSession.mockReturnValue(
      new Promise((resolve) => {
        resolveSession = resolve;
      }),
    );

    const { unmount } = render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    unmount();

    await act(async () => {
      resolveSession({
        data: {
          session: {
            user: { id: "late-user", email: "late@example.com" },
          },
        },
      });
    });
    expect(authMocks.getSession).toHaveBeenCalled();
  });

  it("unsubscribes on unmount", async () => {
    const unsubscribe = vi.fn();
    authMocks.onAuthStateChange.mockImplementation(
      () => ({
        data: {
          subscription: { unsubscribe },
        },
      }),
    );

    const { unmount } = render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("session-status")).toHaveTextContent(
        "unauthenticated",
      );
    });

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
