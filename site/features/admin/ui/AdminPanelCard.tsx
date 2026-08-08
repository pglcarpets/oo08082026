import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AdminPanelCardProps = {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * FOCSS admin panel card — `.admin-panel` surface from
 * `focss/admin/base/primitives.css`. No shadcn Card registry.
 */
export function AdminPanelCard({ title, action, children, className }: AdminPanelCardProps) {
  const hasHeader = title !== undefined || action !== undefined;

  return (
    <section className={cn("admin-panel", className)}>
      {hasHeader ? (
        <div className="admin-panel-card__header">
          {title !== undefined ? (
            <h2 className="admin-panel-card__title">{title}</h2>
          ) : (
            <span />
          )}
          {action ? <div className="admin-panel-card__action">{action}</div> : null}
        </div>
      ) : null}
      <div className="admin-panel-card__body">{children}</div>
    </section>
  );
}
