/**
 * Name-mirror: features/shared/auth/types
 */

import { describe, expect, it } from "vitest";
import type {
  AuthUser,
  PlannerAuthUser,
  PlannerRole,
  SessionState,
  SharedSession,
  SharedSessionUser,
} from "@/features/shared/auth/types";

describe("shared auth types", () => {
  it("supports planner roles and session shapes without Supabase leakage", () => {
    const roles: PlannerRole[] = ["owner", "editor", "viewer", "guest"];
    expect(roles).toHaveLength(4);

    const user: SharedSessionUser = {
      id: "u1",
      email: "user@example.com",
      name: "Ada",
      role: "owner",
    };
    const session: SharedSession = {
      user,
      token: "jwt",
      expiresAt: 1_700_000_000_000,
      isGuest: false,
    };
    const plannerUser: PlannerAuthUser = {
      id: "u1",
      email: "user@example.com",
      role: "owner",
    };
    const authUser: AuthUser = { id: "u1", email: "user@example.com" };
    const states: SessionState[] = [
      { status: "loading" },
      { status: "unauthenticated" },
      { status: "authenticated", user: authUser },
    ];

    expect(session.user?.name).toBe("Ada");
    expect(plannerUser.email).toBe("user@example.com");
    expect(states[2].status).toBe("authenticated");
  });
});
