/**
 * Name-mirror: features/shared/crm/types
 */

import { describe, expect, it } from "vitest";
import type {
  SharedClient,
  SharedCrmQuote,
  SharedCrmQuoteItem,
  SharedProject,
} from "@/features/shared/crm/types";

describe("shared crm types", () => {
  it("accepts client, project, and quote shapes with status unions", () => {
    const client: SharedClient = {
      id: "c1",
      name: "Ops",
      company: "Nexus",
      email: "ops@nexus.test",
      phone: "555",
      address: "Patna",
      notes: "VIP",
      createdAt: "2026-03-01",
    };
    const project: SharedProject = {
      id: "p1",
      name: "Floor 3",
      clientId: "none",
      status: "on_hold",
      notes: "",
      planIds: [],
      createdAt: "2026-03-01",
      updatedAt: "2026-03-02",
    };
    const item: SharedCrmQuoteItem = {
      id: "qi1",
      name: "Chair",
      qty: 2,
      price: 5000,
      category: "seating",
      dimensions: "600x600",
    };
    const quote: SharedCrmQuote = {
      id: "q1",
      title: "Quote A",
      projectId: project.id,
      clientId: client.id,
      planId: "plan-x",
      items: [item],
      totalAmount: 10000,
      status: "sent",
      createdAt: "2026-03-01",
      updatedAt: "2026-03-03",
    };

    expect(project.clientId).toBe("none");
    expect(quote.status).toBe("sent");
    expect(quote.items[0].dimensions).toBe("600x600");
  });
});
