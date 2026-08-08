import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { isExternalAdminHref } from "@/lib/admin/techDocsUrl";
import { cn } from "@/lib/utils";

export type AdminHubLinkCardProps = {
  href: string;
  label: string;
  description: string;
  icon: Icon;
  cta?: ReactNode;
  className?: string;
  external?: boolean;
};

export function AdminHubLinkCard({
  href,
  label,
  description,
  icon: IconComponent,
  cta,
  className,
  external,
}: AdminHubLinkCardProps) {
  const isExternal = external === true || isExternalAdminHref(href);
  const body = (
    <>
      <span className="shell-admin-card__icon" aria-hidden>
        <IconComponent size={16} />
      </span>
      <h3 className="shell-admin-card__title">{label}</h3>
      <p className="shell-admin-card__desc">{description}</p>
      <span className="shell-admin-card__cta">{cta ?? (isExternal ? "Open ↗" : "Open")}</span>
    </>
  );

  if (isExternal) {
    return (
      <a
        href={href}
        className={cn("shell-admin-card", className)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label} (opens in new tab)`}
      >
        {body}
      </a>
    );
  }

  return (
    <Link href={href} className={cn("shell-admin-card", className)}>
      {body}
    </Link>
  );
}
