"use client";

import { Button } from "@/components/ui/Button";
import { AdminAlert } from "@/features/admin/ui/AdminAlert";
import { useCrmStore } from "./stores/crmStore";
import { isCrmDemoModeEnabled } from "./stores/crmDemoSeed";

/**
 * Always-visible honesty banner for browser-local CRM storage,
 * plus one-click sample data when the workspace is empty.
 */
export function CrmWorkspaceBanner() {
  const clients = useCrmStore((s) => s.clients);
  const projects = useCrmStore((s) => s.projects);
  const quotes = useCrmStore((s) => s.quotes);
  const seedDemoData = useCrmStore((s) => s.seedDemoData);
  const clearAll = useCrmStore((s) => s.clearAll);
  const exportSnapshot = useCrmStore((s) => s.exportSnapshot);

  const empty = clients.length === 0 && projects.length === 0 && quotes.length === 0;
  const demoEnv = isCrmDemoModeEnabled();

  const handleExport = () => {
    const snapshot = exportSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `oando-crm-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {return;}
      try {
        const text = await file.text();
        const parsed: unknown = JSON.parse(text);
        const ok = useCrmStore.getState().importSnapshot(parsed);
        if (!ok) {
          window.alert("Import failed: file is not a valid CRM snapshot (version 1).");
        }
      } catch {
        window.alert("Import failed: could not read JSON file.");
      }
    };
    input.click();
  };

  return (
    <AdminAlert variant="warn" className="crm-workspace-banner" role="status">
      <p>
        <strong>Browser-only CRM demo.</strong> Clients, projects, and quotes persist in this
        browser&apos;s <code>localStorage</code> only. They do not sync across devices or to
        the server, and clearing site data removes them. Not a production CRM.
        {demoEnv ? " Demo mode env is on — seeds may load on first visit." : null}
      </p>
      <div className="crm-workspace-banner__actions">
        {empty ? (
          <Button type="button" variant="primary" size="xs" onClick={() => seedDemoData()}>
            Load sample data
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => {
              if (
                window.confirm(
                  "Replace all CRM records with sample clients, projects, and quotes?",
                )
              ) {
                seedDemoData();
              }
            }}
          >
            Reset to sample data
          </Button>
        )}
        <Button type="button" variant="outline" size="xs" onClick={handleExport} disabled={empty}>
          Export JSON
        </Button>
        <Button type="button" variant="outline" size="xs" onClick={handleImport}>
          Import JSON
        </Button>
        {!empty ? (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => {
              if (window.confirm("Delete all CRM records in this browser?")) {
                clearAll();
              }
            }}
          >
            Clear all
          </Button>
        ) : null}
      </div>
    </AdminAlert>
  );
}
