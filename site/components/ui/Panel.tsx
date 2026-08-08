import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** FOCSS panel — no Radix/shadcn Card. */
export function Panel({
  className,
  children,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="panel"
      className={cn("admin-panel", className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("admin-panel__header", className)} {...props}>
      {children}
    </div>
  );
}

export function PanelBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("admin-panel__body", className)}>{children}</div>;
}
