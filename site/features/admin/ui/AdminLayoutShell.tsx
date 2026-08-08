"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowSquareOut as ExternalLink,
  List as Menu,
  X,
} from "@phosphor-icons/react";
import { OneAndOnlyLogo } from "@/components/ui/Logo";
import {
  ADMIN_NAV_GROUPS,
  ADMIN_NAV_ITEMS,
  resolveAdminNavItem,
} from "./adminNav";
import { filterAdminNavItemsByFlags } from "@/lib/featureFlags";
import { useRuntimeFeatureFlags } from "@/lib/hooks/useRuntimeFeatureFlags";
import { isExternalAdminHref } from "@/lib/admin/techDocsUrl";

/** True only for the best (longest) matching nav href — avoids /admin/crm lighting up under /admin/crm/projects. */
function isActivePath(pathname: string, href: string, allHrefs: readonly string[]): boolean {
  if (isExternalAdminHref(href)) {
    return false;
  }
  const path =
    pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  const normalize = (h: string) =>
    h.endsWith("/") && h.length > 1 ? h.slice(0, -1) : h;

  let best: string | null = null;
  for (const candidate of allHrefs) {
    if (isExternalAdminHref(candidate)) {
      continue;
    }
    const c = normalize(candidate);
    if (c === "/admin") {
      if (path === "/admin") {best = c;}
      continue;
    }
    if (path === c || path.startsWith(`${c}/`)) {
      if (!best || c.length > best.length) {best = c;}
    }
  }
  return best === normalize(href);
}

export default function AdminLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const { flags } = useRuntimeFeatureFlags();
  const navGroups = ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: filterAdminNavItemsByFlags(group.items, flags),
  })).filter((group) => group.items.length > 0);
  const allNavHrefs = filterAdminNavItemsByFlags(ADMIN_NAV_ITEMS, flags).map(
    (item) => item.href,
  );
  const currentNav = resolveAdminNavItem(pathname);

  const toggleGroup = useCallback((title: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    mobileToggleRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!mobileOpen) {return;}
    const firstLink = sidebarRef.current?.querySelector<HTMLElement>("a[href], button");
    firstLink?.focus({ preventScroll: true });
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) {return;}
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen || !sidebarRef.current) {return;}

    const sidebar = sidebarRef.current;
    const focusable = () =>
      Array.from(
        sidebar.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((node) => !node.hasAttribute("disabled") && node.tabIndex !== -1);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobile();
        return;
      }
      if (event.key !== "Tab") {return;}

      const nodes = focusable();
      if (nodes.length === 0) {return;}

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, closeMobile]);

  return (
    <div className="shell-admin-layout" data-admin-layout>
      {/* Skip link lives once in root layout.tsx — do not duplicate here. */}
      <header
          className="shell-admin-header shell-admin-header--topbar"
          aria-label="Admin workspace"
          data-admin-topbar
          data-density="compact"
          data-testid="admin-topbar"
        >
          {/* Planner TopBar package: brand | center packs | actions (cool white stack). */}
          <div className="shell-admin-topbar">
            <div className="shell-admin-topbar__brand">
              <button
                ref={mobileToggleRef}
                type="button"
                className="shell-admin-mobile-toggle md:hidden"
                onClick={() => setMobileOpen((open) => !open)}
                aria-expanded={mobileOpen}
                aria-controls="admin-mobile-sidebar"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
              <Link
                href="/"
                className="shell-admin-brand"
                onClick={closeMobile}
                aria-label="One&Only home"
              >
                {/* Same wordmark as homepage Header (/logo-v2.webp) */}
                <OneAndOnlyLogo
                  variant="orange"
                  className="shell-admin-brand__wordmark h-7.5 max-w-[9.5rem] w-auto md:h-8.5 md:max-w-none xl:h-9"
                />
                <span className="shell-admin-brand__badge">Console</span>
              </Link>
            </div>

            <div
              className="shell-admin-topbar__center"
              role="group"
              aria-label="Current section"
            >
              {/* Single title in navbar — no "Now" stack; page H1s stay on non-hub routes */}
              <p className="shell-admin-context" aria-live="polite">
                <span className="shell-admin-context__title">
                  {currentNav?.label ?? "Admin"}
                </span>
              </p>
            </div>

            <div
              className="shell-admin-topbar__actions"
              data-testid="admin-topbar-actions"
              role="group"
              aria-label="External links"
            >
              {/* Secondary chrome — product work stays in-page (ADM-SHELL-02) */}
              <Link
                href="/"
                className="shell-admin-header-link"
                aria-label="View site"
                data-topbar-action="secondary"
              >
                <span className="shell-admin-header-link__label">View site</span>
                <ArrowUpRight size={14} aria-hidden />
              </Link>
              <Link
                href="/ooplanner"
                className="shell-admin-header-cta"
                aria-label="Open planner"
                data-topbar-action="external"
              >
                <span className="shell-admin-header-cta__label">Open planner</span>
                <ExternalLink size={14} aria-hidden />
              </Link>
            </div>
          </div>
        </header>

      <div className="shell-admin-frame">
          <aside
            ref={sidebarRef}
            id="admin-mobile-sidebar"
            className={`shell-admin-sidebar ${mobileOpen ? "shell-admin-sidebar--open" : ""}`}
            role={mobileOpen ? "dialog" : undefined}
            aria-modal={mobileOpen ? true : undefined}
            aria-label={mobileOpen ? "Admin navigation menu" : "Admin navigation"}
          >
            <div className="shell-admin-sidebar__scroll">
            <nav className="shell-admin-sidebar__nav" aria-label="Admin sections">
              {navGroups.map((group) => {
                const collapsed = Boolean(collapsedGroups[group.title]);
                const groupHasActive = group.items.some((item) =>
                  isActivePath(pathname, item.href, allNavHrefs),
                );
                const panelId = `admin-nav-group-${group.title.replace(/\s+/g, "-").toLowerCase()}`;
                return (
                  <div
                    key={group.title}
                    className={`shell-admin-nav-group${groupHasActive ? " shell-admin-nav-group--active" : ""}${collapsed ? " shell-admin-nav-group--collapsed" : ""}`}
                  >
                    <button
                      type="button"
                      className="shell-admin-nav-group__toggle"
                      onClick={() => toggleGroup(group.title)}
                      aria-expanded={!collapsed}
                      aria-controls={panelId}
                    >
                      <span className="shell-admin-nav-group__title">{group.title}</span>
                      <span className="shell-admin-nav-group__chevron" aria-hidden>
                        {collapsed ? "+" : "−"}
                      </span>
                    </button>
                    <div
                      id={panelId}
                      className="shell-admin-nav-group__items"
                      hidden={collapsed}
                    >
                      {group.items.map((item) => {
                        const active = isActivePath(pathname, item.href, allNavHrefs);
                        const Icon = item.icon;
                        const external =
                          item.external === true || isExternalAdminHref(item.href);
                        const className = `shell-admin-nav-link${active ? " shell-admin-nav-link--active" : ""}`;
                        const label = external
                          ? `${item.label} (opens in new tab)`
                          : item.label;
                        const body = (
                          <>
                            <span className="shell-admin-nav-link__icon" aria-hidden>
                              <Icon size={16} />
                            </span>
                            <span className="shell-admin-nav-link__text" aria-hidden>
                              <span className="shell-admin-nav-link__label">
                                {item.label}
                                {external ? (
                                  <ExternalLink
                                    size={12}
                                    className="shell-admin-nav-link__external"
                                    aria-hidden
                                  />
                                ) : null}
                              </span>
                              <span className="shell-admin-nav-link__hint">
                                {item.description}
                              </span>
                            </span>
                          </>
                        );
                        if (external) {
                          return (
                            <a
                              key={item.href}
                              href={item.href}
                              title={item.description}
                              onClick={closeMobile}
                              className={className}
                              aria-label={label}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {body}
                            </a>
                          );
                        }
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            title={item.description}
                            onClick={closeMobile}
                            className={className}
                            aria-current={active ? "page" : undefined}
                            aria-label={item.label}
                          >
                            {body}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
            <footer className="shell-admin-sidebar__footer">
              <p className="shell-admin-sidebar__footnote">One&amp;Only Admin</p>
              {currentNav ? (
                <p className="shell-admin-sidebar__current" title={currentNav.description}>
                  {currentNav.label}
                </p>
              ) : null}
            </footer>
          </aside>

        {mobileOpen ? (
          <button
            type="button"
            className="shell-admin-sidebar-backdrop md:hidden"
            aria-label="Close navigation"
            onClick={closeMobile}
          />
        ) : null}

        <div
          className="shell-admin-main"
          inert={mobileOpen ? true : undefined}
          aria-hidden={mobileOpen ? true : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
