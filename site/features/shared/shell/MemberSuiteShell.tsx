"use client";

import type { ReactNode } from "react";

import { GlobalNavHeader } from "@/features/shared/shell/GlobalNavHeader";

export type MemberSuiteShellVariant = "portal" | "dashboard" | "crm-standalone";

export type MemberSuiteShellProps = {
  variant: MemberSuiteShellVariant;
  children: ReactNode;
};

const VARIANT_CONFIG: Record<
  MemberSuiteShellVariant,
  { outerClass: string; frameClass: string; testId: string }
> = {
  portal: {
    outerClass: "shell-portal-page min-h-screen",
    frameClass: "shell-portal-page__frame mx-auto w-full max-w-7xl",
    testId: "portal-shell",
  },
  dashboard: {
    outerClass: "workspace-hub",
    frameClass: "workspace-hub__frame mx-auto flex w-full max-w-7xl flex-col",
    testId: "dashboard-hub",
  },
  "crm-standalone": {
    outerClass: "admin-page min-h-screen",
    frameClass: "admin-page__body mx-auto flex w-full max-w-7xl flex-col gap-8",
    testId: "crm-standalone-shell",
  },
};

/**
 * Shared member-suite chrome (header + page frame).
 * Portal outer frame is max-w-7xl; portal pages use inner max-w-4xl content width.
 */
export function MemberSuiteShell({ variant, children }: MemberSuiteShellProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <div
      className={config.outerClass}
      data-testid={config.testId}
      data-variant={variant}
    >
      <GlobalNavHeader />
      <div className={config.frameClass}>{children}</div>
    </div>
  );
}
