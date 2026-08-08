import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** FOCSS field wrapper — no Radix. */
export function Field({
  label,
  htmlFor,
  description,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  description?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("admin-field", className)}>
      <label className="admin-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {description && !error ? (
        <p className="admin-field__help">{description}</p>
      ) : null}
      {error ? <p className="admin-field__error">{error}</p> : null}
    </div>
  );
}
