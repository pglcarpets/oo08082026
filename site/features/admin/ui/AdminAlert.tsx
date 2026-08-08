import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AdminAlertVariant = "warn" | "error" | "info" | "success";

export type AdminAlertProps = {
  variant: AdminAlertVariant;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  role?: "alert" | "status";
} & Omit<React.ComponentPropsWithoutRef<"div">, "className" | "role" | "children">;

/**
 * FOCSS admin alert — uses `.admin-alert` / `.admin-alert--*` from
 * `focss/admin/base/primitives.css`. No shadcn Alert registry.
 */
export function AdminAlert({
  variant,
  title,
  children,
  className,
  role = "alert",
  ...props
}: AdminAlertProps) {
  return (
    <div
      role={role}
      className={cn("admin-alert", `admin-alert--${variant}`, className)}
      {...props}
    >
      {title !== undefined ? <strong className="admin-alert__title">{title}</strong> : null}
      <div className="admin-alert__body">{children}</div>
    </div>
  );
}
