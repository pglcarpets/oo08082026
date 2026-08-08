import type {
  SharedClient as Client,
  SharedCrmQuote as Quote,
  SharedProject as Project,
} from "@/features/shared/crm/types";

export type CrmMetrics = {
  clientCount: number;
  projectCount: number;
  activeProjects: number;
  onHoldProjects: number;
  completedProjects: number;
  quoteCount: number;
  draftQuotes: number;
  sentQuotes: number;
  approvedQuotes: number;
  rejectedQuotes: number;
  pipelineValue: number;
  approvedValue: number;
  plansLinked: number;
};

export function computeCrmMetrics(
  clients: readonly Client[],
  projects: readonly Project[],
  quotes: readonly Quote[],
): CrmMetrics {
  const pipelineValue = quotes
    .filter((q) => q.status === "sent" || q.status === "draft")
    .reduce((sum, q) => sum + (q.totalAmount || 0), 0);
  const approvedValue = quotes
    .filter((q) => q.status === "approved")
    .reduce((sum, q) => sum + (q.totalAmount || 0), 0);

  return {
    clientCount: clients.length,
    projectCount: projects.length,
    activeProjects: projects.filter((p) => p.status === "active").length,
    onHoldProjects: projects.filter((p) => p.status === "on_hold").length,
    completedProjects: projects.filter((p) => p.status === "completed").length,
    quoteCount: quotes.length,
    draftQuotes: quotes.filter((q) => q.status === "draft").length,
    sentQuotes: quotes.filter((q) => q.status === "sent").length,
    approvedQuotes: quotes.filter((q) => q.status === "approved").length,
    rejectedQuotes: quotes.filter((q) => q.status === "rejected").length,
    pipelineValue,
    approvedValue,
    plansLinked: projects.reduce((sum, p) => sum + p.planIds.length, 0),
  };
}

export function formatInrCompact(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {return "₹0";}
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${Math.round(amount).toLocaleString("en-IN")}`;
  }
}

export type CrmSnapshot = {
  version: 1;
  exportedAt: string;
  clients: Client[];
  projects: Project[];
  quotes: Quote[];
};

export function buildCrmSnapshot(
  clients: Client[],
  projects: Project[],
  quotes: Quote[],
): CrmSnapshot {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    clients,
    projects,
    quotes,
  };
}

export function parseCrmSnapshot(raw: unknown): CrmSnapshot | null {
  if (!raw || typeof raw !== "object") {return null;}
  const obj = raw as Record<string, unknown>;
  if (obj.version !== 1) {return null;}
  if (!Array.isArray(obj.clients) || !Array.isArray(obj.projects) || !Array.isArray(obj.quotes)) {
    return null;
  }
  return {
    version: 1,
    exportedAt: typeof obj.exportedAt === "string" ? obj.exportedAt : new Date().toISOString(),
    clients: obj.clients as Client[],
    projects: obj.projects as Project[],
    quotes: obj.quotes as Quote[],
  };
}
