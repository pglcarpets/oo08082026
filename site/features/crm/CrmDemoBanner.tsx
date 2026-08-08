"use client";

import { isCrmDemoModeEnabled } from "@/features/crm/stores/crmDemoSeed";

export function CrmDemoBanner() {
  if (!isCrmDemoModeEnabled()) {return null;}

  return (
    <div
      className="mb-6 rounded-xl border border-amber-300/60 bg-warning-soft px-4 py-3 text-sm text-amber-950"
      role="status"
    >
      <p className="font-semibold">Demo workspace</p>
      <p className="mt-1 text-amber-900/90">
        CRM records are seeded for demos and persist in this browser only. Do not rely on this data for
        production workflows. Use the workspace banner to load, export, import, or clear sample data.
      </p>
    </div>
  );
}
