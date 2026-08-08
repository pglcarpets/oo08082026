import type { ReactNode } from "react";
import { CircleNotch as Loader2 } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

export type AdminLoadingPanelProps = {
  title?: string;
  copy?: string;
  className?: string;
  children?: ReactNode;
  /** Compact inline status (toolbar-adjacent) vs full empty-panel. */
  compact?: boolean;
  "data-testid"?: string;
};

/**
 * Shared loading chrome for admin list/ops pages — panel hierarchy, not a lone spinner line.
 */
export function AdminLoadingPanel({
  title = "Loading…",
  copy,
  className,
  children,
  compact = false,
  "data-testid": testId,
}: AdminLoadingPanelProps) {
  if (compact) {
    return (
      <div
        className={cn("admin-status-line", className)}
        role="status"
        aria-live="polite"
        aria-busy="true"
        data-testid={testId}
      >
        <Loader2 size={16} className="admin-icon-spin" aria-hidden />
        <span>{title}</span>
      </div>
    );
  }

  return (
    <div
      className={cn("admin-empty admin-panel admin-empty--loading", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid={testId}
    >
      <p className="admin-empty__title">
        <Loader2 size={18} className="admin-icon-spin" aria-hidden /> {title}
      </p>
      {copy ? <p className="admin-empty__copy">{copy}</p> : null}
      {children}
    </div>
  );
}
