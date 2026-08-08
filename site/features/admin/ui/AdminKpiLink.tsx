import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AdminKpiTone = "neutral" | "info" | "warn" | "success";

export type AdminKpiLinkProps = {
  href: string;
  label: string;
  hint: ReactNode;
  cta: ReactNode;
  tone: AdminKpiTone;
  hintClassName?: string;
  className?: string;
};

export function AdminKpiLink({
  href,
  label,
  hint,
  cta,
  tone,
  hintClassName,
  className,
}: AdminKpiLinkProps) {
  return (
    <Link href={href} className={cn("admin-kpi", `admin-kpi--${tone}`, className)}>
      <span className="admin-kpi__label">{label}</span>
      <span className={cn("admin-kpi__hint", hintClassName)}>{hint}</span>
      <span className="admin-kpi__cta">{cta}</span>
    </Link>
  );
}
