/**
 * Name-mirror: features/shared/crm/index
 */

import { describe, expect, it } from "vitest";
import type {
  SharedClient,
  SharedCrmQuote,
  SharedProject,
} from "@/features/shared/crm/index";

describe("shared crm index", () => {
  it("re-exports CRM type contracts from the barrel", async () => {
    const mod = await import("@/features/shared/crm/index");
    expect(mod).toBeDefined();

    const client: SharedClient = {
      id: "c1",
      name: "Ada",
      company: "Acme",
      email: "ada@acme.test",
      phone: "+91",
      address: "Patna",
      notes: "",
      createdAt: "2026-01-01",
    };
    const project: SharedProject = {
      id: "p1",
      name: "HQ fit-out",
      clientId: client.id,
      status: "active",
      notes: "",
      planIds: ["plan-1"],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-02",
    };
    const quote: SharedCrmQuote = {
      id: "q1",
      title: "Phase 1",
      projectId: project.id,
      clientId: client.id,
      planId: "plan-1",
      items: [
        {
          id: "i1",
          name: "Desk",
          qty: 4,
          price: 1000,
          category: "workstations",
        },
      ],
      totalAmount: 4000,
      status: "draft",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    expect(client.company).toBe("Acme");
    expect(project.status).toBe("active");
    expect(quote.items).toHaveLength(1);
  });
});
