import { describe, expect, it } from "vitest";
import {
  buildCrmSnapshot,
  computeCrmMetrics,
  formatInrCompact,
  parseCrmSnapshot,
} from "@/features/crm/crmMetrics";
import type {
  SharedClient,
  SharedCrmQuote,
  SharedProject,
} from "@/features/shared/crm/types";

const clients: SharedClient[] = [
  {
    id: "c1",
    name: "A",
    company: "Co",
    email: "a@x.com",
    phone: "",
    address: "",
    notes: "",
    createdAt: "2026-01-01",
  },
];

const projects: SharedProject[] = [
  {
    id: "p1",
    name: "P1",
    clientId: "c1",
    status: "active",
    notes: "",
    planIds: ["a", "b"],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-02",
  },
  {
    id: "p2",
    name: "P2",
    clientId: "none",
    status: "on_hold",
    notes: "",
    planIds: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-02",
  },
];

const quotes: SharedCrmQuote[] = [
  {
    id: "q1",
    title: "Q1",
    projectId: "p1",
    clientId: "c1",
    planId: "a",
    items: [],
    totalAmount: 100000,
    status: "sent",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-02",
  },
  {
    id: "q2",
    title: "Q2",
    projectId: "p1",
    clientId: "c1",
    planId: "a",
    items: [],
    totalAmount: 50000,
    status: "approved",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-02",
  },
];

describe("crmMetrics", () => {
  it("computes pipeline and approved value", () => {
    const m = computeCrmMetrics(clients, projects, quotes);
    expect(m.clientCount).toBe(1);
    expect(m.projectCount).toBe(2);
    expect(m.activeProjects).toBe(1);
    expect(m.onHoldProjects).toBe(1);
    expect(m.pipelineValue).toBe(100000);
    expect(m.approvedValue).toBe(50000);
    expect(m.plansLinked).toBe(2);
  });

  it("formats INR compact", () => {
    expect(formatInrCompact(0)).toBe("₹0");
    expect(formatInrCompact(12500)).toMatch(/12,500|₹/);
  });

  it("builds and parses snapshots", () => {
    const snap = buildCrmSnapshot(clients, projects, quotes);
    expect(snap.version).toBe(1);
    expect(parseCrmSnapshot(snap)?.clients).toHaveLength(1);
    expect(parseCrmSnapshot({ version: 2 })).toBeNull();
    expect(parseCrmSnapshot(null)).toBeNull();
  });
});
