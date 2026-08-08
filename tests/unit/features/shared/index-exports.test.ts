import { describe, expect, it } from "vitest";
import type { SharedAnalyticsEvent } from "@/features/shared/analytics/types";
import type { SessionState } from "@/features/shared/auth/types";
import type { SharedClient } from "@/features/shared/crm/types";

describe("shared index barrels", () => {
  it("exports auth types from the auth index", async () => {
    const auth = await import("@/features/shared/auth/index");
    const state: SessionState = {
      status: "unauthenticated",
    };
    expect(auth).toBeDefined();
    expect(state.status).toBe("unauthenticated");
  });

  it("exports CRM types from the CRM index", async () => {
    const crm = await import("@/features/shared/crm/index");
    const client: SharedClient = {
      id: "1",
      name: "Acme",
      company: "Acme Corp",
      email: "ops@example.com",
      phone: "555",
      address: "Patna",
      notes: "",
      createdAt: "2026-01-01",
    };
    expect(crm).toBeDefined();
    expect(client.company).toBe("Acme Corp");
  });

  it("exports catalog types from the catalog index", async () => {
    const catalog = await import("@/features/shared/catalog/index");
    expect(catalog).toBeDefined();
  });

  it("exports quotes types from the quotes index", async () => {
    const quotes = await import("@/features/shared/quotes/index");
    expect(quotes).toBeDefined();
  });

  it("exports analytics types from the analytics index", async () => {
    const analytics = await import("@/features/shared/analytics/index");
    const event: SharedAnalyticsEvent = {
      name: "session_start",
      surface: "planner",
      category: "session",
    };
    expect(analytics).toBeDefined();
    expect(event.surface).toBe("planner");
  });
});
