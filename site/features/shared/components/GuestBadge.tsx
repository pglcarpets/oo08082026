import * as React from "react";

export function GuestBadge() {
  return (
    <div className="inline-flex items-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
      Guest (Read-Only)
    </div>
  );
}
