/**
 * Name-mirror: features/shared/auth/index
 */

import { describe, expect, it } from "vitest";
import type {
  PlannerAuthUser,
  SessionState,
  SharedSession,
} from "@/features/shared/auth/index";

describe("shared auth index", () => {
  it("re-exports auth type contracts from the barrel", async () => {
    const mod = await import("@/features/shared/auth/index");
    expect(mod).toBeDefined();

    const session: SharedSession = {
      user: null,
      token: null,
      isGuest: true,
    };
    const plannerUser: PlannerAuthUser = {
      id: "p1",
      email: "planner@example.com",
      role: "editor",
    };
    const state: SessionState = { status: "loading" };

    expect(session.isGuest).toBe(true);
    expect(plannerUser.role).toBe("editor");
    expect(state.status).toBe("loading");
  });
});
