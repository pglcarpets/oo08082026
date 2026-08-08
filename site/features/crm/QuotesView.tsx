"use client";

import React, { useState, useMemo } from "react";
import type { Quote } from "./stores/crmStore";
import { useCrmStore } from "./stores/crmStore";
import { Button } from "@/components/ui/Button";
import {
  AdminField,
  AdminNumberInput,
  AdminSelect,
  AdminTextInput,
} from "@/features/admin/ui/AdminFormFields";
import { cn } from "@/lib/utils";
import { crmQuoteStatusColumns, crmUi } from "./crmUi";
import { CrmFormDialog, crmPageInner, crmPageShell } from "./crmAdminUi";
import { CrmWorkspaceBanner } from "./CrmWorkspaceBanner";
import {
  FileText,
  Plus,
  MagnifyingGlass as Search,
  Buildings as Building2,
  Users,
  Clock,
  Trash as Trash2,
  TrendUp as TrendingUp,
} from "@phosphor-icons/react";

export default function QuotesView({ embedded = false }: { embedded?: boolean }) {
  const { quotes, clients, projects, addQuote, updateQuote, deleteQuote } = useCrmStore();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("none");
  const [projectId, setProjectId] = useState("none");
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [status, setStatus] = useState<Quote["status"]>("draft");

  const clientMap = useMemo(() => {
    return new Map(clients.map((c) => [c.id, c]));
  }, [clients]);

  const projectMap = useMemo(() => {
    return new Map(projects.map((p) => [p.id, p]));
  }, [projects]);

  const filteredQuotes = useMemo(() => {
    const q = search.toLowerCase();
    return quotes.filter(
      (qt) =>
        qt.title.toLowerCase().includes(q) ||
        (clientMap.get(qt.clientId)?.name ?? "").toLowerCase().includes(q) ||
        (projectMap.get(qt.projectId)?.name ?? "").toLowerCase().includes(q),
    );
  }, [quotes, search, clientMap, projectMap]);

  const quotesByStatus = useMemo(() => {
    const groups: Record<Quote["status"], Quote[]> = {
      draft: [],
      sent: [],
      approved: [],
      rejected: [],
    };
    filteredQuotes.forEach((q) => {
      if (groups[q.status]) {
        groups[q.status].push(q);
      }
    });
    return groups;
  }, [filteredQuotes]);

  const totalValue = useMemo(() => {
    return quotes
      .filter((q) => q.status === "approved")
      .reduce((sum, q) => sum + q.totalAmount, 0);
  }, [quotes]);

  const pipelineValue = useMemo(() => {
    return quotes
      .filter((q) => q.status === "sent")
      .reduce((sum, q) => sum + q.totalAmount, 0);
  }, [quotes]);

  const stats = useMemo(
    () => [
      {
        label: "Closed Approved",
        value: `₹${totalValue.toLocaleString("en-IN")}`,
        tone: "text-success",
        icon: TrendingUp,
      },
      {
        label: "Active In-Flight",
        value: `₹${pipelineValue.toLocaleString("en-IN")}`,
        tone: "text-warning",
        icon: Clock,
      },
      {
        label: "Total Quotes",
        value: String(quotes.length),
        tone: "text-strong",
        icon: FileText,
      },
    ],
    [totalValue, pipelineValue, quotes.length],
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {return;}

    addQuote({
      title: title.trim(),
      clientId,
      projectId,
      planId: `plan-${Date.now()}`,
      items: [],
      totalAmount: Number(totalAmount),
      status,
    });

    setTitle("");
    setClientId("none");
    setProjectId("none");
    setTotalAmount(0);
    setStatus("draft");
    setIsModalOpen(false);
  };

  const handleStatusChange = (id: string, newStatus: Quote["status"]) => {
    updateQuote(id, { status: newStatus });
  };

  return (
    <section className={crmPageShell(embedded, "crm-quotes-view")}>
      <div className={crmPageInner(embedded)}>
        {embedded ? <CrmWorkspaceBanner /> : null}

        {embedded ? (
          <div className="crm-quotes-toolbar">
            <p className="crm-quotes-toolbar__hint text-xs text-muted">
              {quotes.length === 0
                ? "Start with sample data or create a quote."
                : `${quotes.length} quote${quotes.length === 1 ? "" : "s"} in this browser.`}
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-4 w-4" aria-hidden /> Create Quote
            </Button>
          </div>
        ) : (
          <header className="admin-page__header">
            <div>
              <p className="admin-page__eyebrow">CRM demo · browser only</p>
              <h1 className="admin-page__title">Deals Pipeline</h1>
              <p className="admin-page__copy">
                Quote values and approval status stored in this browser only — not a
                production CRM.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-4 w-4" aria-hidden /> Create Quote
            </Button>
          </header>
        )}

        <div
          className="crm-quotes-kpi-grid"
          role="group"
          aria-label="Quote statistics"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="admin-panel crm-quotes-kpi flex items-center justify-between gap-2 p-3 sm:p-5"
              >
                <div className="min-w-0">
                  <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted sm:tracking-[0.2em]">
                    {stat.label}
                  </p>
                  <p className={cn("mt-1.5 truncate text-xl font-bold sm:mt-2 sm:text-2xl", stat.tone)}>
                    {stat.value}
                  </p>
                </div>
                <Icon className="hidden h-8 w-8 shrink-0 opacity-30 sm:block" aria-hidden />
              </div>
            );
          })}
        </div>

        <div className="relative w-full max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <AdminTextInput
            type="search"
            placeholder="Search deals, clients, or projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Search quotes"
          />
        </div>

        {quotes.length === 0 ? (
          <div className="admin-empty admin-panel" role="status">
            <FileText className="h-12 w-12 text-subtle sm:h-14 sm:w-14" aria-hidden />
            <h2 className="admin-empty__title">No quotes yet</h2>
            <p className="admin-empty__copy">
              Create a quote card to track deal value through draft, sent, approved, and rejected
              stages — or load sample data above.
            </p>
            <div className="admin-empty__actions">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsModalOpen(true)}
              >
                Create Quote
              </Button>
            </div>
          </div>
        ) : (
          <div className="crm-quotes-board">
            {crmQuoteStatusColumns.map((col) => {
              const list = quotesByStatus[col.value as Quote["status"]] || [];
              const colTotal = list.reduce((s, q) => s + q.totalAmount, 0);

              return (
                <div
                  key={col.value}
                  className={cn(
                    "crm-quotes-column flex flex-col rounded-[1.25rem] border sm:rounded-[1.6rem]",
                    crmUi.softSurface,
                    crmUi.panelBorder,
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-t-[1.25rem] p-3 sm:rounded-t-[1.6rem] sm:p-4",
                      col.header,
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${col.dot}`} />
                      <span className="text-sm font-semibold text-strong">{col.label}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-mono text-[10px]",
                          col.badge,
                        )}
                      >
                        {list.length}
                      </span>
                    </div>
                    <span className={cn("shrink-0 text-xs font-semibold", col.valueTone)}>
                      ₹{colTotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex min-h-[12rem] flex-1 flex-col gap-3 overflow-y-auto p-3 sm:min-h-[24rem]">
                    {list.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center py-10 text-center text-xs italic text-muted">
                        No deals here
                      </div>
                    ) : (
                      list.map((quote) => {
                        const client = clientMap.get(quote.clientId);
                        const project = projectMap.get(quote.projectId);

                        return (
                          <article
                            key={quote.id}
                            className={cn(
                              "flex flex-col gap-3 rounded-xl border p-4 transition",
                              crmUi.strongSurface,
                              crmUi.softBorder,
                              crmUi.hoverBorder,
                            )}
                          >
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold leading-tight text-strong">
                                {quote.title}
                              </h4>
                              {client ? (
                                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted">
                                  <Users className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
                                  <span className="truncate">{client.name}</span>
                                </p>
                              ) : null}
                              {project ? (
                                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                                  <Building2 className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
                                  <span className="truncate">{project.name}</span>
                                </p>
                              ) : null}
                            </div>

                            <div className="mt-1 flex items-center justify-between gap-2">
                              <span className="text-sm font-bold text-strong">
                                ₹{quote.totalAmount.toLocaleString("en-IN")}
                              </span>
                              <span className="font-mono text-[10px] text-muted">
                                {new Date(quote.updatedAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div
                              className={cn(
                                "mt-1 flex items-center justify-between gap-2 border-t pt-2",
                                crmUi.softBorder,
                              )}
                            >
                              <AdminSelect
                                value={quote.status}
                                onChange={(e) =>
                                  handleStatusChange(
                                    quote.id,
                                    e.target.value as Quote["status"],
                                  )
                                }
                                className="h-8 max-w-[70%] border-0 bg-transparent px-0 text-[10px] font-semibold capitalize text-muted shadow-none focus-visible:ring-0"
                                aria-label={`Move quote ${quote.title}`}
                              >
                                <option value="draft">Move to Draft</option>
                                <option value="sent">Move to Sent</option>
                                <option value="approved">Move to Approved</option>
                                <option value="rejected">Move to Rejected</option>
                              </AdminSelect>

                              <button
                                type="button"
                                onClick={() => deleteQuote(quote.id)}
                                className={cn(
                                  "inline-flex min-h-11 min-w-11 items-center justify-center rounded p-1",
                                  crmUi.ghostDanger,
                                )}
                                title="Delete quote"
                                aria-label={`Delete quote ${quote.title}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              </button>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CrmFormDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Create Quote Card"
        description="Configure quote title and deal value."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <AdminField label="Quote Title *">
            <AdminTextInput
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Nexus Tech Furnishing Phase 1"
            />
          </AdminField>

          <AdminField label="Client Account">
            <AdminSelect
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              aria-label="Client Account"
            >
              <option value="none">Select Client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ""}
                </option>
              ))}
            </AdminSelect>
          </AdminField>

          <AdminField label="Project Association">
            <AdminSelect
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              aria-label="Project Association"
            >
              <option value="none">Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>

          <AdminField label="Quote Amount (INR)">
            <AdminNumberInput
              value={totalAmount || ""}
              onChange={(e) => setTotalAmount(Number(e.target.value))}
              placeholder="Enter deal value"
            />
          </AdminField>

          <AdminField label="Pipeline Stage">
            <AdminSelect
              value={status}
              onChange={(e) => setStatus(e.target.value as Quote["status"])}
              aria-label="Pipeline Stage"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </AdminSelect>
          </AdminField>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="w-full sm:w-auto"
              disabled={!title.trim()}
            >
              Save Quote
            </Button>
          </div>
        </form>
      </CrmFormDialog>
    </section>
  );
}
