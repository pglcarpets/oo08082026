"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { List, X } from "@phosphor-icons/react";
import { OneAndOnlyLogo } from "@/components/ui/Logo";
import { getMemberSuiteNavLinks } from "@/features/shared/shell/memberSuiteRoutes";

/**
 * Member-suite navigation header (dashboard, portal).
 * Admin console uses AdminLayoutShell — not this header.
 */
export function GlobalNavHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileMenuId = useId();

  const navLinks = getMemberSuiteNavLinks().map((link) => ({
    ...link,
    active: link.isActive(pathname),
  }));

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header
      className="shell-global-nav"
      role="banner"
      aria-label="Member workspace"
      data-menu-open={menuOpen ? "true" : undefined}
    >
      <div className="shell-top-accent" aria-hidden="true" />
      <div className="shell-global-nav__inner">
        <Link
          href="/dashboard"
          className="shell-global-nav__brand"
          aria-label="One&Only workspace - Go to dashboard"
        >
          <OneAndOnlyLogo
            variant="orange"
            className="shell-global-nav__wordmark h-7.5 max-w-[9.5rem] w-auto md:h-8.5 md:max-w-none xl:h-9"
          />
          <span className="shell-global-nav__badge hidden sm:inline">Suite</span>
        </Link>

        <div className="shell-global-nav__spacer flex-1" />

        <button
          type="button"
          className="shell-global-nav__menu-toggle"
          aria-expanded={menuOpen}
          aria-controls={mobileMenuId}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} aria-hidden /> : <List size={22} aria-hidden />}
          <span className="sr-only">{menuOpen ? "Close navigation menu" : "Open navigation menu"}</span>
        </button>

        <nav className="shell-global-nav__links shell-global-nav__links--desktop" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.active ? "page" : undefined}
              className={
                link.active
                  ? "shell-global-nav__link shell-global-nav__link--active"
                  : "shell-global-nav__link"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {menuOpen ? (
        <nav id={mobileMenuId} className="shell-global-nav__mobile" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.active ? "page" : undefined}
              className={
                link.active
                  ? "shell-global-nav__link shell-global-nav__link--active"
                  : "shell-global-nav__link"
              }
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
