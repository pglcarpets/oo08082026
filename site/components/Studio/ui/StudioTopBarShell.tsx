"use client";
import React, { type ReactNode } from "react";
import Link from "next/link";
import { OneAndOnlyLogo } from "@/components/ui/Logo";

type TopBarShellProps = {
  productLabel: string;
  unitPill?: ReactNode;
};

/** Presentational top bar chrome — same wordmark as homepage Header. */
export function TopBarShell({ productLabel, unitPill }: TopBarShellProps) {
  return (
    <header className="topbar" data-testid="topbar">
      <div className="topbar__start">
        <div className="topbar__brand">
          <Link
            href="/"
            className="topbar__brand-logo"
            aria-label="One&Only - home"
          >
            <OneAndOnlyLogo
              variant="orange"
              className="topbar__brand-logo-img"
            />
          </Link>
          <div className="topbar__brand-text">{productLabel}</div>
        </div>
      </div>
      <div className="topbar__spacer" />
      <div className="topbar__end">
        {unitPill ? (
          <>
            {unitPill}
            <div className="topbar__separator" />
          </>
        ) : null}
        <div className="topbar__actions" id="topbar-actions-slot" />
      </div>
    </header>
  );
}

export default TopBarShell;
