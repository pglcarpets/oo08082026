import type {
  SharedClient as Client,
  SharedProject as Project,
  SharedCrmQuote as Quote,
} from "../../shared/crm/types";

/** Demo-only seed data — never persisted unless NEXT_PUBLIC_CRM_DEMO_MODE=1. */
export const CRM_DEMO_CLIENTS: Client[] = [
  {
    id: "client-1",
    name: "Amit Sharma",
    company: "Nexus Tech Solutions",
    email: "amit.sharma@nexustech.co.in",
    phone: "+91 98765 43210",
    address: "Sector 62, Noida, UP",
    notes: "Prefers modern, open-layout workstations. High budget for ergonomic seating.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "client-2",
    name: "Priya Patel",
    company: "Indus Capital Partners",
    email: "p.patel@induscap.com",
    phone: "+91 98112 23344",
    address: "Bandra Kurla Complex, Mumbai",
    notes: "Requires executive desks and acoustic panel partitions for conference rooms.",
    createdAt: new Date().toISOString(),
  },
];

export const CRM_DEMO_PROJECTS: Project[] = [
  {
    id: "project-1",
    name: "Nexus HQ Floor 4 Layout",
    clientId: "client-1",
    status: "active",
    notes: "Initial space planning for 45 task-desk seats and 2 meeting zones.",
    planIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "project-2",
    name: "Indus Executive Suite",
    clientId: "client-2",
    status: "active",
    notes: "High-end executive office with modular soft seating and glass partitions.",
    planIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const CRM_DEMO_QUOTES: Quote[] = [
  {
    id: "quote-1",
    title: "Nexus Phase 1 Workspace Quote",
    projectId: "project-1",
    clientId: "client-1",
    planId: "nexus-plan-1",
    items: [
      { id: "item-1", name: "Linear Desk 1400", qty: 24, price: 12500, category: "Workstations" },
      { id: "item-2", name: "Task Chair", qty: 24, price: 8500, category: "Seating" },
      { id: "item-3", name: "Meeting Table (6-Seat)", qty: 2, price: 28000, category: "Tables" },
      { id: "item-4", name: "Locker Bank (4-wide)", qty: 4, price: 18500, category: "Storage" },
    ],
    totalAmount: 634000,
    status: "sent",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function isCrmDemoModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CRM_DEMO_MODE === "1";
}

export function getDemoUserId(): string | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  return window.localStorage.getItem("crm-demo-user");
}

export function setDemoUserId(id: string): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  window.localStorage.setItem("crm-demo-user", id);
}
