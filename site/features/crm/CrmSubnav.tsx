"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CRM_ADMIN_BASE,
  CRM_CLIENTS_PATH,
  CRM_PROJECTS_PATH,
  CRM_QUOTES_PATH,
} from "./crmRoutes";

const LINKS = [
  { href: CRM_ADMIN_BASE, label: "Hub", match: "exact" as const },
  { href: CRM_CLIENTS_PATH, label: "Clients", match: "prefix" as const },
  { href: CRM_PROJECTS_PATH, label: "Projects", match: "prefix" as const },
  { href: CRM_QUOTES_PATH, label: "Quotes", match: "prefix" as const },
  {
    href: "/admin/customer-queries",
    label: "Queries",
    match: "prefix" as const,
  },
] as const;

function isActive(pathname: string, href: string, match: "exact" | "prefix"): boolean {
  const path = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  const target = href.endsWith("/") && href.length > 1 ? href.slice(0, -1) : href;
  if (match === "exact") {return path === target;}
  if (target === CRM_ADMIN_BASE) {return path === target;}
  return path === target || path.startsWith(`${target}/`);
}

export function CrmSubnav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="crm-subnav" aria-label="CRM sections">
      <ul className="crm-subnav__list">
        {LINKS.map((link) => {
          const active = isActive(pathname, link.href, link.match);
          return (
            <li key={link.href} className="crm-subnav__item">
              <Link
                href={link.href}
                className={`crm-subnav__link${active ? " crm-subnav__link--active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
